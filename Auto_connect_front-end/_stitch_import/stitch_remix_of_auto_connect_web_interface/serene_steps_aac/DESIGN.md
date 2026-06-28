# Design System Specification: The Serene Navigator

## 1. Overview & Creative North Star
**Creative North Star: "The Gentle Harbor"**

The objective of this design system is to transcend the "clinical" feel of traditional assistive technology. Instead of a rigid grid of buttons, we are building a "Gentle Harbor"—a digital environment that feels stable, soft, and infinitely patient. 

To achieve a high-end editorial feel for a pediatric audience, we move away from "Standard Web UI" by embracing **intentional negative space** and **asymmetric focal points**. While the grid must remain predictable for motor-planning, the visual layer uses overlapping "cloud-like" surfaces and a sophisticated tonal palette to reduce cognitive load. We are not just building an interface; we are creating a sensory-safe space where the UI recedes and the child’s voice takes center stage.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
This system utilizes a low-saturation palette to prevent sensory overstimulation. Contrast is managed through luminance rather than hue intensity.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
1.  **Background Shifts:** Placing a `surface-container-low` component on a `surface` background.
2.  **Tonal Transitions:** Using the subtle difference between `surface-variant` and `surface-bright`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical, soft-touch layers. 
- **Base Layer:** Use `surface` (#fff8f1) for the main application background.
- **Sectioning:** Use `surface-container-low` (#fff2dc) to define large functional areas (e.g., the category sidebar).
- **Interactive Elements:** Use `surface-container-lowest` (#ffffff) for individual tiles to make them feel "raised" and ready for interaction against the warmer background.

### Signature Textures & Glassmorphism
To add "soul" to the interface:
- **Floating Navigation:** Use **Glassmorphism** for top-level navigation bars. Apply `surface` at 80% opacity with a 20px backdrop-blur. This keeps the child oriented by showing the "ghost" of the content beneath.
- **Soft Gradients:** For primary actions, use a linear gradient from `primary_fixed` (#b5d5f6) to `primary_fixed_dim` (#a7c7e7) at a 135-degree angle. This provides a tactile, pillowy depth.

---

## 3. Typography: The Readable Anchor
We use **Plus Jakarta Sans** for its open apertures and friendly, geometric curves. It provides high legibility without the "institutional" feel of standard grotesques.

*   **The Display Scale:** Use `display-md` (2.75rem) for the "Active Sentence" bar. It should feel authoritative but gentle.
*   **The Headline Scale:** Use `headline-sm` (1.5rem) for category titles. 
*   **The Label Scale:** Use `label-md` (0.75rem) only for secondary metadata.
*   **Editorial Spacing:** Increase letter-spacing on all labels by +2% to ensure characters do not "blur" together for users with visual processing sensitivities.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "dirty" for this palette. We use **Ambient Softness**.

*   **The Layering Principle:** Place `surface-container-lowest` cards on top of `surface-container` backgrounds. The natural contrast in "warmth" creates hierarchy without structural lines.
*   **Ambient Shadows:** For "floating" elements like modals or pop-overs, use a shadow with a 40px blur, 0px offset, and 6% opacity using the `on-surface` color (#3e310e). This mimics a soft, overhead light.
*   **The Ghost Border:** If a boundary is strictly required for accessibility, use `outline-variant` at 15% opacity. Never use 100% black or grey.

---

## 5. Components
All components must honor a **minimum touch target of 60px**.

### Communication Tiles (Cards)
*   **Style:** Forbid divider lines. Use `surface-container-lowest` for the card body. 
*   **Shape:** `xl` radius (3rem). 
*   **Interaction:** On tap, the card should slightly scale down (0.98) and transition its background to `primary_container` (#b5d5f6). This provides immediate, non-jarring feedback.

### The "Sentence Builder" (Header)
*   **Style:** A horizontal strip using a `surface-bright` background. 
*   **Shadow:** A soft "bottom-only" ambient shadow to separate it from the grid.
*   **Empty State:** Use a `ghost-border` dashed line to indicate where the next word will land.

### Action Buttons (Primary/Secondary)
*   **Primary:** Rounded `full` (pill shape). Use the signature gradient (Primary Fixed to Primary Fixed Dim). White text (`on_primary`).
*   **Secondary:** Rounded `full`. Use `secondary_container` (#c3ebdd) with `on_secondary_container` text. No border.

### Selection Chips
*   **Style:** `md` radius (1.5rem). 
*   **Unselected:** `surface-container-high`.
*   **Selected:** `tertiary_container` (#e7defc) with a subtle `tertiary` (#625b74) icon checkmark.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical padding in large layouts to create "breathing room."
*   **Do** use `xl` (3rem) corner radii for main communication tiles to make them feel safe/soft.
*   **Do** use `primary_container` (#b5d5f6) as a highlight color instead of high-contrast yellows or reds.
*   **Do** prioritize vertical whitespace (minimum 24px) over lines to separate ideas.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on-surface` (#3e310e) for a softer, organic feel.
*   **Don't** use "vibrating" color combinations (e.g., bright green text on a blue background).
*   **Don't** use standard 4px or 8px "web" shadows. They feel too aggressive.
*   **Don't** use 1px dividers. They create "visual noise" that can distract a neurodivergent user.