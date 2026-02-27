# Design System Master File

> **Logic:** For a page override, read `design-system/portfolio-tracker/pages/[page].md` first.
> If override exists, it wins. Otherwise follow this file.

---

**Project:** Portfolio Tracker  
**Updated:** 2026-02-26  
**Category:** Fintech Dashboard (Desktop-first)

---

## Global Direction

### Pattern
- **Name:** Financial Ledger / Sunday Dossier
- **Vibe:** high-end Swiss bank statement, Financial Times, printed ledger
- **Principles:** strict alignment, high data density, calm authority, low visual noise

### Style
- **Name:** Editorial Grid + Tactile Swiss Modernism
- **Primary feeling:** beginner-friendly but professional and premium
- **Rhythm:** compact sections, clear separators, predictable hierarchy

---

## Core Tokens

### Color System (OKLCH Layering Intent)

| Role | Intent | Current Token |
|------|--------|---------------|
| Layer 1 (Background) | Warm off-white paper | `--background` |
| Layer 2 (Card) | Crisp white paper sheet | `--card` |
| Primary Text | Deep charcoal, not pure black | `--foreground` |
| Supporting Text | Softer neutral gray | `--muted-foreground` |
| Profit | Muted institutional green | `--profit` |
| Loss | Muted institutional red | `--loss` |
| Rules/Dividers | Editorial linework | `--border`, `--report-rule` |

### Typography
- **UI / Headers / Copy:** Geist Sans (`--font-sans`)
- **Data / Numbers:** IBM Plex Mono (`--font-mono`)
- **Rule:** numeric outputs and totals use `tabular-nums`

### Depth and Surface
- Use soft tactile shadows (`--surface-shadow`) with restrained contrast.
- Card tops should read as paper layers (subtle highlight / inner top border feel).
- Prefer dashed/dotted separators over thick solid borders.

---

## Global Component Rules

### Cards
- Rounded but restrained (`rounded-lg` to `rounded-xl` max)
- Border: subtle (`border-border/65` to `border-border/80`)
- Background: paper-like (`bg-card`, `bg-background` tints)
- Shadow: use existing surface shadow variables, avoid heavy blur stacks

### Buttons
- Primary action can be solid, but avoid loud saturation
- Utility/filter controls should favor outline/ghost and compact sizing
- For chip-like controls prefer rounded-full with low-contrast borders

### Tables / Ledger Views
- Header row should be clearly separated and sticky when useful
- Group boundaries should use dashed rules
- Alternating row rhythm should be subtle, never zebra-heavy
- Hover states should be calm, not high-contrast flashes

### Badges
- Use stamp-like subdued badges
- Avoid semantic red/green on neutral action labels (e.g. BUY/SELL labels)
- Reserve profit/loss color for actual performance or P/L context

---

## Motion
- Micro-interactions only where they reinforce hierarchy
- Standard transitions: 150-250ms
- Respect `prefers-reduced-motion`

---

## Accessibility + Readability
- Text contrast should stay AA in light mode
- Keep heading hierarchy sequential
- Keep dense screens scannable with consistent size scale
- Numeric readability first: spacing, grouping, mono alignment

---

## Strict Anti-Patterns

- ❌ Glassmorphism or neumorphism
- ❌ Neon crypto-style greens/reds
- ❌ Thick box borders around every item
- ❌ Donut charts with many tiny slices for allocation
- ❌ Decorative gradients as primary style language

---

## Delivery Checklist

- [ ] Uses two-font hierarchy correctly (sans + mono)
- [ ] Tables use semantic structure and readable rhythm
- [ ] Profit/loss colors only in correct semantic contexts
- [ ] Surfaces read as layered paper, not generic SaaS cards
- [ ] Beginner-friendly clarity preserved (no visual overload)
