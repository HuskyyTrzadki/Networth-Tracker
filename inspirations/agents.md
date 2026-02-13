## design idea inspiration.
Final Style Report (paste this into your agent file)
1) Core concept

“Monochrome field report on warm paper.”
Feels like: research memo, printed brief, technical bulletin. Data-dense, no gloss, no gradients, no soft shadows.

2) Non-negotiables (signature look)

Font: IBM Plex Mono everywhere (headings, body, numbers).

Ink color: charcoal, not black. Use #393939 as the default for text + borders + icons.

Paper background: warm beige (not white).

Primary border style: dashed as the default container language.

Subtle rounding: present on “modules” (cards/articles), not on the page shell.

Hover language: simple ink↔paper inversion (button fills with ink, text flips to paper).

3) Color system (tokens)

Use a tiny system; most UI is just Ink + Paper.

Base

Paper (day): warm beige similar to #FBF7EB.

Ink: #393939 (this is your UI’s backbone).

Your requested change: paper 15% darker

Paper (evening): target around #D5D1C8 (approx 15% darker vs #FBF7EB).
Keep it warm; don’t drift into gray.

Accents (use sparingly)

Positive: muted green (flat, not neon).

Negative: brick red.

Neutral highlight: terracotta / dusty orange (good for charts).
Rule: accents only for “signal” (delta, change, selected state). Everything else stays ink/paper.

4) Typography rules (hierarchy that matches your snippet)

Section titles (like “Opportunity Radar”): medium-large, bold, clean.

Card titles: very heavy weight, tight tracking, tight leading.

Body paragraphs: small, high line-height, max 3–4 lines in previews (truncate/line-clamp).

Labels: uppercase is allowed but keep it for tiny metadata, not long text.

5) Layout rules

Grid-first layout with hard separations.

On desktop: 2-column + 1-column structure is common; the split is emphasized by a right dashed divider.

Use consistent gutters; don’t over-space. This design wants density.

6) Component patterns (what to build)

A) “Report Card / Article” (your main repeating module)

Container: dashed border in ink, warm paper fill.

Inside padding: compact but not cramped.

Title: heavy, tight.

Description: smaller ink text, line-clamped.

Footer: chip row + right-aligned action button.

B) Chips / tickers (the little symbol pills)

Ink border, ink text, tiny logo square at the start.

Tight vertical padding; they should look like printed labels.

Slight rounding only.

C) Primary action button (“Read”)

Default: outline (ink border + ink text).

Hover: fills with ink, text flips to paper.

Keep it small and blunt.

D) Tables

Should look like ledger printouts:

Strong header row rule

Dotted/dashed row separators

Row hover = subtle paper tint shift (not a shadow, not a glow)

7) Chart language (if you add charts)

Flat fills only, no gradients.

Minimal axis; grid lines dotted/dashed.

Tooltip: plain box, ink border, paper fill, mono text.

Don’t make charts “pretty.” Make them “legible and blunt.”

8) Imagery / icons

Prefer engraving/etching or “newspaper scan” style if you use illustrations.

Icons should be simple, single-color ink.

Avoid modern colorful SVG packs; they break the illusion.

9) Interaction rules (keep it quiet)

No animation-heavy UI.

Micro-interactions only:

hover background shift

border emphasis

ink/paper inversion

No drop shadows; if you need depth, do it with borders and spacing.

10) Do / Don’t (enforcement list)

Do

Default everything to Paper + Ink (#393939).

Use dashed borders as the primary visual grammar.

Keep titles heavy and compact.

Keep content dense and modular.

Don’t

Don’t use pure black (#000) as the primary ink.

Don’t use big radiuses or soft shadows.

Don’t introduce a wide grayscale palette.

Don’t add glossy chart styling (gradients/glows).

One practical note about your “15% darker paper”

If you darken paper, watch contrast on:

paragraph text (might need slightly darker ink or just keep #393939)

hover states (paper-tint hovers may become invisible; use ink-outline emphasis instead)

