# Bible Presentation Auto-Sizing Logic

## Overview

The Bible Presentation Display implements a sophisticated auto-sizing algorithm that dynamically adjusts font size to optimally fit scripture verses within the available viewport, ensuring maximum readability while preventing text overflow.

## Core Algorithm

### 1. Recursive Binary Search Approach

The auto-sizing uses a **recursive descent algorithm** that starts with a large font size and progressively reduces it until the content fits perfectly within the container.

**Algorithm Flow:**

```
Start at 200px → Test if fits → Too big? Reduce by 2px → Repeat
                              ↓
                         Fits? → Return current size
                              ↓
                         Minimum 12px
```

### 2. Key Components

#### State Management

```typescript
const [autoFontSize, setAutoFontSize] = useState(60); // Current calculated size
const [isResizing, setIsResizing] = useState(false); // Prevents concurrent resizing
const [lastSizedVerseKey, setLastSizedVerseKey] = useState<string>(""); // Tracks sized verse
```

#### DOM References

```typescript
verseContentRef; // Points to the text content element
verseContainerRef; // Points to the container viewport
```

## The resizeToFit() Function

### Entry Guards

```typescript
// 1. Verify DOM refs are ready
if (!verseContentRef.current || !verseContainerRef.current) return;

// 2. Prevent concurrent resize operations
if (isResizing) return;

setIsResizing(true);
```

### Recursive Resize Logic

The core algorithm (`recursiveResize`) works as follows:

1. **Apply Test Size**

   ```typescript
   content.style.fontSize = `${currentSize}px`;
   ```

2. **Calculate Dynamic Line Height**

   ```typescript
   if (currentSize >= 100) lineHeight = 1.0; // Tight spacing for large text
   else if (currentSize >= 80) lineHeight = 1.2;
   else if (currentSize >= 60) lineHeight = 1.2;
   else if (currentSize >= 40) lineHeight = 1.2;
   else lineHeight = 1.3; // Looser for small text
   ```

3. **Force Layout Reflow**

   ```typescript
   content.offsetHeight; // Triggers browser reflow for accurate measurements
   ```

4. **Measure & Compare**

   ```typescript
   const contentHeight = content.scrollHeight;
   const containerHeight = container.clientHeight;
   const heightMargin = containerHeight * 0.03; // 3% safety margin
   ```

5. **Decision Tree**
   ```typescript
   if (contentHeight > containerHeight - heightMargin) {
     // TOO BIG: Reduce size and try again
     if (currentSize > 12) {
       return recursiveResize(currentSize - 2); // Decrease by 2px
     } else {
       return 12; // Minimum font size reached
     }
   } else {
     // FITS PERFECTLY: Use this size
     return currentSize;
   }
   ```

### Size Constraints

- **Starting Size:** 200px (optimizes for short verses)
- **Decrement Step:** 2px (balances speed vs precision)
- **Minimum Size:** 12px (ensures readability)
- **Safety Margin:** 3% of container height (prevents edge overflow)

### Final Steps

```typescript
const finalSize = recursiveResize(200);
setAutoFontSize(finalSize);
setIsResizing(false);

// Signal completion for rendering
requestAnimationFrame(() => {
  setLastSizedVerseKey("_resized_");
});
```

## Trigger Mechanisms

The auto-sizing recalculates in these scenarios:

### 1. Verse Change

```typescript
useEffect(() => {
  if (currentVerseIndex !== previousVerseIndexRef.current) {
    requestAnimationFrame(() => {
      resizeToFit();
    });
  }
}, [currentVerseIndex, currentBook, currentChapter]);
```

### 2. Refs Become Ready

```typescript
useEffect(() => {
  if (
    verseContentRef.current &&
    verseContainerRef.current &&
    currentVerses.length > 0
  ) {
    requestAnimationFrame(() => {
      resizeToFit();
    });
  }
}, [verseContentRef.current, verseContainerRef.current, currentVerses.length]);
```

### 3. Initial Mount with Data

```typescript
useEffect(() => {
  if (currentVerses.length > 0) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          resizeToFit();
        }, 400); // Delayed to ensure DOM is fully rendered
      });
    });
  }
}, [currentVerses.length]);
```

### 4. Window Resize

```typescript
useEffect(() => {
  window.addEventListener("resize", resizeToFit);
  return () => window.removeEventListener("resize", resizeToFit);
}, [resizeToFit]);
```

## Height-Only Constraint Strategy

**Why Height Only?**
The algorithm intentionally only checks height constraints, not width:

```typescript
// Only check if content HEIGHT exceeds container HEIGHT
if (contentHeight > containerHeight - heightMargin) {
  // Reduce size
}
```

**Rationale:**

- Width constraints are too restrictive for centered text layouts
- Modern displays vary widely in aspect ratio
- Height overflow causes scrolling (bad UX)
- Text naturally wraps to fit width via CSS

## Performance Optimizations

### 1. RequestAnimationFrame Usage

```typescript
requestAnimationFrame(() => {
  resizeToFit();
});
```

Defers execution until next browser paint cycle, ensuring DOM is stable.

### 2. Concurrent Resize Prevention

```typescript
if (isResizing) return;
setIsResizing(true);
```

Prevents multiple simultaneous resize calculations.

### 3. Forced Reflow

```typescript
content.offsetHeight; // Forces layout recalculation
```

Ensures measurements reflect actual rendered dimensions.

### 4. Dependency Optimization

```typescript
// Avoid including currentVerses directly to prevent frequent updates
}, [currentVerseIndex, currentBook, currentChapter, resizeToFit]);
```

## Visual Rendering Control

Content visibility is controlled until sizing is complete:

```typescript
style={{
    visibility: lastSizedVerseKey === `${currentBook}-${currentChapter}-${currentVerseIndex}`
        ? "visible"
        : "hidden",
}}
```

This prevents flash of unstyled content (FOUC) during resize calculations.


```

## Integration Example

To use this auto-sizing system in another component:

```typescript
// 1. Set up state
const [autoFontSize, setAutoFontSize] = useState(60);
const [isResizing, setIsResizing] = useState(false);

// 2. Create refs
const contentRef = useRef<HTMLDivElement>(null);
const containerRef = useRef<HTMLDivElement>(null);

// 3. Implement resizeToFit (copy the algorithm)
const resizeToFit = useCallback(() => {
  // ... (see full implementation above)
}, [isResizing]);

// 4. Set up triggers
useEffect(() => {
  // Trigger on data change
  if (contentRef.current && containerRef.current) {
    requestAnimationFrame(() => {
      resizeToFit();
    });
  }
}, [yourDataDependencies]);

// 5. Apply calculated size
<div
  ref={contentRef}
  style={{
    fontSize: `${autoFontSize}px`,
    lineHeight: autoFontSize >= 100 ? 1.0 : 1.2,
  }}
>
  {content}
</div>;
```

## Key Takeaways

1. **Height-Driven:** Algorithm optimizes for vertical fit only
2. **Recursive Descent:** Starts large (200px) and reduces in 2px steps
3. **Smart Line Height:** Adjusts dynamically based on font size
4. **Safety Margins:** 3% padding prevents edge cases
5. **Performance First:** Uses RAF, prevents concurrent operations
6. **Comprehensive Triggers:** Responds to data, window, and ref changes
7. **Logging:** Extensive debugging support for troubleshooting

## Configuration Parameters

| Parameter           | Default | Purpose                      | Range    |
| ------------------- | ------- | ---------------------------- | -------- |
| Starting Size       | 200px   | Initial test size            | 12-200px |
| Decrement Step      | 2px     | Size reduction per iteration | 1-10px   |
| Minimum Size        | 12px    | Smallest allowed font        | 8-16px   |
| Safety Margin       | 3%      | Container padding            | 0-10%    |
| Line Height (Large) | 1.0     | Spacing for 100px+           | 0.8-1.2  |
| Line Height (Small) | 1.3     | Spacing for <40px            | 1.2-1.5  |

---

**Last Updated:** December 15, 2025  
**Component:** BiblePresentationDisplay.tsx  
**Version:** 1.0.0
