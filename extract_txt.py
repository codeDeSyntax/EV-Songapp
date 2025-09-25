import re
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TxtSongExtractor:
    def __init__(self, output_dir: str):
        self.input_file = Path("src/try.txt")  # Fixed path within the project
        self.output_dir = Path(output_dir)
        
    def read_txt_file(self) -> str:
        """Reads the try.txt file from the project."""
        try:
            if not self.input_file.exists():
                raise FileNotFoundError(f"File {self.input_file} not found in the project")
                
            with open(self.input_file, 'r', encoding='utf-8') as file:
                content = file.read()
            return content
        except Exception as e:
            logger.error(f"Error reading txt file: {e}")
            raise

    def extract_songs(self, text: str):
        """Extracts songs from the txt file according to the specified format."""
        songs = []
        
        # Clean text by removing leading/trailing whitespace and normalize line endings
        text = text.strip()
        
        # Pattern to match song number followed by content until next song number
        # This handles two formats:
        # 1. number -> title -> "Key of X" -> content -> next number
        # 2. number -> title -> content -> next number (no key line)
        
        # First, try to match songs with "Key of X" line
        song_pattern_with_key = re.compile(r'(\d+[A-Za-z]*)\n([^\n]+)\nKey of [^\n]+\n(.*?)(?=\n\d+[A-Za-z]*\n|$)', re.DOTALL)
        matches_with_key = song_pattern_with_key.findall(text)
        
        # Then, find songs without "Key of X" line by removing the matched sections first
        text_without_key_songs = text
        for match in matches_with_key:
            song_num, title, content = match
            full_match = f"{song_num}\n{title}\nKey of"
            # Remove the matched section to avoid duplicates
            text_without_key_songs = re.sub(
                rf'{re.escape(song_num)}\n{re.escape(title)}\nKey of [^\n]+\n.*?(?=\n\d+[A-Za-z]*\n|$)',
                '',
                text_without_key_songs,
                flags=re.DOTALL
            )
        
        # Now match songs without "Key of X" line from the remaining text
        song_pattern_no_key = re.compile(r'(\d+[A-Za-z]*)\n([^\n]+)\n(.*?)(?=\n\d+[A-Za-z]*\n|$)', re.DOTALL)
        matches_no_key = song_pattern_no_key.findall(text_without_key_songs)
        
        # Combine all matches
        matches = matches_with_key + matches_no_key
        
        # Sort by song number to maintain order
        matches.sort(key=lambda x: int(re.match(r'(\d+)', x[0]).group(1)))
        
        for song_number, title, content in matches:
            try:
                # Extract just the numeric part from song number for cleaner file naming
                numeric_part = re.match(r'(\d+)', song_number).group(1)
                
                # Clean the title for file naming and capitalize first letter
                clean_title = title.strip()
                if clean_title:
                    # Capitalize the first letter
                    clean_title = clean_title[0].upper() + clean_title[1:]
                safe_title = re.sub(r'[<>:"/\\|?*]', '_', clean_title)
                
                # Format the content with "Verse 1" delimiter
                formatted_content = self._format_song_content(content.strip(), title.strip())
                
                if formatted_content:
                    # Name format: just the title (no song number or hyphen)
                    filename = safe_title
                    songs.append((filename, formatted_content))
                    logger.info(f"Processed song {song_number}: {title}")
                
            except Exception as e:
                logger.error(f"Error processing song {song_number}: {e}")
                continue
                
        return songs

    def _format_song_content(self, content: str, title: str) -> str:
        """Formats song content preserving verse/chorus structure from the original text."""
        try:
            # Split content into lines and remove empty lines
            lines = [line.strip() for line in content.split('\n') if line.strip()]
            
            if not lines:
                return ""
            
            formatted_parts = []
            
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
            
            # If no verse markers were found, add default "Verse 1" at the beginning
            if not any('Verse' in part or 'Chorus' in part or 'Refrain' in part for part in formatted_parts):
                formatted_parts.insert(0, '<p>Verse 1</p>')
            
            # Join all parts with newlines
            return '\n'.join(formatted_parts)
            
        except Exception as e:
            logger.error(f"Error formatting song content for '{title}': {e}")
            return ""

    def save_song_file(self, content: str, filename: str) -> bool:
        """Saves the formatted content to a text file."""
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            output_path = self.output_dir / f"{filename}.txt"
            
            # Write the formatted content to a text file
            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(content)
            
            logger.info(f"Successfully created file: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving file '{filename}': {e}")
            return False

def main():
    try:
        output_directory = input("Enter the output directory for song files: ").strip()
        
        extractor = TxtSongExtractor(output_directory)
        
        logger.info("Reading songs from try.txt...")
        song_text = extractor.read_txt_file()
        
        logger.info("Processing songs...")
        songs = extractor.extract_songs(song_text)
        
        if not songs:
            logger.warning("No songs found in the file")
            return
        
        successful = 0
        failed = 0
        
        logger.info(f"Found {len(songs)} songs to process")
        
        for filename, content in songs:
            if extractor.save_song_file(content, filename):
                successful += 1
            else:
                failed += 1
        
        logger.info(f"Process completed. Successfully generated {successful} files, {failed} failed.")
        
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise

if __name__ == "__main__":
    main()
