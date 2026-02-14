# Portfolio Tracker Editorial Style Guide (v1)

## Design Direction
- Personality: Precision and Density + Data and Analysis.
- Visual metaphor: monochrome field report on warm paper.
- Outcome: fast scanning, high trust, low ornament.

## Foundations
- Typography:
  - Primary/UI/data: IBM Plex Mono look and rhythm (fallback to Geist Mono).
  - Numbers: always tabular.
- Light theme (`day paper`):
  - Paper: warm, darker-than-white beige.
  - Ink: `#393939`.
- Dark theme (`night paper`):
  - Deep warm charcoal paper.
  - Off-white ink.
- Radius scale: minimal (`4px/6px` family).
- Depth: borders only, no glossy shadows.

## Border Grammar
- Default module boundary: dashed border.
- Column separators and section rules: dashed.
- Strong hierarchy: one solid/darker rule only where navigation context needs it.

## Motion
- Micro interactions: `150ms`.
- Panel/drawer: `200-220ms`.
- Easing: `cubic-bezier(0.25, 1, 0.5, 1)`.
- No spring, bounce, or continuous chart animation.

## Color Semantics
- Color appears only for meaning:
  - Profit: muted green.
  - Loss: muted brick red.
  - Neutral trend accents: dusty warm tones.
- Structural UI remains mostly ink/paper.

## Shell Strategy (Option A)
- App workflows (`/portfolio`, `/transactions`, `/settings`, `/stocks`):
  - Sidebar layout, denser operational rhythm.
- Report/public pages (`/stocks/[providerKey]`, `/login`, `/`):
  - Full-screen paper feel.
  - Minimal top bar + `Menu` drawer.

## Page Patterns
- Landing:
  - Hero copy + single primary action.
  - One large illustration slot.
  - Small metric chips below.
- Stock report:
  - Left/main data rail (chart + tables + analysis cards).
  - Right context rail (AI summary, metadata, investor mode CTA).
- Login:
  - Focused authentication card.
  - Google first, then email/password.
  - Illustration slot on desktop.

## Chart Language
- Dashed horizontal grid.
- Flat color strokes.
- Plain tooltip (paper box, ink border, mono text).
- Buy/sell markers (for logged-in users only), no decorative effects.

## Copy and Localization
- Product UI copy is Polish only.
- Headlines concise, declarative, report-like.
- Avoid marketing superlatives and decorative wording.

## Image Direction
- Use engraved/editorial monochrome images only.
- Keep illustrations contextual (finance desk, report reading, market device).
- Avoid color-heavy or photorealistic assets.

### Prompt Template
`<subject>, 19th century engraved illustration, pen-and-ink stippling and cross-hatching, Victorian scientific engraving, monochrome, black ink on warm off-white paper, no color, no gradients, no smooth shading, editorial illustration, antique textbook plate`

### Current Required Slots
- Landing hero image: astronaut reading a printed stock report.
- Login illustration: ledger desk with fountain pen and market notes.
- Stock report side illustration: hand with phone showing market chart and coffee cup.
