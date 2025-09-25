import re
import fitz
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SongExtractor:
    def __init__(self, input_pdf: str, output_dir: str):
        self.input_pdf = input_pdf
        self.output_dir = Path(output_dir)
        
    def extract_text_from_pdf(self) -> str:
        """Extracts text from PDF with error handling."""
        try:
            doc = fitz.open(self.input_pdf)
            text = ""
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                text += page.get_text("text")
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise

    def extract_song_content(self, text: str):
        """Extracts songs and formats them according to the specified structure."""
        songs = []
        # Modified pattern to better handle song separation
        song_pattern = re.compile(r'(\d+)\n([^\d]+?)(?=\n\d+\n|$)', re.S)
        
        for match in song_pattern.finditer(text):
            try:
                song_content = match.group(2).strip()
                
                # Extract title (first line)
                title_match = re.match(r'([^\n]+)', song_content)
                if not title_match:
                    continue
                    
                title = title_match.group(1).strip()
                # Remove title from content
                song_content = song_content[len(title):].strip()
                
                # Remove key information if present
                key_pattern = re.compile(r'^Key of [A-G](?:#|b)?(?:m)?\n', re.MULTILINE)
                song_content = key_pattern.sub('', song_content).strip()
                
                # Clean the title for file naming
                safe_title = re.sub(r'[<>:"/\\|?*]', '_', title)
                
                # Format the content
                formatted_content = self._format_song_content(song_content)
                
                if formatted_content:
                    songs.append((safe_title, formatted_content))
                
            except Exception as e:
                logger.error(f"Error processing song: {e}")
                continue
                
        return songs

    def _format_song_content(self, content: str) -> str:
        """Formats song content preserving verse/chorus structure from the original text."""
        try:
            # Split content into lines and remove empty lines
            lines = [line.strip() for line in content.split('\n') if line.strip()]
            
            if not lines:
                return ""
            
            formatted_parts = []
            current_section = None
            
            for line in lines:
                # Check if this line is a section marker (Verse 1, Verse 2, Chorus, etc.)
                section_match = re.match(r'^(Verse\s+\d+|Chorus|Refrain|Bridge)$', line.strip(), re.IGNORECASE)
                
                if section_match:
                    # This is a section header - add it as a p tag
                    current_section = section_match.group(1).title()  # Capitalize properly
                    formatted_parts.append(f'<p>{current_section}</p>')
                else:
                    # This is a content line - add it as a p tag
                    formatted_parts.append(f'<p>{line}</p>')
            
            # If no sections were found, add default "Verse 1" at the beginning
            if not any('Verse' in part or 'Chorus' in part or 'Refrain' in part for part in formatted_parts):
                formatted_parts.insert(0, '<p>Verse 1</p>')
            
            # Join all parts with newlines
            return '\n'.join(formatted_parts)
            
        except Exception as e:
            logger.error(f"Error formatting song content: {e}")
            return ""

    def save_raw_content(self, content: str, title: str) -> bool:
        """Saves the raw content directly to a text file."""
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

def main():
    try:
        input_file = input("Enter the path of the song PDF file: ").strip()
        output_directory = input("Enter the output directory for files: ").strip()
        
        extractor = SongExtractor(input_file, output_directory)
        
        logger.info("Extracting text from PDF...")
        song_text = extractor.extract_text_from_pdf()
        
        logger.info("Processing songs...")
        songs = extractor.extract_song_content(song_text)
        
        successful = 0
        failed = 0
        
        for title, content in songs:
            if extractor.save_raw_content(content, title):
                successful += 1
            else:
                failed += 1
        
        logger.info(f"Process completed. Successfully generated {successful} files, {failed} failed.")
        
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise

if __name__ == "__main__":
    main()