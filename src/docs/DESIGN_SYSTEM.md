# Moonday Design System

## Last Updated: January 31, 2026

This document captures the standardized design patterns for the Moonday app.

---

## Page Layout Standards

### Container Structure
```tsx
<div className="min-h-screen bg-background flex flex-col relative">
  {/* Decorative stars background */}
  {/* Header (if needed) */}
  {/* Main content */}
  {/* Footer (if needed) */}
</div>
```

### Main Content Area
```tsx
<main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
  {/* Logo */}
  {/* Page content */}
</main>
```

**Key classes:**
- `flex-1` - Fills available space
- `justify-center` - Vertically centers content
- `items-center` - Horizontally centers content
- `px-6` - Horizontal padding
- `relative z-10` - Ensures content is above background

---

## Logo Standards

### Size
- Mobile: `w-40 h-40` (160px × 160px)
- Desktop: `md:w-48 md:h-48` (192px × 192px)

### Spacing
- Bottom margin: `mb-8` (32px)

### Animation
- Float effect: `animate-float`

### Container Structure
```tsx
<div className="animate-float mb-8">
  <div 
    className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden cursor-pointer hover-scale-subtle"
    onClick={() => navigate("/")}
  >
    <img
      src={moonLogo}
      alt="Moonday"
      className="w-full h-full object-cover drop-shadow-2xl"
    />
  </div>
</div>
```

### Logo Asset
- File: `src/assets/moon-logo-new.png`
- Import: `import moonLogo from "@/assets/moon-logo-new.png";`

---

## Background Standards

### Decorative Stars
```tsx
<div className="fixed inset-0 overflow-hidden pointer-events-none">
  {[...Array(20)].map((_, i) => (
    <div
      key={i}
      className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
      style={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        opacity: Math.random() * 0.5 + 0.3,
      }}
    />
  ))}
</div>
```

### Base Background Color
- CSS variable: `bg-background`
- HSL value: `hsl(220, 45%, 5%)`
- Hex: `#070A0F`

---

## Color Tokens (from index.css)

### Navy Palette (Backgrounds)
- `--navy-deep`: `220 45% 5%` - Base background
- `--navy-dark`: `220 42% 8%` - Cards
- `--navy-medium`: `218 38% 12%` - Inputs, popovers
- `--navy-light`: `215 32% 18%` - Borders

### Gold Palette (Accents)
- `--gold-deep`: `38 56% 55%` - Deep accent
- `--gold-medium`: `38 56% 72%` - Primary accent
- `--gold-light`: `38 56% 80%` - Light accent
- `--gold-pale`: `38 45% 90%` - Stars, highlights

### Text Colors
- `--cream`: `40 35% 97%` - Primary text
- `--cream-muted`: `38 22% 78%` - Secondary text

---

## Typography

### Font Family
- Display/Headers: `font-display` (Cinzel)
- Body/Serif: `font-serif` (Cormorant Garamond)

### Text Gradients
- Gold gradient: `text-gold-gradient`

---

## Components Used

### GlassmorphismCard
- Frosted glass effect with gold border glow
- Import: `import GlassmorphismCard from "@/components/GlassmorphismCard";`

### MoonLoader
- Loading spinner animation
- Import: `import MoonLoader from "@/components/MoonLoader";`

---

## Pages Following This Standard

1. ✅ `/` - Index (Home)
2. ✅ `/signup` - Signup (Reference page)
3. ✅ `/portal` - Portal (Auth)
4. ✅ `/pricing` - Pricing

---

## Change Log

### January 31, 2026
- Standardized all pages to match Signup page layout
- Removed CelestialBackground canvas in favor of lightweight decorative stars
- Unified logo sizing: `w-40 h-40 md:w-48 md:h-48`
- Unified logo margin: `mb-8`
- Unified main content: `justify-center` (vertically centered)
- Removed unused CrescentMoon component references
