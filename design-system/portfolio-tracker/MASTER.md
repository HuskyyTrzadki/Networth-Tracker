# Portfolio Tracker - Visual System (Continuity Refresh v1)

Project style direction for a premium-but-friendly Polish portfolio app.

## Intent
- Keep current editorial, beginner-friendly feel.
- Increase polish and trust with subtle token-level refinements.
- Avoid dramatic visual shifts that increase cognitive load.

## North Star
- Pattern: `Financial Ledger / Sunday Dossier`
- Style: `Editorial Grid + Tactile Swiss Modernism`
- UX tone: calm, authoritative, readable, not flashy

## Keep (Continuity Rules)
- Preserve information architecture and widget order on `/portfolio`.
- Keep typography roles:
  - UI copy/labels: `Geist Sans` (fallback Inter)
  - Editorial emphasis/headlines: `Newsreader`
  - Numbers/money/percentages: `IBM Plex Mono` with `tabular-nums`
- Keep dashed ledger separators and compact data density.
- Keep semantic profit/loss colors, but only where meaning is critical.

## Refresh (What We Improve)
- Softer paper-like surfaces and calmer shadow contrast.
- Slightly quieter borders and table separators.
- Less aggressive badge styling by default (stamp-like neutral labels).
- Slightly reduced motion intensity/duration.

## Color Direction
- Background layer: warm off-white / paper tone.
- Card layer: crisp light surface, subtle lift.
- Primary text: deep charcoal (not pure black).
- Semantic accents:
  - Profit: muted institutional green
  - Loss: muted institutional red
- Avoid high-saturation/neon accents.

## Component Rules
- Cards:
  - Soft drop shadow + restrained contrast.
  - Small radius (`~6px`) for editorial precision.
- Badges:
  - Default badge should be neutral and subdued.
  - Strong semantic colors only for status that matters (gain/loss, warnings).
- Tables:
  - Keep semantic table structure.
  - Dashed separators remain, but with lower opacity.
- Charts:
  - For part-to-whole with many categories, prefer horizontal stacked bars or treemap over tiny-slice donuts.
  - Maintain readable labels, subdued grid lines, and consistent number formatting.

## Motion
- Prefer short, calm transitions (`~130-200ms` primitives).
- Use motion to clarify state change, not for decoration.
- Respect `prefers-reduced-motion`.

## Strict Anti-Patterns
- No glassmorphism or heavy blur UI.
- No neon crypto-like green/red.
- No heavy gradients as primary style language.
- No oversized decorative animations.
- No chart choices that hurt readability (for example tiny-slice donuts).

## Practical Review Checklist
- Is this visually consistent with current app shell and portfolio widgets?
- Is the new style calmer and clearer for beginner investors?
- Does every number-heavy area keep mono + tabular alignment?
- Are badges/separators informative without visual noise?
- Can a user scan the dashboard in under 10 seconds?
