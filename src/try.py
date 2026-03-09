import re
import fitz  # PyMuPDF
from pathlib import Path
import logging
import json
import base64
from datetime import datetime
from typing import List, Dict, Tuple

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SongSlide:
    """Represents a single slide in a song"""
    def __init__(self, slide_type: str, number: int, content: str, label: str):
        self.id = f"slide-{slide_type}-{number}"
        self.type = slide_type
        self.number = number
        self.content = content
        self.label = label
    
    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "number": self.number,
            "content": self.content,
            "label": self.label
        }


class SongExtractor:
    def __init__(self, input_pdf: str, output_dir: str):
        self.input_pdf = input_pdf
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def extract_text_from_pdf(self) -> str:
        """Extracts text from PDF (single column layout)"""
        try:
            doc = fitz.open(self.input_pdf)
            text = ""
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                # Simple text extraction for single-column layout
                text += page.get_text()
                text += "\n"
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise

    def extract_songs(self, text: str) -> List[Tuple[str, List[SongSlide]]]:
        """
        Extract songs using a two-phase approach:
        Phase 1: Identify song boundaries (number + TITLE)
        Phase 2: Parse verses within each song
        """
        songs = []
        
        # PHASE 1: Find all song boundaries
        song_sections = self._identify_song_sections(text)
        
        logger.info(f"Phase 1: Identified {len(song_sections)} song sections")
        
        # PHASE 2: Parse each song section
        for song_num, song_title, song_content in song_sections:
            logger.info(f"Processing Song #{song_num}: {song_title}")
            slides = self._parse_song_content(song_content, song_title)
            
            if slides:
                songs.append((song_title, slides))
                logger.info(f"  → Created {len(slides)} slides")
            else:
                logger.warning(f"  → No slides created (empty content?)")
        
        return songs
    
    def _identify_song_sections(self, text: str) -> List[Tuple[str, str, str]]:
        """
        Phase 1: Identify song boundaries
        Returns: List of (song_number, title, content) tuples
        """
        song_sections = []
        
        # Pattern: Number at line start + ALL CAPS TITLE (possibly multi-word)
        # Song titles are typically 2-10 words, all uppercase
        song_start_pattern = r'^(\d+)\s*\n\s*([A-Z][A-Z\s,\'-]{2,100}?)\s*$'
        
        lines = text.split('\n')
        logger.info(f"Scanning {len(lines)} lines for song patterns...")
        
        i = 0
        while i < len(lines):
            # Look for song number + title pattern
            if i + 1 < len(lines):
                combined = f"{lines[i]}\n{lines[i + 1]}"
                match = re.match(song_start_pattern, combined, re.MULTILINE)
                
                if match:
                    song_num = match.group(1)
                    song_title = match.group(2).strip()
                    
                    logger.info(f"Found song: #{song_num} - {song_title}")
                    
                    # Find where this song ends (next song starts or EOF)
                    song_start_idx = i + 2  # Content starts after number and title
                    song_end_idx = len(lines)
                    
                    # Look ahead for next song
                    j = i + 2
                    while j + 1 < len(lines):
                        next_combined = f"{lines[j]}\n{lines[j + 1]}"
                        if re.match(song_start_pattern, next_combined, re.MULTILINE):
                            song_end_idx = j
                            break
                        j += 1
                    
                    # Extract song content
                    song_content = '\n'.join(lines[song_start_idx:song_end_idx]).strip()
                    
                    song_sections.append((song_num, song_title, song_content))
                    
                    # Skip to end of this song
                    i = song_end_idx
                    continue
            
            i += 1
        
        logger.info(f"Total songs found: {len(song_sections)}")
        return song_sections

    def _parse_song_content(self, content: str, title: str) -> List[SongSlide]:
        """
        Parse song content into verse/chorus slides using spacing as primary delimiter
        Empty lines in PDF indicate verse boundaries
        """
        slides = []
        
        # Split by double newlines (empty lines = verse boundaries in PDF)
        sections = re.split(r'\n\s*\n+', content.strip())
        
        verse_count = 0
        slide_id = 1
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
            
            # Process lines in this section
            lines = section.split('\n')
            cleaned_lines = []
            section_type = "verse"  # Default
            
            for line in lines:
                line = line.strip()
                
                # Check for CHORUS marker
                if re.match(r'^(CHORUS|Chorus|REFRAIN|Refrain)$', line, re.IGNORECASE):
                    section_type = "chorus"
                    continue  # Skip the marker itself
                
                # Skip verse markers like "Verse 1", "V1", etc. - we auto-number
                if re.match(r'^(?:VERSE|Verse|V)?\s*(\d+)\.?$', line, re.IGNORECASE):
                    continue
                
                # Skip key signatures and chord notations
                if re.match(r'^Key\s+', line, re.IGNORECASE):
                    continue
                if re.match(r'^[A-G](#|b)?(m|maj|min|dim|aug)?(\d)?$', line):
                    continue
                
                if line:
                    cleaned_lines.append(line)
            
            if not cleaned_lines:
                continue
            
            # If no explicit CHORUS marker, try to detect
            if section_type == "verse":
                if self._detect_chorus_patterns(cleaned_lines):
                    section_type = "chorus"
            
            # Create slide
            content_text = '\n'.join(cleaned_lines)
            
            if section_type == "chorus":
                slide = SongSlide(
                    "chorus",
                    1,
                    content_text,
                    "Chorus"
                )
            else:
                verse_count += 1
                slide = SongSlide(
                    "verse",
                    verse_count,
                    content_text,
                    f"Verse {verse_count}"
                )
            
            slides.append(slide)
            slide_id += 1
        
        # Fallback: If no sections found (no empty lines), group by line count
        if not slides:
            slides = self._parse_by_line_grouping(content)
        
        return slides
    
    def _parse_by_line_grouping(self, content: str) -> List[SongSlide]:
        """
        Fallback parser when no empty line delimiters exist
        Groups lines into 4-6 line sections
        """
        slides = []
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        verse_count = 0
        slide_id = 1
        lines_per_verse = 5
        
        i = 0
        while i < len(lines):
            section_lines = lines[i:min(i + lines_per_verse, len(lines))]
            
            # Detect chorus
            is_chorus = self._detect_chorus_patterns(section_lines)
            content_text = '\n'.join(section_lines)
            
            if is_chorus:
                slide = SongSlide(
                    "chorus",
                    1,
                    content_text,
                    "Chorus"
                )
            else:
                verse_count += 1
                slide = SongSlide(
                    "verse",
                    verse_count,
                    content_text,
                    f"Verse {verse_count}"
                )
            
            slides.append(slide)
            slide_id += 1
            i += lines_per_verse
        
        return slides

    def _detect_chorus_patterns(self, lines: List[str]) -> bool:
        """
        Detect if content looks like a chorus based on:
        1. Line repetition
        2. Chorus keywords
        3. Word repetition patterns
        """
        if len(lines) < 2:
            return False
        
        text = ' '.join(lines).lower()
        
        # Check for repetition in adjacent lines
        for i in range(len(lines) - 1):
            line1 = lines[i].lower().strip()
            line2 = lines[i + 1].lower().strip()
            if line1 == line2 or (len(line1) > 10 and line1 in line2):
                return True
        
        # Common chorus keywords
        chorus_keywords = ['hallelujah', 'praise', 'glory', 'holy', 'blessed',
                          'jesus', 'lord', 'saviour', 'savior', 'amen', 'rejoice', 'king']
        
        keyword_count = sum(1 for keyword in chorus_keywords if keyword in text)
        
        # Check for word repetition
        words = text.split()
        word_freq = {}
        for word in words:
            if len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        repeated_words = sum(1 for count in word_freq.values() if count > 1)
        
        # Chorus indicators
        return keyword_count >= 2 or repeated_words >= 3

    def save_song_as_evsong(self, title: str, slides: List[SongSlide]) -> bool:
        """Save song in .evsong format (base64-encoded JSON)"""
        try:
            # Clean title for filename
            safe_title = re.sub(r'[<>:"/\\|?*]', '_', title)
            output_path = self.output_dir / f"{safe_title}.evsong"
            
            # Create song data structure
            song_data = {
                "version": "1.0",
                "metadata": {
                    "created": datetime.now().isoformat(),
                    "modified": datetime.now().isoformat(),
                    "isPrelisted": False
                },
                "title": title,
                "slides": [slide.to_dict() for slide in slides]
            }
            
            # Convert to JSON string
            json_string = json.dumps(song_data, indent=2, ensure_ascii=False)
            
            # Encode to base64
            encoded_content = base64.b64encode(json_string.encode('utf-8')).decode('utf-8')
            
            # Write to file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(encoded_content)
            
            logger.info(f"✓ Saved: {safe_title}.evsong ({len(slides)} slides)")
            return True
            
        except Exception as e:
            logger.error(f"✗ Error saving {title}: {e}")
            return False


def main():
    print("\n" + "="*60)
    print("  Song Extractor - PDF to .evsong Converter")
    print("="*60 + "\n")
    
    try:
        # Get input
        input_file = input("Enter PDF file path: ").strip().strip('"')
        output_directory = input("Enter output directory: ").strip().strip('"') or "./extracted_songs"
        
        # Validate PDF exists
        if not Path(input_file).exists():
            logger.error(f"PDF file not found: {input_file}")
            return
        
        if not input_file.lower().endswith('.pdf'):
            logger.error("File must be a PDF")
            return
        
        # Extract songs
        extractor = SongExtractor(input_file, output_directory)
        
        logger.info("📖 Extracting text from PDF...")
        text = extractor.extract_text_from_pdf()
        
        # Debug: Show first 1000 characters of extracted text
        logger.info(f"📝 Extracted {len(text)} characters")
        logger.info(f"First 1000 chars:\n{text[:1000]}\n")
        
        logger.info(f"📝 Processing songs...")
        songs = extractor.extract_songs(text)
        
        if not songs:
            logger.warning("⚠️  No songs found in PDF. Check the format.")
            return
        
        logger.info(f"\n🎵 Found {len(songs)} songs\n")
        
        # Save songs
        successful = 0
        failed = 0
        
        for title, slides in songs:
            if extractor.save_song_as_evsong(title, slides):
                successful += 1
            else:
                failed += 1
        
        # Summary
        print("\n" + "="*60)
        print(f"  ✅ Successfully extracted: {successful} songs")
        if failed > 0:
            print(f"  ❌ Failed: {failed} songs")
        print(f"  📁 Output directory: {output_directory}")
        print("="*60 + "\n")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Process cancelled by user")
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()
