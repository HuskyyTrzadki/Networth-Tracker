# Stocks Report Page Override

## Page Intent
- Desktop stock report for beginner and medium long-term investors.
- First read should feel like a newspaper dossier, not a trading terminal.
- The page must answer: `co to za firma`, `co jest najwazniejsze`, `czy wycena jest sensowna`, `skad bierze sie zysk`.

## Locked Reading Order
1. `Snapshot`
2. `Wykres ceny`
3. `Wycena i fundamenty`
4. `Jak firma zarabia`
5. `Zaawansowane`

## Left Rail
- Keep sticky rail.
- Show only identity, quick facts, and simplified section navigation.
- Do not show decorative imagery.
- Do not add a separate dense profile block unless it becomes genuinely useful.

## Right Rail
- Keep one calm narrative stream.
- Default to a small number of major sections.
- Advanced content lives under one grouped section and should not compete with the first read.

## Copy Rules
- Prefer one short framing sentence over repeated subtitle patterns.
- End major sections with `Co to znaczy dla inwestora?`.
- Avoid academic over-explaining above the fold.
- Delete any sentence that only restates the heading or explains obvious UI.
- Explanatory copy must answer `co z tego wynika` or `na co patrzec dalej`.

## Controls
- Timeframe selection is a primary control and stays visible.
- Hide disabled or not-ready secondary controls.
- Keep chart controls simpler than the data they reveal.
- In `Wycena i fundamenty`, show only one historical valuation context at a time (`P/E`, `P/S`, or `P/B`) and let the switcher control that focus.
- Historical valuation context should be derived from real inputs only:
  - `P/E` from price + EPS TTM,
  - `P/S` from price + revenue TTM + shares outstanding,
  - `P/B` from price + book value + shares outstanding.
- If a valuation metric lacks trustworthy history for a ticker, do not fake min/max/percentile context.

## Visual Rules
- Warm paper background and ink-first contrast stay mandatory.
- Dashed separators should use shared report rule tone.
- Serif headings are valid on this page because it is a report surface, not an app workflow.
