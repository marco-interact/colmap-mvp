# UI Design System - Grayscale + Teal Accent

## Color Palette

### Primary Accent (Teal)
- **#3EC99F** - Main accent color for CTAs, highlights, interactive elements
- Used for: Buttons, links, active states, progress indicators

### Grayscale
- **#000** (Pure Black) - Left sidebar, top nav, 3D viewer background
- **#111** (Dark Gray) - Right info panels, secondary surfaces
- **Gray-800** - Cards, backgrounds
- **Gray-700/30** - Thin borders (light opacity for subtle separation)
- **Gray-950** - Main app background
- **White** - Primary text
- **Gray-400** - Secondary text

### Status Colors
- **Processing**: Gray-800 background (no gradients)
- **Error**: Red-400 text (minimal use)
- **Success**: Primary teal accent

## Typography

### Font Stack
- **Sans-serif**: Inter (UI, body text, headings)
- **Monospace**: JetBrains Mono (technical data, numbers, code)

### Font Usage
```tsx
// Headings & Body Text
className="font-sans"

// Technical Data (numbers, file sizes, timestamps, counts)
className="font-mono"
```

### Applied to:
- Point counts
- Camera counts  
- Feature counts
- File sizes
- Processing times
- Timestamps
- Technical metrics
- Error codes

## Borders

**Style**: Thin, light borders with opacity
```tsx
// Standard border
className="border-gray-700/30"

// 30% opacity creates subtle separation without harsh lines
```

**Applied to**:
- Sidebar dividers
- Header separators
- Card borders
- Panel edges

## No Gradients

All gradients removed. Solid colors only:
- Processing states: Gray-800
- Cards: Gray-800
- Placeholders: Gray-800
- Fallbacks: Gray-800

## Component Patterns

### Sidebar Navigation
```tsx
<aside className="w-64 bg-[#000] border-r border-gray-700/30">
```

### Top Header
```tsx
<header className="border-b border-gray-700/30 bg-[#000]">
```

### Info Panel
```tsx
<aside className="w-80 border-l border-gray-700/30 bg-[#111]">
```

### Technical Data Display
```tsx
<span className="text-white font-mono">
  {value.toLocaleString()}
</span>
```

### Primary Button
```tsx
<Button className="bg-primary-400 hover:bg-primary-500 text-white">
```

## Benefits

✅ **Professional**: Clean, modern aesthetic
✅ **Readable**: High contrast, clear hierarchy
✅ **Technical**: Monospace font for precision
✅ **Consistent**: Standardized across all pages
✅ **Subtle**: Light borders don't compete with content
✅ **Focused**: Teal accent draws attention where needed

---
**Status**: ✅ Design System Implemented
**Date**: 2025-10-21
