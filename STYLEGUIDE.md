# DoMapping Design System & Style Guide

## 🎨 **Brand Identity**

### **Logo & Typography**
- **Brand Name**: DoMapping
- **Primary Font**: Modern, clean sans-serif
- **Logo Treatment**: Bright turquoise (#4ECDC4) on dark backgrounds

## 🎨 **Color Palette**

### **Primary Colors**
- **Brand Turquoise**: `#4ECDC4` - Primary brand color, buttons, highlights
- **Dark Background**: `#1a1a1a` - Main background color
- **Card Background**: `#2a2a2a` - Secondary surfaces, cards
- **Modal Background**: `#333333` - Overlays, modals

### **Text Colors**
- **Primary Text**: `#FFFFFF` - Main content, headings
- **Secondary Text**: `#B0B0B0` - Subtitles, descriptions
- **Placeholder Text**: `#666666` - Form placeholders
- **Muted Text**: `#888888` - Helper text, labels

### **Accent Colors**
- **Success**: `#4ECDC4` - Confirmations, success states
- **Warning**: `#FFD93D` - Alerts, warnings
- **Error**: `#FF6B6B` - Errors, validation
- **Info**: `#6C7CE7` - Information, links

## 📐 **Layout System**

### **Spacing Scale**
```less
@spacing-xs: 4px;
@spacing-sm: 8px;
@spacing-md: 16px;
@spacing-lg: 24px;
@spacing-xl: 32px;
@spacing-xxl: 48px;
```

### **Grid System**
- **Sidebar Width**: 240px
- **Content Max Width**: 1200px
- **Card Spacing**: 24px gap
- **Form Field Spacing**: 16px vertical gap

## 🔧 **Component Library**

### **Buttons**
#### Primary Button
- **Background**: `#4ECDC4`
- **Text**: `#1a1a1a`
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Font Weight**: 600
- **Hover**: Darken 10%

#### Secondary Button
- **Background**: Transparent
- **Border**: 1px solid #4ECDC4
- **Text**: `#4ECDC4`
- **Hover**: Background #4ECDC4, Text #1a1a1a

### **Cards**
- **Background**: `#2a2a2a`
- **Border Radius**: 12px
- **Padding**: 20px
- **Shadow**: 0 4px 12px rgba(0, 0, 0, 0.3)
- **Hover**: Subtle lift effect

### **Forms**
#### Input Fields
- **Background**: `#333333`
- **Border**: 1px solid #555555
- **Border Radius**: 6px
- **Padding**: 12px 16px
- **Focus Border**: `#4ECDC4`
- **Placeholder**: `#666666`

#### Labels
- **Color**: `#FFFFFF`
- **Font Weight**: 600
- **Margin Bottom**: 8px

### **Navigation**
#### Sidebar
- **Background**: `#2a2a2a`
- **Width**: 240px
- **Item Padding**: 12px 16px
- **Active State**: Background #4ECDC4, Text #1a1a1a
- **Hover State**: Background #333333

#### Navigation Items
- **Icon Size**: 20px
- **Text Size**: 14px
- **Spacing**: 8px between icon and text

### **Modals**
- **Background**: `#333333`
- **Border Radius**: 12px
- **Max Width**: 600px
- **Padding**: 32px
- **Backdrop**: rgba(0, 0, 0, 0.8)

### **Project Cards**
- **Image Aspect Ratio**: 16:9
- **Thumbnail Border Radius**: 8px
- **Title Font Size**: 18px
- **Description Font Size**: 14px
- **Meta Info Color**: `#888888`

## 📱 **Responsive Design**

### **Breakpoints**
```less
@mobile: 768px;
@tablet: 1024px;
@desktop: 1200px;
```

### **Mobile Adaptations**
- Sidebar collapses to hamburger menu
- Project cards stack vertically
- Modal becomes full-screen on mobile
- Reduced padding and margins

## 🔤 **Typography Scale**

```less
@font-size-xs: 12px;
@font-size-sm: 14px;
@font-size-base: 16px;
@font-size-lg: 18px;
@font-size-xl: 24px;
@font-size-xxl: 32px;
@font-size-display: 48px;
```

### **Font Weights**
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## 🌟 **Interactive States**

### **Hover Effects**
- **Buttons**: Color transition 0.2s ease
- **Cards**: Transform translateY(-2px), shadow increase
- **Navigation**: Background color transition

### **Focus States**
- **Form Inputs**: 2px solid #4ECDC4 outline
- **Buttons**: Box shadow with brand color
- **Navigation**: Visible focus indicator

### **Loading States**
- **Skeleton Loading**: Animated gradient placeholder
- **Button Loading**: Spinner with brand color
- **Progress Indicators**: Turquoise progress bars

## 🎯 **Content Guidelines**

### **Microcopy**
- **Buttons**: Clear action verbs (CONTINUAR, CREAR PROYECTO)
- **Form Labels**: Concise, descriptive
- **Error Messages**: Helpful, actionable
- **Success Messages**: Encouraging, brief

### **Imagery**
- **3D Thumbnails**: High contrast, detailed previews
- **Icons**: Consistent style, 20px standard size
- **Empty States**: Supportive illustrations

## ♿ **Accessibility Standards**

### **Color Contrast**
- **Text on Dark**: Minimum 4.5:1 ratio
- **Interactive Elements**: Clear visual hierarchy
- **Focus Indicators**: Always visible

### **Navigation**
- **Keyboard Navigation**: Full support
- **Screen Readers**: Semantic HTML structure
- **ARIA Labels**: Descriptive labels for complex components

## 🔄 **Animation Standards**

### **Transitions**
- **Duration**: 200ms for micro-interactions, 300ms for page transitions
- **Easing**: ease-out for entrances, ease-in for exits
- **Properties**: Transform, opacity, background-color

### **Page Transitions**
- **Modal Enter**: Scale up from 0.9 to 1.0, fade in
- **Card Hover**: Subtle lift and shadow increase
- **Navigation**: Smooth highlight movement

---

*This styleguide ensures consistency across the DoMapping platform while maintaining the sophisticated dark theme and professional 3D visualization focus.*
