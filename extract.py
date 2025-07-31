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
        """Formats song content with a simple approach based on line counts."""
        try:
            # Split content into lines and remove empty lines
            lines = [line.strip() for line in content.split('\n') if line.strip()]
            
            formatted_parts = []
            verse_count = 1
            line_count = 0
            in_chorus = False
            
            # Start with the first verse
            formatted_parts.append(f'<p>Verse {verse_count}</p>')
            
            for i, line in enumerate(lines):
                # Check if this line indicates a chorus
                if 'CHORUS' in line.upper() or line.upper() == 'REFRAIN':
                    formatted_parts.append('<p>Chorus</p>')
                    in_chorus = True
                    line_count = 0
                    continue  # Skip the chorus label
                
                # Add the current line
                formatted_parts.append(f'<p>{line}</p>')
                line_count += 1
                
                # Check if we've reached approximately 5 lines (a typical verse/chorus)
                # Or if the next line might start a new section
                next_line = lines[i + 1] if i < len(lines) - 1 else None
                
                if line_count >= 5 or (next_line and ('CHORUS' in next_line.upper() or next_line.upper() == 'REFRAIN')):
                    # If we're in a chorus, the next section is likely a verse
                    # If we're in a verse, the next section might be another verse if no chorus indicator
                    if in_chorus:
                        verse_count += 1
                        if i < len(lines) - 1 and not ('CHORUS' in next_line.upper() or next_line.upper() == 'REFRAIN'):
                            formatted_parts.append(f'<p>Verse {verse_count}</p>')
                            in_chorus = False
                    else:
                        # If next is not a chorus and we've finished a verse, start a new verse
                        if i < len(lines) - 1 and not ('CHORUS' in next_line.upper() or next_line.upper() == 'REFRAIN'):
                            verse_count += 1
                            formatted_parts.append(f'<p>Verse {verse_count}</p>')
                    
                    line_count = 0
            
            # Join all parts with newlines using template literals
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