# Portfolio Tracker Editorial Style Guide (v2)

## Design Direction
- Personality: Precision and Density + Data and Analysis.
- Product promise: beginner-friendly first read, advanced depth on demand.
- Visual metaphor: monochrome field report on warm paper.

## Foundations
- Typography:
  - Primary/UI/data: IBM Plex Mono rhythm (fallback Geist Mono).
  - Numbers: tabular-nums everywhere.
- Day paper theme:
  - Background: `#FCF7EB`.
  - Baseline ink: `#393939`.
- Night paper theme:
  - Warm charcoal background with off-white ink.
- Radius:
  - Minimal (`4px/6px`).
- Elevation:
  - Borders-first, no glossy shadows.

## Layout Strategy (Locked)
- Option A across product:
  - App workflows keep sidebar shell.
  - Report/public pages use fullscreen paper + sticky `Menu` button.
- Stock report desktop layout:
  - **2 columns only**.
  - Left rail: ticker identity + quick facts.
  - Right rail: single vertical narrative stream.
- Reading order:
  - Snapshot -> Chart -> Business summary -> Fundamentals -> Risks -> Advanced details.

## Progressive Disclosure
- Default view must stay understandable for non-advanced users.
- Dense data moves under `details`/expanders/dialogs.
- Every major section ends with `Co to znaczy dla inwestora?`.

## Border Grammar
- Use dashed separators with explicit ink tone for report rows:
  - `border-dashed border-[#393939]`.
- Prefer separators over heavy widget cards.
- Column separators may use utility classes where needed.

## Motion
- Micro interactions: ~`150ms`.
- Menu panel: ~`200-220ms`.
- Chart draw animation: enabled and calm (`~450-750ms`), disabled when reduced-motion is on.
- Easing: `ease-out` or `cubic-bezier(0.25, 1, 0.5, 1)`.

## Chart Language
- Price line color depends on selected-range performance:
  - Up range -> profit green.
  - Down range -> loss red.
  - Flat range -> neutral ink.
- Dashed horizontal grid.
- Plain tooltip (paper background, ink border, mono text).
- Buy/sell markers remain semantic only.

## Copy and Localization
- Product UI copy is Polish only.
- Tone: report-like, concise, no marketing fluff.
- Explain before you optimize for density.

## Image Workflow
- During build: placeholder images may use `https://picsum.photos/...`.
- Final assets: engraved monochrome editorial illustrations.

### Prompt Template
`<subject>, 19th century engraved illustration, pen-and-ink stippling and cross-hatching, Victorian scientific engraving, monochrome, black ink on warm off-white paper, no color, no gradients, no smooth shading, editorial illustration, antique textbook plate`

### Current Report Placeholder Slots
- Left rail illustration: `https://picsum.photos/420/280?random=41`
- Snapshot section illustration: `https://picsum.photos/960/360?random=42`
