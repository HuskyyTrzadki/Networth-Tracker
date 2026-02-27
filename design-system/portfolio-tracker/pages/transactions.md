# Transactions Page Overrides

> **Project:** Portfolio Tracker  
> **Updated:** 2026-02-26  
> **Page:** `/transactions`

> This file overrides `design-system/portfolio-tracker/MASTER.md` for transaction history screens.

---

## Page Goal

Create a ledger-like operating console that feels premium and trustworthy, while still approachable for beginner/medium investors.

---

## Layout Overrides

### Structure Order
1. Hero strip with page title + compact stats
2. Filter/search console
3. Active filter rail (only when filters exist)
4. Ledger section (table + pagination)

### Density
- High information density is allowed, but spacing must remain regular and predictable.
- Prefer compact vertical rhythm over oversized cards.

---

## Transactions-Specific Component Rules

### Hero Strip
- Keep it framed (`rounded-xl`, soft border, tactile shadow)
- Include compact KPI blocks (rows count, active filters, scope)
- Keep description short and operational

### Filter Console
- Add explicit labels above control groups
- Keep one clear pending/loading indicator
- Portfolio scope selector should have its own framed row

### Active Filter Rail
- Use dashed container border and stamp-like chips
- Chips should be compact and removable
- Include one clear “reset all” action

### Ledger Section
- Section header should include context text + current sort mode
- Table container should feel like an inset paper layer
- Header row: subtle sticky strip with dashed bottom rule
- Row stripes/hover should be visible but calm

### Empty State
- Tone: operational and encouraging
- Keep CTA options compact and obvious
- Message should explain whether no data or no filtered results

### Pagination
- Use compact controls with current page indicator in mono
- Keep pagination inside ledger section, not detached below

---

## Copy Tone (Polish UI)

- Direct, informative, no marketing language
- Avoid jargon overload
- Keep labels short and scannable

---

## Page Anti-Patterns

- ❌ Neon BUY/SELL color coding on transaction type labels
- ❌ Overly decorative hero blocks
- ❌ Dense table without visual grouping separators
- ❌ Empty state without a clear next action
