# OceanGuard Frontend Design & Style Guide

This document defines the core visual design system, custom components, styling patterns, and responsive layouts for the OceanGuard web application. Use this guide as context when developing new pages and components to maintain a premium, cohesive user experience.

---

## 1. Visual Theme & Core Design System

OceanGuard's visual identity centers around a premium, modern, ocean-inspired aesthetic. It utilizes a dark glassmorphic design language set against deep gradient water backgrounds to evoke depth and precision.

### 1.1 Typography
*   **Primary Font Face**: `Cal Sans` (serif). Used as the default body font, for inputs, buttons, and normal headings. Provides a clean, slightly technical, yet premium editorial feel.
*   **Accent Font Face**: `Righteous` (sans-serif). Imported from Google Fonts. Used strictly for uppercase display headers, prominent titles, and hero sections (e.g., `"Ocean Guard"`, `"LOGIN"`, `"Tracked Fishes"`).
*   **Custom Font Utility Classes (Tailwind v4 theme)**:
    *   `font-righteous` → `font-family: var(--font-righteous)`
    *   `font-cal` → `font-family: var(--font-cal)`
*   **Display Title**: `.title` class
    *   `font-size: 12rem` (adjusted dynamically across devices)
    *   `letter-spacing: -10%`
    *   `line-height: 67%`

### 1.2 Color Palette
The colors are split between the natural blue-to-teal gradient background of the ocean and stark white/slate highlights.
*   **Background (Gradient)**: The custom theme variable `--background-image-ocean` creates a smooth linear gradient:
    *   Start/Top: `#b8e5ef` (Light Sky Blue / Coral Water)
    *   End/Bottom: `#003a95` (Deep Oceanic Blue)
    *   Utility Class: `bg-ocean` (applied on `body` as a non-repeating, full-height gradient)
*   **Card Backgrounds**:
    *   *Light Glass*: Translucent white/sky blue overlays (`bg-white/15` or `bg-white/20`) with white border glow (`border-white/40` or `border-white/50`).
    *   *Dark Glass / Nav*: Translucent slate overlays (`bg-slate-800/40` or `rgba(15, 23, 42, 0.6)`) for controls, sidebar panels, and headers.
*   **Threat / Overlap Levels**:
    *   🔴 **Critical**: `#b91c1c` (Red / 700) - scores $\ge 0.70$
    *   🟡 **Warning**: `#ca8a04` / `#d97706` (Yellow/Amber / 600) - scores $0.40 - 0.70$
    *   🟢 **Low / Monitoring**: `#047857` (Emerald / Green) - scores $< 0.40$

---

## 2. Global Layout & Structural Conventions

### 2.1 Standard Pages (Landing, User Profile)
Standard content pages are structured around a centered main canvas overlaying the `bg-ocean` background.
*   **Page Container**: `min-h-screen bg-ocean px-6 pb-16 pt-32 font-cal md:px-14`
*   **Inner Wrapper**: `<main className="mx-auto flex max-w-7xl flex-col gap-14">`
*   **Header Placement**: The `<Header />` component is positioned fixed at `fixed top-0 left-1/2 -translate-x-1/2 z-50` with an automatic scroll threshold handler that toggles its font color from black (top) to white (scrolled).

### 2.2 Dashboard / Map Page Layout
For the map, the canvas takes up the full screen and is fixed, and panels float over it.
*   **Map Canvas Wrapper**: `fixed inset-0 w-screen h-screen z-0`
*   **Overlay Controls Wrapper**: `pointer-events-none fixed inset-0 z-10 w-screen h-screen` (with nested buttons and sidebars explicitly setting `pointer-events-auto`).

---

## 3. UI Patterns & Custom Classes

### 3.1 Light Glass Cards (`.glass-card`)
Used for showcasing items (like fish info cards, or informational boxes).
*   **HTML Structure**:
    ```html
    <div className="glass-card rounded-4xl p-12">
      <!-- Content here -->
    </div>
    ```
*   **Key Properties**:
    *   Background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)`
    *   Filter: `backdrop-filter: blur(32px)`
    *   Border: `1px solid rgba(255, 255, 255, 0.1)` with a custom top-left glowing pseudo-border (`::before`).

### 3.2 Dark Glass Navigation Panels (`.glass-nav`)
Used for control dashboards, sidebars, map buttons, and overlay menus.
*   **HTML Structure**:
    ```html
    <div className="glass-nav rounded-4xl p-6">
      <!-- Nav/Control Content -->
    </div>
    ```
*   **Key Properties**:
    *   Background: `linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)`
    *   Filter: `backdrop-filter: blur(20px)`
    *   Border: `1px solid rgba(255, 255, 255, 0.1)` with a custom top-left glowing pseudo-border (`::before`).
    *   Shadow: `0 4px 30px rgba(0, 0, 0, 0.2), 0 20px 40px rgba(15, 23, 42, 0.3)`

### 3.3 Micro-Animations & Interactivity
*   **Floating Motion (`oceanFloat`)**: Used to add life and dynamic floating motion to titles, descriptions, and call-to-actions.
    *   `.animate-float-heading` (duration: 6s, infinite)
    *   `.animate-float-text` (duration: 6s, infinite, delay: 0.4s)
    *   `.animate-float-btn` (duration: 6s, infinite, delay: 0.8s)
*   **Button Transitions**: Standard custom buttons should support scaling transitions:
    *   Class: `hover:scale-[1.02] active:scale-[0.98] transition-all duration-300`
*   **Water Drop Wave Ripple (`.wave-ripple`)**: Used for loaders.
    *   Wrapper: `.ripple-wrapper` (width & height: 80px)
    *   Ripple elements: two nested circular divs with `.wave-ripple` and `.wave-ripple.wave-ripple-delayed` animating scale from 0 to 1.5 and opacity from 1 to 0.

---

## 4. Page Templates for New Views

When creating a new page in OceanGuard, adapt one of these layout structures depending on the content goal:

### 4.1 Split-Screen Form Page (e.g., Login, Registration)
Used for user data collection, configurations, or detailed standalone wizards.
*   **Left Column (or opposite)**: Medium screen and above (`hidden md:block w-1/2 h-full bg-cover bg-center`) displaying a high-resolution, thematic marine image.
*   **Right Column**: Form container (`bg-white w-full md:w-1/2 h-full flex flex-col justify-center px-8 md:px-24`).
*   **Input Fields**: Thick white input blocks with soft indigo borders and standard focus rings:
    ```html
    <input 
      type="text" 
      className="w-full bg-white border-2 border-blue-100 rounded-2xl px-5 py-4 text-black focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg" 
    />
    ```

### 4.2 Grid List View Page (e.g., Fishes List)
Used for catalogs, historical logs, or card selections.
*   **Outer Layout**: Uses CSS Container Queries (`@container`) with a standard CSS Grid:
    ```html
    <div className="@container grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 lg:gap-18 mt-12">
      <!-- Card Items -->
    </div>
    ```
*   **Card Layout**: Each card encapsulates an absolute hover trigger (`hover-trigger peer absolute z-50`) which triggers transitions on sibling cards.
    *   On Hover: The image translates and scales, revealing the hidden absolute description panel (`.fish-desc`) which transitions from `opacity-0` to `opacity-90`.

### 4.3 Control Panel / List Page (e.g., User Reports Profile)
Used for listing user specific resources, logs, or bookmarks.
*   **Container Block**: Uses translucent light glass borders for structural group panels:
    ```html
    <section className="rounded-[2rem] border border-white/40 bg-white/15 px-8 py-10 shadow-lg backdrop-blur-md">
      <!-- Panel Content -->
    </section>
    ```
*   **Stats Box Grid**: Inner metadata or statistics indicators are wrapped in rounded boxes (`rounded-[1.25rem] border border-white/40 bg-white/15 px-10 py-4 shadow-md backdrop-blur-md`).
*   **Table Headers / Rows**: Structured using simple responsive grids (e.g., `grid gap-6 md:grid-cols-4`).

---

## 5. Development Guidelines
1.  **Tailwind Integration**: OceanGuard utilizes Tailwind CSS v4. Import styles in `index.css` via `@import "tailwindcss"`. Theme values should be registered inside the `@theme` block in `index.css`.
2.  **Glassmorphism Compounding**: Avoid nesting glassmorphism cards (`.glass-card` inside `.glass-card` or `.glass-nav` inside `.glass-nav`) to prevent contrast issues. Instead, nest simple borders or transparent containers (`bg-white/10`, `border-white/20`).
3.  **Responsiveness**:
    *   Keep transitions smooth. On smaller devices (width < 1024px), animations/hover effects should be disabled (`transition: none !important`) to preserve rendering performance on mobile browsers.
    *   Ensure buttons and click targets are at least `48px` high on mobile views.
4.  **Icons**: Always use `lucide-react` for UI icons.
