---
name: executivacloud-visual-standardization
description: >-
  Applies Executiva Cloud frontend visual standards: global ViewSwitcher in
  header, toolbar layout (icons above search), CSV export, type colors (swatches
  and forms without a loose hex field), Edit/Delete via typeManagementStyles,
  aligned action columns, domain icons (lock, ban), and a11y on icon-only
  buttons. Use when creating or editing components under frontend/components,
  category/type modals, tables with actions, or when the user asks for visual
  alignment with the project.
---

# Executiva Cloud — visual standardization (skill)

**Product UI strings** remain **pt-BR** where the app uses Portuguese (e.g. tooltips, button labels). This skill text is in English.

## When to use this skill

- New **type/category management** modals (color + name).
- New tables or rows with **edit / delete / specific actions**.
- New or modified views that display data listings.
- Changes to **ContactsView, AgendaView, DocumentsView, ExpensesView, TasksView, UserManagementView, ExecutivesView, SecretariesView, OrganizationsView, LegalOrganizationsView** or `components/ui/` related to colors, icons, or layout.

## Checklist — Global ViewSwitcher

1. `ViewSwitcher` is in **`MainAppLayout.tsx` header**, next to the executive selector dropdown — never inside individual views.
2. `MainAppLayout` owns a single `layout: LayoutView` state (`'card' | 'list' | 'table'`) and passes it as a prop to every data view.
3. Views accept `layout: LayoutView` in their props interface and render card / list / table accordingly.
4. ViewSwitcher is hidden on `dashboard` and `settings` views.

## Checklist — Toolbar layout (per-screen)

1. **Row 1 (above search)**: action icons in a `flex flex-wrap items-center justify-end gap-2` div: page-size `<AppSelect aria-label="Itens por página">`, CSV `<PrinterIcon>`, Add `<PlusIcon>`, Settings `<CogIcon>` as applicable.
2. **Row 2 (below icons)**: `<ToolbarPanel>` containing `<AppSearchInput>` search field.
3. **Row 3 (optional)**: filter pills (type, status, priority) in another `<ToolbarPanel>`.
4. No visible "Itens por página" label text — only the dropdown with `aria-label`.

## Checklist — CSV export

1. `PrinterIcon` button triggers `downloadCsv()` from `utils/csvDownload.ts`.
2. Export **all filtered records** (not just the current page), BOM-prefixed UTF-8.
3. File names: `<entity>_YYYY-MM-DD.csv` using `todayStamp()`.

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
2. Resend first-access / reset password: `LockClosedIcon`; loading with `aria-busy`, `disabled={!!mailBusy}`, tooltip e.g. "Enviando…" (pt-BR) when applicable.
3. Deactivate: `NoSymbolIcon`, not red text alone.
4. Invite: icon-only `PlusIcon` button with `title="Convidar usuário"`.

## Checklist — accessibility

- Every icon-only button: `aria-label` + preferably a coherent `title` (tooltip).

## Reference files

| Concept | Path |
|---------|------|
| ViewSwitcher | `frontend/components/ViewSwitcher.tsx` |
| Main layout (owns layout state) | `frontend/MainAppLayout.tsx` |
| CSV utility | `frontend/utils/csvDownload.ts` |
| Swatch | `frontend/components/ui/TypeColorSwatch.tsx` |
| Color form field | `frontend/components/ui/TypeColorFormField.tsx` |
| Edit/delete classes | `frontend/components/ui/typeManagementStyles.ts` |
| Shared icons | `frontend/components/Icons.tsx` |

## Anti-patterns (avoid)

- `ViewSwitcher` inside individual views — it belongs in the app header.
- Icons/action buttons BELOW the search field — they must always be ABOVE.
- Visible "Itens por página" label text — use only `aria-label` on the select.
- Hex visible in one form and only a circle elsewhere — **single pattern**: `TypeColorSwatch` / `TypeColorFormField`.
- Type lists with name only and no swatch when the model has color.
- `flex-wrap` on the actions column when the design requires a single row of icons.
