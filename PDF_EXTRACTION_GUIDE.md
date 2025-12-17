# PDF Song Extraction Algorithm

## Overview

This document explains the two-phase algorithm used in `try.py` to extract songs from PDF files and convert them to `.evsong` format.

## Two-Phase Extraction Approach

### Phase 1: Identify Song Boundaries

**Goal:** Find all songs in the PDF before trying to parse content

**Pattern Detection:**

- Songs start with: `<number>\n<ALL CAPS TITLE>`
- Example: `12\nGLORY TO HIS NAME`
- Title pattern: 5-80 uppercase characters (allows spaces, commas, hyphens, apostrophes)

**Algorithm:**

1. Scan through all lines looking for number + title pattern
2. For each match, find where song ends (next song starts OR end of file)
3. Extract complete content between boundaries
4. Return list of `(song_number, title, content)` tuples

**Benefits:**

- Prevents mixing content from different songs
- Handles two-column layouts (content stays within song boundaries)
- Robust to formatting variations

### Phase 2: Parse Song Content

**Goal:** Split each song's content into verses and chorus

**Primary Method - Spacing-Based Detection:**

- PDF songs use **empty lines** to separate verses
- Algorithm splits on `\n\n` (double newlines)
- Each section becomes one slide

**Section Type Detection:**

1. **Explicit CHORUS marker** - If "CHORUS" appears at start of section → chorus type
2. **Pattern detection** - If no marker, analyze content:
   - Line repetition (same line appears twice)
   - Chorus keywords (hallelujah, praise, glory, jesus, lord, etc.)
   - Word repetition (same word appears 3+ times)

**Fallback Method - Line Grouping:**

- If no empty lines exist, group by 5-line sections
- Still applies chorus detection to each group
- Auto-numbers verses sequentially

## Two-Column PDF Handling

**Problem:** PDFs have two columns - standard extraction reads left-to-right across both columns

**Solution:** Block-based extraction with coordinate sorting

```python
blocks = page.get_text("blocks")  # Get text blocks with coordinates
sorted_blocks = sorted(blocks, key=lambda b: (
    round(b[1] / 20) * 20,  # Group by Y position (top-to-bottom)
    b[0]                     # Then sort by X position (left-to-right)
))
```

**How it works:**

- `b[1]` is Y-coordinate (vertical position)
- `b[0]` is X-coordinate (horizontal position)
- Grouping by `round(Y/20)*20` puts lines within ~20 pixels into same "row"
- Within each row, sort by X to read left-to-right
- This reads Column 1 top-to-bottom, then Column 2 top-to-bottom

**Note:** Song boundaries prevent column-mixing issues - each song's content stays isolated

## Output Format (.evsong)

**Structure:**

```json
{
  "version": "1.0",
  "metadata": {
    "created": "2024-01-15T10:30:00",
    "modified": "2024-01-15T10:30:00",
    "isPrelisted": false
  },
  "title": "SONG TITLE",
  "slides": [
    {
      "id": "slide-1",
      "type": "verse",
      "number": 1,
      "content": "Line 1\nLine 2\nLine 3",
      "label": "Verse 1"
    },
    {
      "id": "slide-2",
      "type": "chorus",
      "number": 1,
      "content": "Chorus line 1\nChorus line 2",
      "label": "Chorus"
    }
  ]
}
```

**Encoding:** Base64-encoded JSON string (matches app format)

## Slide Types Supported

- `verse` - Main song verses (auto-numbered 1, 2, 3...)
- `chorus` - Repeated refrain section
- Other types available: `bridge`, `prechorus`, `tag`, `ending`, `intro` (not currently auto-detected)

## Edge Cases Handled

1. **Missing verse markers** - Uses spacing as primary delimiter, auto-numbers verses
2. **CHORUS marker present** - Explicitly detects and removes marker from content
3. **Chord notations** - Skips lines like "C", "Am", "G#m" (chord symbols)
4. **Key signatures** - Skips lines starting with "Key: "
5. **Empty sections** - Skips sections with no content after cleaning
6. **No spacing** - Falls back to line-count grouping (5 lines per section)

## Usage Example

```python
extractor = SongExtractor('input.pdf', 'output_songs/')
songs = extractor.process_pdf()

# Result: All songs extracted as .evsong files in output_songs/
# Example: "GLORY TO HIS NAME.evsong"
```

## Testing Recommendations

1. **Verify song boundaries** - Check that songs don't mix content
2. **Check verse detection** - Ensure empty lines properly split verses
3. **Validate chorus detection** - Confirm CHORUS markers work + pattern detection
4. **Test two-column PDFs** - Verify columns don't jumble
5. **Load in app** - Import .evsong files to verify format compatibility

## Algorithm Strengths

✅ **Section-first approach** - Isolates each song before parsing  
✅ **Spacing-based parsing** - Uses natural verse boundaries from PDF  
✅ **Robust chorus detection** - Multiple detection methods (marker + patterns)  
✅ **Two-column aware** - Block-based extraction with coordinate sorting  
✅ **Auto-numbering** - Creates verse numbers automatically  
✅ **Format-compliant** - Matches app's .evsong structure exactly

## Known Limitations

⚠️ **Bridge/Prechorus detection** - Not currently auto-detected (no obvious markers)  
⚠️ **Multi-part choruses** - May split into separate sections if empty line between  
⚠️ **Unusual layouts** - Three-column or complex layouts may need adjustment  
⚠️ **Chord sheets** - Heavy chord notation may interfere with lyrics extraction
