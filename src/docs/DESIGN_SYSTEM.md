# Moonday Design System

## Last Updated: February 4, 2026

This document captures the standardized design patterns for the Moonday app.

---

## Global Layout System

### PageLayout Component
All pages should use the `PageLayout` component for consistency:
```tsx
import PageLayout from "@/components/PageLayout";

const MyPage = () => (
  <PageLayout showFooter={true} showLogo={true}>
    {/* Page content */}
  </PageLayout>
);
```

**Props:**
- `showFooter` (default: true) - Show/hide the footer
- `showLogo` (default: true) - Show/hide the logo
- `className` - Additional classes for main content area

**Key Features:**
- Fixed top padding: `pt-8` (2rem = 32px)
- Stable star background positions (no flicker on navigation)
- Logo always in exact same position across all pages

---

## Page Layout Standards

### Container Structure (Legacy - use PageLayout instead)
```tsx
<div className="min-h-screen bg-background flex flex-col relative">
  {/* Decorative stars background */}
  {/* Navigation (if needed) */}
  {/* Main content */}
  {/* Footer (if needed) */}
</div>
```

### Main Content Area
```tsx
<main className="flex-1 flex flex-col items-center pt-8 pb-6 px-6 relative z-10">
  {/* Logo */}
  {/* Page content */}
</main>
```

**Key classes:**
- `pt-8` - Fixed 2rem (32px) top padding - logo sits at top
- `flex-1` - Fills available space
- `items-center` - Horizontally centers content
- `px-6` - Horizontal padding
- `relative z-10` - Ensures content is above background
### Container Structure
```tsx
<div className="animate-float mb-6">
  <div 
    className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background"
    onClick={() => navigate("/")}
  >
    <img
      src={moonLogo}
      alt="Moonday"
      className="w-full h-full object-cover"
    />
  </div>
</div>
```

### Logo Asset
- File: `src/assets/moon-logo-new.png`
- Import: `import moonLogo from "@/assets/moon-logo-new.png";`

---

## Background Standards

### Base Background Color
- Hex: `#011124`
- HSL: `hsl(213, 95%, 7%)`
- CSS variable: `bg-background` → `var(--navy-deep)`

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

---

## Color Tokens (from index.css)

### Navy Palette (Backgrounds) - Based on #011124
- `--navy-deep`: `213 95% 7%` - Base background (#011124)
- `--navy-dark`: `213 80% 10%` - Cards
- `--navy-medium`: `213 60% 14%` - Inputs, popovers
- `--navy-light`: `213 45% 20%` - Borders

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
5. ✅ `/results` - Results
6. ✅ `/quiz` - Transition Quiz
7. ✅ `/archives` - Archives
8. ✅ `/atelier` - Atelier
9. ✅ `/blueprint` - Blueprint (Dashboard)

---

## Change Log

### February 1, 2026
- Updated base background color to #011124 (hsl(213, 95%, 7%))
- Standardized logo sizing: `w-24 h-24 md:w-32 md:h-32` across ALL pages
- Reduced logo margin: `mb-6` (was `mb-8`)
- Added `bg-background` to logo containers for seamless blending
- Removed `drop-shadow-2xl` from logo images for cleaner look
- Updated Navigation logo to match new sizing
- Updated NotFound, Privacy, Terms pages to match standard layout

### January 31, 2026 - Update 2
- Standardized ALL pages to use consistent layout
- Fixed Results, TransitionQuiz, Archives, Atelier, Blueprint
- Removed CelestialBackground from Blueprint (using decorative stars now)
- All logos now: `w-40 h-40 md:w-48 md:h-48`
- All main containers: `justify-center` (no more `pt-24` or `py-12`)

### January 31, 2026
- Standardized all pages to match Signup page layout
- Removed CelestialBackground canvas in favor of lightweight decorative stars
- Unified logo sizing: `w-40 h-40 md:w-48 md:h-48`
- Unified logo margin: `mb-8`
- Unified main content: `justify-center` (vertically centered)
- Removed unused CrescentMoon component references
