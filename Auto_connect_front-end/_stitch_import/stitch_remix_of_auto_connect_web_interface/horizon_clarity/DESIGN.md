# Design System Specification: The Empathetic Interface

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Gentle Guardian."** 

In the context of an AAC (Augmentative and Alternative Communication) application, the UI must transcend being a mere tool; it must feel like a calm, supportive presence. We are moving away from the "medical software" aesthetic and toward a high-end, editorial experience that balances the playful simplicity required for children with the authoritative, data-driven precision needed by therapists.

By utilizing **intentional asymmetry, tonal layering, and an aggressive rejection of structural lines**, we create a digital environment that breathes. This system avoids the "boxed-in" feeling of traditional grids, instead opting for a fluid, organic layout where content is anchored by gravity and white space rather than rigid containers.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

This system uses color not just for decoration, but as the primary architect of space.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` component should sit on a `surface` background to define its edges.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine, heavy-weight paper. 
- **Base Layer:** `surface` (#f3f7fb)
- **Secondary Sectioning:** `surface-container-low` (#ecf1f6)
- **Interactive Cards/Elements:** `surface-container-lowest` (#ffffff) for maximum "pop" and perceived elevation.

### The Glass & Gradient Rule
To move beyond a generic "flat" look, main CTAs and hero elements should utilize **Signature Textures**. 
- **The Vitality Gradient:** Transition from `primary` (#0050d4) to `primary-container` (#7b9cff) at a 135-degree angle. This provides a "soul" to the interface that flat hex codes cannot achieve.
- **Glassmorphism:** For floating overlays (modals or floating action buttons), use a semi-transparent `surface-container-lowest` with a `backdrop-blur` of 20px. This ensures the UI feels integrated and modern.

---

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to bridge the gap between "Child-Friendly" and "Clinically Professional."

*   **Display & Headlines:** **Plus Jakarta Sans.** This typeface offers a geometric yet friendly personality. Its high x-height and open apertures ensure readability for children while feeling sophisticated for adults.
*   **Body & UI Labels:** **Inter.** A workhorse sans-serif designed for screens. It provides the "Data-Driven" clarity required for therapist dashboards.

**Hierarchy as Identity:**
- **Display-LG (3.5rem):** Used for "Big Wins" and developmental milestones.
- **Title-MD (1.125rem):** The standard for communication tiles.
- **Label-SM (0.6875rem):** Used for metadata in therapist reports, set in All Caps with +5% letter spacing for an editorial touch.

---

## 4. Elevation & Depth: The Layering Principle

We achieve hierarchy through **Tonal Layering** rather than traditional shadows.

*   **The Layering Principle:** Depth is achieved by "stacking." Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift.
*   **Ambient Shadows:** If an element must "float" (e.g., a communication card being dragged), use a shadow tinted with the `on-surface` color (#2a2f32) at 4% opacity with a 40px blur. Never use pure black shadows.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a border (e.g., high-contrast mode), use `outline-variant` (#a9aeb1) at 15% opacity. **100% opaque borders are forbidden.**

---

## 5. Components: Softness & Intent

### Communication Tiles (Cards)
*   **Styling:** No borders. Use `surface-container-lowest` (#ffffff) background. 
*   **Radius:** `lg` (2rem) for a friendly, approachable feel.
*   **Interaction:** On hover/touch, shift background to `primary-container` (#7b9cff) and apply the Vitality Gradient.

### Buttons
*   **Primary:** Vitality Gradient background, `on-primary` (#f1f2ff) text. Corner radius: `full` (9999px).
*   **Secondary:** `surface-container-high` (#dde3e8) background. No border.
*   **Tertiary:** Ghost style. No background, `primary` text.

### Input Fields & Search
*   **Structure:** `surface-container-low` (#ecf1f6) fills. Avoid "box" outlines.
*   **Focus State:** A soft 4px outer glow of `primary_fixed_dim` (#658eff) at 30% opacity.

### Lists & Progress (Therapist View)
*   **The No-Divider Rule:** Forbid the use of horizontal divider lines. Use vertical whitespace (32px+) or subtle background alternating (`surface` vs `surface-container-low`) to separate content.
*   **Progress Gauges:** Use `secondary` (#006947) for "Success/Progress" states. The track should be `secondary_container` (#69f6b8) at 20% opacity.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Place therapist data charts slightly off-center or overlapping a container edge to create a bespoke, non-templated look.
*   **Use Large Radii:** Stick strictly to the `lg` (2rem) and `xl` (3rem) tokens for main containers to maintain the "Soft Minimalism" vibe.
*   **Prioritize Breathing Room:** If in doubt, double the whitespace. In an AAC app, cognitive load is the enemy.

### Don’t:
*   **Don't use "True Black":** All "dark" elements must use `on-surface` (#2a2f32). It is softer on the eyes and feels premium.
*   **Don't use 1px Dividers:** Lines create visual noise. Use color blocks or space to define sections.
*   **Don't use standard shadows:** Avoid the "dropped-from-the-sky" look. Shadows should feel like ambient light hitting a thick piece of cardstock.

---

## 7. Signature Token Reference

| Property | Token Value | Usage |
| :--- | :--- | :--- |
| **Corner Radius** | `lg` (2rem) | Main communication cards and content blocks. |
| **Corner Radius** | `xl` (3rem) | Large background "pods" and layout sections. |
| **Primary Color** | `primary` (#0050d4) | Core brand actions and active states. |
| **Success Color** | `secondary` (#006947) | Progress bars, achievement badges, therapy goals. |
| **Background** | `surface` (#f3f7fb) | The canvas for the entire application. |
| **Shadow** | `0 20px 40px rgba(42, 47, 50, 0.06)` | The only acceptable "floating" shadow. |