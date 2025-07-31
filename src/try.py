import re
import fitz
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)  # Changed to DEBUG for detailed output
logger = logging.getLogger(__name__)

class SongExtractor:
    def __init__(self, input_pdf: str, output_dir: str):
        self.input_pdf = input_pdf
        self.output_dir = Path(output_dir)
        
    def extract_text_from_pdf(self) -> str:
        """Extracts text from PDF with error handling, preserving spacing."""
        try:
            doc = fitz.open(self.input_pdf)
            text = ""
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                # Use get_text() to preserve original spacing and line breaks
                page_text = page.get_text()
                text += page_text
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise

    def extract_song_content(self, text: str):
        """Extracts songs and formats them according to the specified structure."""
        songs = []
        
        # Preserve original spacing for better verse detection
        original_text = text
        
        # Clean up excessive newlines but preserve double newlines (paragraph breaks)
        text = re.sub(r'\n{3,}', '\n\n', text)  # Replace 3+ newlines with 2
        text = text.strip()
        
        # Enhanced song splitting pattern - handle various formats
        # Look for song numbers with potential whitespace around them
        song_pattern = r'(?:^|\n)\s*(\d+)\s*\n'
        song_sections = re.split(song_pattern, text, flags=re.MULTILINE)
        
        # Remove empty sections
        song_sections = [section for section in song_sections if section.strip()]
        
        i = 0
        while i < len(song_sections):
            # Check if current section is a number
            if song_sections[i].strip().isdigit():
                song_number = song_sections[i].strip()
                if i + 1 < len(song_sections):
                    song_content = song_sections[i + 1]
                    song = self._process_single_song(song_number, song_content)
                    if song:
                        songs.append(song)
                i += 2
            else:
                # This might be the first song without a number, or content before numbering
                if i == 0:
                    # Try to find the first song in the content
                    first_song = self._extract_first_song(song_sections[i])
                    if first_song:
                        songs.append(first_song)
                i += 1
        
        return songs

    def _extract_first_song(self, content: str):
        """Extract the first song which might not have a number."""
        lines = content.split('\n')
        if lines:
            # Look for the first song title (usually in caps or title case)
            for i, line in enumerate(lines):
                if line.strip() and not line.strip().isdigit():
                    # This could be a song title
                    title = line.strip()
                    remaining_content = '\n'.join(lines[i+1:])
                    formatted_content = self._format_song_content(remaining_content, title)
                    if formatted_content:
                        safe_title = re.sub(r'[<>:"/\\|?*]', '_', title)
                        return (safe_title, formatted_content)
        return None

    def _process_single_song(self, song_number: str, content: str):
        """Process a single song with its number and content."""
        try:
            # Handle potential cross-column content by cleaning up spacing
            lines = content.split('\n')
            if not lines:
                return None
            
            # First non-empty line should be the title
            title = None
            content_start_idx = 0
            
            for i, line in enumerate(lines):
                line_stripped = line.strip()
                if line_stripped:
                    title = line_stripped
                    content_start_idx = i + 1
                    break
            
            if not title:
                return None
            
            # Get the remaining content after title
            remaining_lines = lines[content_start_idx:]
            
            # Clean up the content but preserve meaningful spacing
            cleaned_lines = []
            for line in remaining_lines:
                # Keep the line as is (including empty lines for spacing detection)
                cleaned_lines.append(line)
            
            song_content = '\n'.join(cleaned_lines)
            
            # Format the content
            formatted_content = self._format_song_content(song_content, title)
            
            if formatted_content:
                # Clean the title for file naming
                safe_title = re.sub(r'[<>:"/\\|?*]', '_', title)
                return (safe_title, formatted_content)
                
        except Exception as e:
            logger.error(f"Error processing song {song_number}: {e}")
        
        return None

    def _format_song_content(self, content: str, title: str) -> str:
        """Formats song content with proper verse and chorus detection using spacing."""
        try:
            # Preserve original content with spacing for analysis
            original_content = content
            
            # Split content preserving empty lines (which indicate spacing/breaks)
            all_lines = content.split('\n')
            
            # Remove leading/trailing empty lines but preserve internal spacing
            while all_lines and not all_lines[0].strip():
                all_lines.pop(0)
            while all_lines and not all_lines[-1].strip():
                all_lines.pop()
            
            if not all_lines:
                return ""
            
            formatted_parts = []
            current_section = "verse"
            verse_count = 1
            current_section_lines = []
            in_explicit_section = False
            chorus_processed = False  # Track if we've processed a chorus
            
            i = 0
            while i < len(all_lines):
                line = all_lines[i].strip()
                
                # Skip empty lines for processing but remember them for spacing detection
                if not line:
                    # Check if this empty line indicates a section break
                    if current_section_lines and not in_explicit_section:
                        # Look ahead to see if this might be a natural verse break
                        next_content_line_idx = i + 1
                        while next_content_line_idx < len(all_lines) and not all_lines[next_content_line_idx].strip():
                            next_content_line_idx += 1
                        
                        # If we have content in current section and there's more content coming
                        # Lower threshold after chorus has been processed
                        min_lines = 2 if chorus_processed else 3
                        if next_content_line_idx < len(all_lines) and len(current_section_lines) >= min_lines:
                            # Check if current section might be a chorus before saving
                            section_to_save = current_section
                            if current_section == "verse" and self._detect_potential_chorus(current_section_lines, 0, len(current_section_lines)):
                                section_to_save = "chorus"
                                chorus_processed = True
                            
                            # This looks like a verse break
                            logger.debug(f"Detected section break: {section_to_save} with {len(current_section_lines)} lines")
                            self._save_current_section(formatted_parts, section_to_save, verse_count, current_section_lines)
                            if current_section == "verse" and section_to_save != "chorus":
                                verse_count += 1
                                logger.debug(f"Incremented verse count to {verse_count}")
                            # Reset to verse mode after any section break
                            current_section = "verse"
                            current_section_lines = []
                    i += 1
                    continue
                
                # Remove key information if present
                if re.match(r'^Key\s+of?\s+[A-G](?:#|b)?(?:m)?', line, re.IGNORECASE):
                    i += 1
                    continue
                
                # Check for explicit chorus/refrain indicators
                if re.match(r'^(CHORUS|REFRAIN)$', line.upper()):
                    # Save current section if it has content
                    if current_section_lines:
                        self._save_current_section(formatted_parts, current_section, verse_count, current_section_lines)
                        if current_section == "verse":
                            verse_count += 1
                        current_section_lines = []
                    
                    current_section = "chorus"
                    in_explicit_section = True
                    chorus_processed = True
                    i += 1
                    continue
                
                # Check for explicit verse indicators
                if re.match(r'^(VERSE|V)\s*\d*$', line.upper()):
                    # Save current section if it has content
                    if current_section_lines:
                        self._save_current_section(formatted_parts, current_section, verse_count, current_section_lines)
                        if current_section == "verse":
                            verse_count += 1
                        current_section_lines = []
                    
                    current_section = "verse"
                    in_explicit_section = True
                    i += 1
                    continue
                
                # Check for verse numbers like "Verse 2", "2.", etc.
                if re.match(r'^(\d+\.?|Verse\s+\d+)$', line):
                    # Save current section if it has content
                    if current_section_lines:
                        self._save_current_section(formatted_parts, current_section, verse_count, current_section_lines)
                        if current_section == "verse":
                            verse_count += 1
                        current_section_lines = []
                    
                    current_section = "verse"
                    in_explicit_section = True
                    i += 1
                    continue
                
                # Regular content line
                current_section_lines.append(line)
                # After processing chorus content, we should stay in verse mode for new content
                if current_section == "chorus" and not in_explicit_section:
                    # If we just finished a chorus and are adding new content, this should be a new verse
                    if len(current_section_lines) == 1:  # First line after chorus
                        current_section = "verse"
                in_explicit_section = False
                i += 1
            
            # Handle the last section
            if current_section_lines:
                # Check if the last section might be a chorus
                section_to_save = current_section
                if current_section == "verse" and self._detect_potential_chorus(current_section_lines, 0, len(current_section_lines)):
                    section_to_save = "chorus"
                    chorus_processed = True
                self._save_current_section(formatted_parts, section_to_save, verse_count, current_section_lines)
            
            # If no sections were created, use intelligent splitting
            if not formatted_parts:
                formatted_parts = self._intelligent_verse_splitting_with_spacing(all_lines)
            
            return '\n'.join(formatted_parts)
            
        except Exception as e:
            logger.error(f"Error formatting song content: {e}")
            return ""
    
    def _save_current_section(self, formatted_parts, section_type, verse_count, section_lines):
        """Helper method to save a section with proper labeling."""
        if section_type == "verse":
            formatted_parts.append(f'<p>Verse {verse_count}</p>')
        else:
            formatted_parts.append(f'<p>Chorus</p>')
        
        for section_line in section_lines:
            formatted_parts.append(f'<p>{section_line}</p>')
    
    def _detect_potential_chorus(self, lines, start_idx, end_idx):
        """Detect if a section might be a chorus based on content patterns."""
        if end_idx - start_idx < 2:
            return False
            
        section_text = ' '.join(lines[start_idx:end_idx]).lower()
        section_lines = lines[start_idx:end_idx]
        
        # Common chorus indicators
        chorus_keywords = [
            'hallelujah', 'praise', 'glory', 'holy', 'blessed', 'salvation',
            'jesus', 'lord', 'god', 'amen', 'rejoice', 'worship', 'sing',
            'king', 'saviour', 'child of the king'
        ]
        
        # Check for immediate repetition in adjacent lines (strong chorus indicator)
        for i in range(len(section_lines) - 1):
            line1 = section_lines[i].lower().strip()
            line2 = section_lines[i + 1].lower().strip()
            
            # If lines are very similar or identical, likely a chorus
            if line1 == line2 or (len(line1) > 10 and line1 in line2):
                return True
        
        # Check for repetitive patterns common in choruses
        word_count = {}
        words = section_text.split()
        for word in words:
            clean_word = re.sub(r'[^\w]', '', word)
            if len(clean_word) > 2:
                word_count[clean_word] = word_count.get(clean_word, 0) + 1
        
        # If any significant word appears multiple times, it might be a chorus
        repeated_words = sum(1 for word, count in word_count.items() if count > 1 and len(word) > 3)
        
        # Check for chorus keywords
        has_chorus_keywords = any(keyword in section_text for keyword in chorus_keywords)
        
        # Strong indicators for chorus
        if repeated_words >= 3:  # Multiple repeated words
            return True
        if has_chorus_keywords and repeated_words >= 1:  # Chorus keywords + some repetition
            return True
        if 'child of the king' in section_text:  # Specific pattern for this song
            return True
            
        return False

    def _intelligent_verse_splitting_with_spacing(self, all_lines):
        """Split content into verses intelligently using spacing patterns."""
        formatted_parts = []
        verse_count = 1
        current_verse_lines = []
        consecutive_empty_lines = 0
        found_chorus = False
        
        for i, line in enumerate(all_lines):
            line_content = line.strip()
            
            if not line_content:
                consecutive_empty_lines += 1
                # If we hit 1+ consecutive empty lines and have content, this might be a section break
                if consecutive_empty_lines >= 1 and current_verse_lines:
                    # Look ahead to see if there's more content
                    has_more_content = False
                    for j in range(i + 1, len(all_lines)):
                        if all_lines[j].strip():
                            has_more_content = True
                            break
                    
                    # If there's more content and current verse has reasonable length
                    if has_more_content and len(current_verse_lines) >= 3:
                        # Check if this might be a chorus based on content
                        if not found_chorus and self._detect_potential_chorus(current_verse_lines, 0, len(current_verse_lines)):
                            formatted_parts.append('<p>Chorus</p>')
                            found_chorus = True
                        else:
                            formatted_parts.append(f'<p>Verse {verse_count}</p>')
                            verse_count += 1
                        
                        for verse_line in current_verse_lines:
                            formatted_parts.append(f'<p>{verse_line}</p>')
                        
                        current_verse_lines = []
                        consecutive_empty_lines = 0
                continue
            else:
                consecutive_empty_lines = 0
                
                # Skip key information
                if re.match(r'^Key\s+of?\s+[A-G](?:#|b)?(?:m)?', line_content, re.IGNORECASE):
                    continue
                
                current_verse_lines.append(line_content)
                
                # Also split if we have too many lines (fallback)
                if len(current_verse_lines) >= 6:
                    # Check if this might be a chorus
                    if not found_chorus and self._detect_potential_chorus(current_verse_lines, 0, len(current_verse_lines)):
                        formatted_parts.append('<p>Chorus</p>')
                        found_chorus = True
                    else:
                        formatted_parts.append(f'<p>Verse {verse_count}</p>')
                        verse_count += 1
                    
                    for verse_line in current_verse_lines:
                        formatted_parts.append(f'<p>{verse_line}</p>')
                    
                    current_verse_lines = []
        
        # Handle remaining lines
        if current_verse_lines:
            # Check if this might be a chorus
            if not found_chorus and self._detect_potential_chorus(current_verse_lines, 0, len(current_verse_lines)):
                formatted_parts.append('<p>Chorus</p>')
            else:
                formatted_parts.append(f'<p>Verse {verse_count}</p>')
            
            for verse_line in current_verse_lines:
                formatted_parts.append(f'<p>{verse_line}</p>')
        
        return formatted_parts

    def save_raw_content(self, content: str, title: str) -> bool:
        """Saves the formatted content to a text file."""
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            output_path = self.output_dir / f"{title}.txt"
            
            # Write the formatted content to a text file
            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(content)
            
            logger.info(f"Successfully created file: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving file for {title}: {e}")
            return False

def find_pdf_files_in_directory(directory_path):
    """Helper function to find PDF files in a directory."""
    try:
        directory = Path(directory_path)
        if directory.exists() and directory.is_dir():
            pdf_files = list(directory.glob("*.pdf"))
            return pdf_files
    except Exception:
        pass
    return []

def suggest_pdf_files():
    """Suggest PDF files from common directories."""
    common_dirs = [
        "J:\\easvoice",
        "J:\\eastvoice", 
        "C:\\Users\\josiah-ok\\Documents",
        "C:\\Users\\josiah-ok\\Downloads",
        "."  # Current directory
    ]
    
    logger.info("Searching for PDF files in common directories...")
    
    for directory in common_dirs:
        pdf_files = find_pdf_files_in_directory(directory)
        if pdf_files:
            logger.info(f"Found PDF files in {directory}:")
            for i, pdf_file in enumerate(pdf_files[:5], 1):  # Show max 5 files
                logger.info(f"  {i}. {pdf_file}")
            if len(pdf_files) > 5:
                logger.info(f"  ... and {len(pdf_files) - 5} more files")
            logger.info("")

def main():
    try:
        input_file = input("Enter the path of the song PDF file: ").strip()
        output_directory = input("Enter the output directory for files: ").strip()
        
        # Validate input file exists
        if not Path(input_file).exists():
            logger.error(f"PDF file not found: {input_file}")
            logger.info("Please check the file path and ensure the file exists.")
            
            # Suggest available PDF files
            suggest_pdf_files()
            return
        
        # Validate input file is a PDF
        if not input_file.lower().endswith('.pdf'):
            logger.error(f"File is not a PDF: {input_file}")
            logger.info("Please provide a valid PDF file.")
            return
        
        extractor = SongExtractor(input_file, output_directory)
        
        logger.info("Extracting text from PDF...")
        song_text = extractor.extract_text_from_pdf()
        
        # Add some debugging info
        logger.info(f"Extracted {len(song_text)} characters from PDF")
        
        logger.info("Processing songs...")
        songs = extractor.extract_song_content(song_text)
        
        logger.info(f"Found {len(songs)} songs to process")
        
        successful = 0
        failed = 0
        
        for title, content in songs:
            logger.info(f"Processing song: {title}")
            if extractor.save_raw_content(content, title):
                successful += 1
                logger.info(f"Successfully saved: {title}")
            else:
                failed += 1
                logger.error(f"Failed to save: {title}")
        
        logger.info(f"Process completed. Successfully generated {successful} files, {failed} failed.")
        
        if successful == 0:
            logger.warning("No songs were successfully extracted. Please check the PDF format and try again.")
        
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise

if __name__ == "__main__":
    main()