# Design System Strategy: The Digital Sentinel

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Forensic Architect."** 

This system moves away from the friendly, rounded "SaaS-standard" look. It embraces the tension between the high-stakes world of Intellectual Property law and the raw, analytical precision of cybersecurity. We are not just building a dashboard; we are building a high-fidelity monitoring station.

The aesthetic achieves an "Editorial Brutalism" through:
*   **Absolute Geometry:** 0px border-radii across the entire system to project authority and precision.
*   **Intentional Density:** Information-rich layouts that prioritize data throughput over "white space for the sake of white space."
*   **Asymmetric Focus:** Breaking the standard 12-column symmetry to highlight active "scans" or "infringements" through glowing accents and technical offsets.

## 2. Colors & Surface Logic
The palette is rooted in the "Deep Dark"—avoiding pure black in favor of atmospheric navies and charcoals to allow for sophisticated layering.

### Surface Hierarchy & The "No-Line" Rule
Traditional 1px borders are prohibited for sectioning. We define structure through **Tonal Shifting**.
*   **Base Layer:** Use `surface` (#10131a) for the primary application canvas.
*   **Sectioning:** Move to `surface_container_low` (#191c22) or `surface_container` (#1d2026) to define sidebars or header regions. 
*   **Nesting:** When placing a card inside a section, use `surface_container_highest` (#32353c). The contrast is subtle, creating a "machined" look rather than a "pasted" look.

### The "Glass & Gradient" Rule
To simulate active AI processing, use `surface_variant` at 60% opacity with a `backdrop-filter: blur(12px)`. This "Glassmorphism" should be reserved for floating command bars or alert overlays.
*   **Signature Glow:** Use a linear gradient from `primary` (#ffd597) to `primary_container` (#ffb000) for active monitoring states. This provides a "warm filament" glow against the cold charcoal base.

## 3. Typography: Precision Engineering
The typography system uses a high-contrast pairing to distinguish between "Legal Authority" and "Technical Data."

*   **Display & Headlines (Space Grotesk):** Use for page titles and high-level metrics. Space Grotesk’s geometric quirks lean into the "hacker tool" aesthetic.
*   **Body & Labels (Inter):** Inter provides maximum readability for dense legal text. 
*   **The Data Variant:** For IP addresses, timestamps, and case numbers, use Inter with `font-feature-settings: "tnum", "onum"` to ensure tabular spacing, mimicking a monospace feel without losing the sophistication of a sans-serif.

| Level | Token | Font | Size | Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Hero** | display-lg | Space Grotesk | 3.5rem | 700 |
| **Section** | headline-sm | Space Grotesk | 1.5rem | 500 |
| **Legal Text** | body-md | Inter | 0.875rem | 400 |
| **Metadata** | label-sm | Inter | 0.6875rem | 600 (Caps) |

## 4. Elevation & Depth
In this design system, elevation is a product of light and tone, not shadows.

*   **Tonal Layering:** Depth is achieved by "stacking." A `surface_container_lowest` (#0b0e14) element placed on a `surface` background creates an "etched-in" look.
*   **Ambient Shadows:** For floating modals, use a massive 64px blur with `on_surface` color at only 4% opacity. It should feel like an atmospheric presence, not a drop shadow.
*   **The Ghost Border Fallback:** If a separator is required for accessibility, use the `outline_variant` (#524533) at 15% opacity. It must look like a faint "grid line" on a blueprint.

## 5. Components

### Buttons (The "Actuators")
*   **Primary:** Solid `primary_container` (#ffb000) with `on_primary` (#432c00) text. 0px radius. No gradient, except on hover where a subtle "inner glow" appears.
*   **Secondary:** `outline` (#9f8e78) Ghost Border with no background.
*   **Tertiary:** Text-only, using `primary_fixed_dim` (#ffba43) in all-caps `label-md` styling.

### Inputs & Forensic Fields
*   **State:** Default backgrounds should be `surface_container_lowest`. 
*   **Focus:** Transition the border to a 1px `primary` (#ffd597) with a subtle 4px outer glow (bloom effect).
*   **Error:** Use `secondary` (#ffb3ae) for field borders during validation failure.

### Chips (Status Indicators)
*   **Monitoring:** Use `primary` text on a `surface_container_highest` background.
*   **Infringement Found:** Use `secondary` (#ffb3ae) text with a pulsing 2px dot of `on_secondary_fixed_variant` (#930014).

### Cards & Data Lists
*   **Strict Rule:** No dividers. Use `spacing.5` (1.1rem) to separate list items.
*   **Interaction:** On hover, change the background from `surface` to `surface_container_low`. This creates a "scanning" effect as the user moves their cursor.

### Specialized Component: The "Status Pulse"
A small, 8px square using `primary_container` with a CSS animation `box-shadow: 0 0 10px #ffb000`. Place this next to "Active Scans" to suggest the "hacker tool" live-processing nature.

## 6. Do's and Don'ts

### Do
*   **Do** use 0px corners everywhere. Sharpness is our visual signature.
*   **Do** embrace density. Users are professionals; they value data-per-square-inch over "airy" layouts.
*   **Do** use `on_surface_variant` (#d7c4ac) for secondary text to maintain a sophisticated, low-contrast hierarchy.

### Don't
*   **Don't** use standard shadows. If it looks like a Google Material card, it’s wrong.
*   **Don't** use rounded icons. Use sharp, linear icon sets (e.g., Phosphor Bold or custom SVG paths).
*   **Don't** use "Alert Blue." For information, use `tertiary` (#d8dbe6). For warnings, use the Amber/Red technical palette provided.