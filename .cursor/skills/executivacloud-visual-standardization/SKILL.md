---
name: executivacloud-visual-standardization
description: >-
  Applies Executiva Cloud frontend visual standards: type colors (swatches and
  forms without a loose hex field), Edit/Delete via typeManagementStyles,
  aligned action columns, domain icons (lock, ban, refresh), and a11y on
  icon-only buttons. Use when creating or editing components under
  frontend/components, category/type modals, tables with actions, or when the
  user asks for visual alignment with the project.
---

# Executiva Cloud — visual standardization (skill)

**Product UI strings** remain **pt-BR** where the app uses Portuguese (e.g. tooltips, button labels). This skill text is in English.

## When to use this skill

- New **type/category management** modals (color + name).
- New tables or rows with **edit / delete / specific actions**.
- Changes to **ContactsView, AgendaView, DocumentsView, ExpensesView, TasksView, UserManagementView** or `components/ui/` related to colors and icons.

## Checklist — colors

1. In the type modal **list**: `TypeColorSwatch` with `size="md"` + name; layout `flex min-w-0 flex-1 items-center gap-3` + `truncate` on the text.
2. In the type **form**: `TypeColorFormField` with a unique `id`; do not add a second text field for `#RRGGBB`.
3. After backend category changes: ensure migration + TS type + `map*` in the service with fallback `#64748b` when applicable.

## Checklist — Edit / Delete icons

1. `import { typeMgmtEditIconBtn, typeMgmtDeleteIconBtn } from './ui/typeManagementStyles'` (adjust relative path).
2. `<button type="button" className={typeMgmtEditIconBtn} aria-label="..."><EditIcon /></button>` and the same pattern for delete (`aria-label` in pt-BR if shown to users).
3. Do not reintroduce local `text-slate-400` / `hover:bg-slate-200` only for these pairs unless documented (e.g. special card background — may compose with ` ${typeMgmtEditIconBtn} bg-white/80 ...`).

## Checklist — Actions column (dense tables)

1. Header: `text-right`, `whitespace-nowrap`, `min-w-[10rem]` or enough width so all icons stay on one row.
2. Cell: `align-middle whitespace-nowrap text-right`.
3. Icon group: `inline-flex flex-row flex-nowrap items-center justify-end gap-0.5`.

## Checklist — UserManagement (account actions)

1. Edit: `typeMgmtEditIconBtn` + `EditIcon` with `h-5 w-5` if needed.
2. Resend first-access / reset password: `LockClosedIcon`; loading with `aria-busy`, `disabled={!!mailBusy}`, tooltip e.g. “Enviando…” (pt-BR) when applicable.
3. Deactivate: `NoSymbolIcon`, not red text alone.
4. Refresh list: button with `RefreshIcon`; avoid infinite spinner on the icon; optional `active:scale-95` on the button.

## Checklist — accessibility

- Every icon-only button: `aria-label` + preferably a coherent `title` (tooltip).

## Reference files

| Concept | Path |
|---------|------|
| Swatch | `frontend/components/ui/TypeColorSwatch.tsx` |
| Color form field | `frontend/components/ui/TypeColorFormField.tsx` |
| Edit/delete classes | `frontend/components/ui/typeManagementStyles.ts` |
| Shared icons | `frontend/components/Icons.tsx` |

## Anti-patterns (avoid)

- Hex visible in one form and only a circle elsewhere — **single pattern**: `TypeColorSwatch` / `TypeColorFormField`.
- Type lists with name only and no swatch when the model has color.
- `flex-wrap` on the actions column when the design requires a single row of icons.
- Replacing `RefreshIcon` with a recurrence-style icon or stroke that reads as a different affordance.
