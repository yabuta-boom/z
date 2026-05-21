# ZOE Fleet & Detail Pages - UI/UX Redesign Spec

**Date:** 2026-05-05  
**Scope:** Vehicles (Fleet) Page + CarDetails Page full redesign

---

## Design Principles

- **Brand-first:** ZOE logo, primary indigo (`oklch(0.5 0.2 260)`), premium typography throughout
- **Moving car animation:** `SmartGPSRoad` canvas component reused from Login page, rendered BEHIND all content
- **Full-width layouts:** No side panels, no sidebars — every section spans the full container width
- **Horizontal scrolling categories:** Premium card carousel instead of 2-column grid
- **Sticky bottom booking bar:** Replaces right-column booking widget on Detail page
- **Professional polish:** Generous whitespace, consistent 2.5rem/3xl border-radius, framer-motion transitions

---

## 1. Shared: SmartGPSRoad Component

**Extract from:** `src/pages/Login.tsx` (lines 57-219)  
**New location:** `src/components/SmartGPSRoad.tsx`

- Canvas-based animated road with moving car icon + GPS pings
- Accepts props: `className?` (default `inset-0`), `opacity?` (default `0.5`)
- Used as a background layer with `absolute` positioning behind hero content
- Road path adapts to container dimensions via ResizeObserver
- Car color uses CSS variable `--primary` (indigo) for brand consistency

---

## 2. Fleet Page (`src/pages/Vehicles.tsx`)

### 2.1 Hero Section
- Full-width section, `h-[60vh]` min height
- `SmartGPSRoad` canvas rendered at `absolute inset-0 opacity-30`
- Dark gradient overlay: `bg-gradient-to-b from-black/60 via-black/40 to-background`
- Centered overlay content:
  - ZOE logo icon (animated in with framer-motion)
  - "ZOE" text in `text-6xl md:text-8xl font-black italic tracking-tighter`
  - "FLEET" subtitle in `text-xs font-bold uppercase tracking-[0.3em] text-primary`
  - Animated divider line in primary color
- When category selected: title changes to category name, back button appears

### 2.2 Category Browser (Horizontal Scroll)
- Replaces 2-column grid
- Container: `overflow-x-auto` with `snap-x snap-mandatory`
- Cards: `min-w-[300px] max-w-[340px]` with `snap-center`
- Each card:
  - Large image (aspect-[3/4]) with rounded-3xl overflow
  - Dark gradient overlay at bottom for text readability
  - Category title in `text-2xl font-black uppercase`
  - Description in `text-sm text-white/70`
  - Sub-categories as small pills at bottom
  - ChevronRight icon on hover (translate-x animation)
  - onClick: sets selectedCategory, scrolls to vehicle grid
- Scroll navigation: left/right gradient fade + optional arrow buttons
- Animation: cards fade-in on scroll via viewport detection

### 2.3 Vehicle Grid (After Category Selection)
- Full-width: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (no side column)
- Filters: horizontal pill bar at top (`flex overflow-x-auto gap-2`)
  - Filter pills: `px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest`
  - Active state: `bg-primary text-white`
  - Inactive: `bg-gray-50 text-muted-foreground hover:bg-primary/5`
- Advanced filters (type, price): collapsible section below pills, full-width
- "Back to Categories" button: left-aligned, full-width section above grid

### 2.4 Removed Elements
- "Buy a Vehicle" right panel → **removed**
- "Need Help" right panel → **removed**
- Any sidebar or side column → **removed**

---

## 3. Car Details Page (`src/pages/CarDetails.tsx`)

### 3.1 Hero Section
- Full-width image gallery at top (edge-to-edge, `h-[70vh]`)
- `SmartGPSRoad` canvas at `absolute inset-0 opacity-20` behind a dark overlay
- Overlay content (positioned absolute at bottom of hero):
  - Car name: `text-4xl md:text-6xl font-black uppercase tracking-tighter text-white`
  - Price: `text-3xl font-black text-primary` with "PER DAY" label
  - Rating badge + location pill
- Image gallery: horizontal scroll thumbnails at bottom of hero, dark backdrop

### 3.2 Content Sections (Full-Width)
All sections stack vertically, full-width, generous `py-16` spacing:
- **Specs row:** 4-column grid of spec cards (seats, transmission, fuel, insurance)
- **Description:** Left-aligned, `text-lg leading-relaxed max-w-3xl`
- **Features:** 2-column grid of checkmark items
- **Booking Requirements:** Full-width grid with icon bullets
- **Host Section:** Full-width card with avatar, ratings, join date
- **Reviews:** 2-column grid of review cards
- **Map Section:** Full-width expanded iframe, `h-[400px] rounded-3xl`

### 3.3 Sticky Bottom Booking Bar (Replaces Side Widget)
- Appears after scrolling past the image gallery (`fixed bottom-0 left-0 right-0`)
- `backdrop-blur-xl bg-white/90 border-t border-primary/10 shadow-2xl`
- Inner layout (full-width container):
  - Left: Price summary (`ETB X x Y days = ETB Z`)
  - Center: Date pickers (two popovers side by side)
  - Right: Payment method selector (compact grid) + "Book Now" button
- On mobile: collapses to a compact bar with "Book Now · ETB X/day" and expands on tap
- Smooth slide-up animation via framer-motion `AnimatePresence`
- "Digital signature required" note below the bar

### 3.4 Removed Elements
- Right-column booking widget → **replaced by sticky bottom bar**
- Any sidebar or side panel → **removed**

---

## 4. Component Architecture

```
src/
  components/
    SmartGPSRoad.tsx        ← extracted from Login.tsx
    StickyBookingBar.tsx    ← new, for CarDetails
    HorizontalScroller.tsx   ← new, reusable horizontal scroll container
  pages/
    Vehicles.tsx            ← full rewrite
    CarDetails.tsx          ← full rewrite
    Login.tsx               ← updated to import SmartGPSRoad from components/
```

---

## 5. Brand Consistency Checklist

- [x] Primary color: `oklch(0.5 0.2 260)` (indigo) used everywhere
- [x] ZOE logo + "Premium Car Rental" tagline on Fleet hero
- [x] Font stack: system SF Pro / Helvetica Neue (already in index.css)
- [x] Border radius: `rounded-[2.5rem]` / `rounded-3xl` consistent
- [x] Shadows: `shadow-[0_10px_40px_rgba(0,0,0,0.04)]` pattern
- [x] Uppercase tracking-widest for labels: `text-[10px] font-bold uppercase tracking-widest`
- [x] Framer Motion `AnimatePresence` + `viewport` animations throughout

---

## 6. Data Flow (No Changes)

- `MOCK_CARS` from `src/constants.ts` — unchanged
- `MOCK_REVIEWS` from `src/constants.ts` — unchanged
- `useLanguage()` translations — unchanged
- `useAuth()` — unchanged
- Firebase bookings — unchanged
