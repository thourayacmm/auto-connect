# Design System Specification: The Gentle Guardian

## 1. Overview & Creative North Star
The North Star for this design system is **"The Mindful Sanctuary."** 

Unlike traditional communication tools that often feel clinical or overly "toy-like," this system treats the AAC experience as a high-end, editorial sanctuary. We reject the rigid, boxy layouts of standard software in favor of **Organic Layering**. The interface should feel like a collection of smooth, river-washed stones resting on a soft linen surface. 

We move beyond the "grid" by using intentional asymmetry and overlapping surfaces to create a sense of natural flow. This reduces cognitive load for the user, transforming the interface from a "task" into a "presence." The "Gentle Guardian" personality is expressed through large amounts of negative space, ultra-soft radii, and a total absence of harsh structural lines.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

This system utilizes a warm, empathetic palette that prioritizes the nervous system's regulation. 

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through:
1. **Background Color Shifts:** Placing a `surface-container-low` section against a `surface` background.
2. **Tonal Transitions:** Using subtle shifts between peach and cream to denote change in context.

### Surface Hierarchy & Nesting
We treat the UI as a series of physical layers. To create depth without visual clutter:
- **Base Level:** `surface` (#fff8f0) - The primary canvas.
- **Floating Contexts:** `surface-container-low` (#faf3e7) for secondary groupings.
- **Interactive Elements:** `surface-container-highest` (#eae2d2) for the most prominent interactive blocks.
- **The Depth Rule:** Nested containers should always move "up" or "down" one level in the `surface-container` tier to define hierarchy.

### The Glass & Gradient Rule
To ensure the app feels premium rather than "flat":
- **Glassmorphism:** For floating navigation or modal overlays, use `surface-variant` at 80% opacity with a `20px` backdrop-blur. This keeps the user connected to the background context while providing focus.
- **Signature Gradients:** Use a subtle linear gradient (Top-Left to Bottom-Right) from `primary` (#8f4f14) to `primary-container` (#ffaf71) on high-value CTAs. This adds "soul" and a tactile, sun-drenched quality.

---

## 3. Typography: The Empathetic Voice

We use **Plus Jakarta Sans** across all scales. Its geometric yet humanist curves provide a professional but approachable tone.

*   **Display (sm/md/lg):** Used for "Hero" moments or mood-setting greetings. High contrast in size is encouraged to create an editorial feel.
*   **Headline & Title:** These are the "Guide" levels. They use the `on-surface` color (#363227) to provide clear, grounded direction.
*   **Body (lg/md/sm):** Optimized for maximum legibility. Body-lg (1rem) is the standard for communication tiles to ensure accessibility for users with motor or visual challenges.
*   **Label:** Used sparingly for metadata.

**Visual Rhythm:** Pair `display-md` headings with `body-lg` text to create a sophisticated, spacious hierarchy that feels intentional and calm.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows and borders are often over-stimulating. We achieve "lift" through **Tonal Layering.**

*   **The Layering Principle:** Instead of a drop shadow, place a `surface-container-lowest` (#ffffff) card on a `surface-container` (#f5ede0) background. This creates a natural "bleach-out" effect that signifies elevation.
*   **Ambient Shadows:** Use only for floating action buttons or high-level modals. Shadows must be `on-surface` color at 5% opacity, with a `32px` blur and `8px` Y-offset. It should feel like a soft glow, not a dark edge.
*   **The Ghost Border Fallback:** If a container absolutely requires a boundary for accessibility, use the `outline-variant` (#b9b1a3) at **15% opacity**. 100% opaque borders are strictly forbidden.
*   **Soft Radii:** Adhere to the `xl` (3rem) or `lg` (2rem) corner scale for all main containers to maintain the "river-stone" aesthetic.

---

## 5. Components: The Tactile Interface

### Buttons & Chips
- **Primary Action:** Gradient fill (Primary to Primary-Container). `xl` rounded corners. No border.
- **Secondary/Ghost:** `surface-container-high` background with `on-surface` text.
- **Communication Tiles (AAC Specific):** Large `md` (1.5rem) rounded cards. Use `surface-container-low` for inactive states and `secondary-container` for the "selected/vocalized" state to provide a calming green feedback loop.

### Inputs & Selection
- **Text Fields:** Use `surface-container-lowest` as the fill. Never use a bottom-line-only input; use a fully rounded container.
- **Checkboxes/Radios:** These should be oversized. A "Selected" state should use the `secondary` (#006b61) color to signify growth and affirmation.

### Lists & Cards
- **The Divider Ban:** Strictly forbid 1px dividers between list items. Separate items using `12px` of vertical white space and subtle background shifts (`surface-container-low` vs `surface`).
- **Nesting:** A list of communication categories should sit within a `surface-container` background, with each individual item being a `surface-container-lowest` card.

### Contextual Tooltips
- Use `tertiary-container` (#a0d5fb) with `on-tertiary-container` text. The light blue accent provides a "cooling" effect for instructional moments, reducing user anxiety.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace White Space:** If you think there is enough padding, add 20% more. Space is the primary tool for empathy.
- **Use "Warm" Neutrals:** Always prefer the beige/cream spectrum (`surface-container` tiers) over pure greys.
- **Layer for Focus:** Use backdrop blurs to dim the background when a user is in a deep communication flow.

### Don't:
- **No Harsh Contrast:** Avoid pure black (#000000) on white. Use `on-surface` (#363227) for all primary text.
- **No Sharp Corners:** Never use a radius smaller than `sm` (0.5rem), even for small elements like tooltips.
- **No Rapid Transitions:** All hover and active states should have a minimum `300ms` ease-in-out transition to keep the "Gentle Guardian" pace.