# Design System Specification: Tactical Empathy & Editorial Softness

## 1. Overview & Creative North Star
**Creative North Star: "The Tactile Sanctuary"**

This design system moves away from the clinical, rigid grids typical of assistive technology. Instead, it adopts a high-end editorial approach that prioritizes "Tactile Empathy." The goal is to create a digital environment that feels like a physical sanctuary—breathable, warm, and profoundly intuitive. 

By utilizing intentional asymmetry and "The Breathable Layout," we break the traditional "box-in-a-box" UI. We lean into the high-contrast typography scales of Plus Jakarta Sans to provide an authoritative yet gentle voice. This isn't just an interface; it’s a supportive companion that reduces cognitive load through visual silence and tonal depth.

---

## 2. Color Philosophy & Surface Architecture

The palette is rooted in warmth (`surface: #fff8f5`) to stimulate a sense of safety, balanced by cool, calming primary tones (`primary: #006591`) to anchor the user’s focus.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. They create visual noise and "trapped" layouts. Boundaries must be defined through:
- **Tonal Shifts:** Placing a `surface-container-low` component on a `surface` background.
- **Negative Space:** Using the spacing scale to create clear mental models of separation.

### Surface Hierarchy & Nesting
We treat the UI as a series of nested, physical layers. Each layer signifies a step deeper into the user's thought process:
1.  **Base Layer:** `surface` (#fff8f5) — The foundation.
2.  **Sectioning Layer:** `surface-container-low` (#fff1e8) — Used for grouping large content blocks.
3.  **Active Component Layer:** `surface-container` (#fdebde) — For interactive cards or focus areas.
4.  **Floating Layer:** `surface-container-lowest` (#ffffff) — For elements that need to "pop" with maximum clarity.

### The "Glass & Gradient" Rule
To elevate the system from "flat" to "premium," use `backdrop-blur` (12px–20px) on floating menus using semi-transparent `surface_container_lowest`. For primary CTAs, apply a subtle linear gradient from `primary` (#006591) to `on_primary_container` (#0073a5) at a 145-degree angle to provide a "soulful" depth.

---

## 3. Typography: The Friendly Authority

We utilize **Plus Jakarta Sans** for its geometric clarity and softened terminals, which mirror the roundedness of our UI components.

*   **Display Scales (Lg/Md/Sm):** Used for "Hero" moments and emotional check-ins. High tracking (-2%) adds a sophisticated editorial feel.
*   **Headline & Title Scales:** These act as the anchors of the page. Use `headline-lg` (2rem) to greet the user, ensuring the "voice" of the app feels present and supportive.
*   **Body & Label Scales:** Designed for maximum legibility in AAC contexts. `body-lg` (1rem) is the standard for communication strings to ensure clarity without squinting.

**Hierarchy Note:** Always pair a `display-sm` header with a `body-md` description to create a high-contrast, premium "Editorial" look that guides the eye naturally.

---

## 4. Elevation & Depth: Tonal Layering

We reject the "Shadow-Heavy" look of 2010s material design in favor of **Natural Ambient Light.**

### The Layering Principle
Depth is achieved by stacking. A card with `surface-container-lowest` placed on a background of `surface-container-low` creates a perceived 2dp lift naturally.

### Ambient Shadows
Shadows should only be used for "Temporary" floating elements (Modals, Tooltips, Floating Action Buttons).
- **Shadow Specs:** Blur: `24px` | Spread: `0` | Color: `on_surface` at 4%–6% opacity.
- This creates a soft, "cloud-like" lift rather than a harsh drop shadow.

### The "Ghost Border" Fallback
If accessibility requirements demand a container boundary in low-contrast scenarios, use the `outline_variant` (#c3c7cb) at **15% opacity**. It must feel like a suggestion of a border, not a hard line.

---

## 5. Component Guidelines

### Buttons: The Pill Shape
All buttons utilize the `full` (9999px) roundedness scale.
- **Primary:** Gradient-filled (`primary` to `primary_container`). Use for the main communication intent.
- **Secondary:** `secondary_container` (#6bff8f) background with `on_secondary_container` (#007432) text. Used for calming or "back" actions.
- **Tertiary:** No background, `primary` text. Used for auxiliary settings.

### Communication Cards & Lists
- **Rule:** No dividers. Use `md` (1.5rem) or `lg` (2rem) spacing to separate items.
- **Cards:** Use `surface-container-low` with a corner radius of `xl` (3rem). This exaggerated roundness feels "huggable" and safe.

### Input Fields
- **Style:** Softened rectangular forms with `md` (1.5rem) corners.
- **Focus State:** Instead of a thick border, use a subtle `surface_tint` (#006591) outer glow (4px) with a 20% opacity.

### AAC Expression Bar
A persistent floating element at the top/bottom of the screen. 
- **Style:** Glassmorphism (`surface_container_lowest` @ 80% opacity + `backdrop-blur`).
- **Rounding:** `full`.
- **Shadow:** Ambient shadow (6% opacity).

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use extreme whitespace. If a layout feels "full," remove an element or increase the padding.
*   **Do** use the `xl` (3rem) and `full` (9999px) rounding for everything the user touches.
*   **Do** favor tonal transitions (Peach to Warm Orange) over grey scales to maintain emotional warmth.

### Don’t:
*   **Don’t** use pure black (#000000) for text. Always use `on_surface` (#231a12) to keep the contrast "soft" for the eyes.
*   **Don’t** use 1px dividers to separate list items. Use 12px or 16px of vertical air.
*   **Don’t** use sharp corners. The minimum allowable radius is `sm` (0.5rem), and only for the smallest micro-components.
*   **Don't** use "Alert Red" for everything. Reserve `error` (#ba1a1a) for critical failures; use `tertiary` (#855300) for gentle nudges.