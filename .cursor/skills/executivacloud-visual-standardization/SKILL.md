---
name: executivacloud-visual-standardization
description: >-
  Aplica os padrões visuais do frontend Executiva Cloud: cores em tipos (swatches
  e formulários sem campo hex), botões Editar/Excluir via typeManagementStyles,
  colunas de ações alinhadas, ícones de domínio (cadeado, proibido, refresh), e
  acessibilidade em botões só ícone. Usar ao criar ou alterar componentes em
  frontend/components, modais de categorias/tipos, tabelas com ações, ou quando
  o utilizador pedir padronização visual alinhada ao projeto.
---

# Executiva Cloud — padronização visual (skill)

## Quando usar esta skill

- Novos modais de **gestão de tipos/categorias** (cor + nome).
- Novas tabelas ou linhas com **editar / excluir / ações específicas**.
- Alterações em **ContactsView, AgendaView, DocumentsView, ExpensesView, TasksView, UserManagementView** ou UI em `components/ui/` relacionada com cores e ícones.

## Checklist — cores

1. Na **lista** do modal de tipos: `TypeColorSwatch` com `size="md"` + nome; layout `flex min-w-0 flex-1 items-center gap-3` + `truncate` no texto.
2. No **formulário** do tipo: `TypeColorFormField` com `id` único; não adicionar segundo campo de texto para `#RRGGBB`.
3. Após mudanças no backend de categorias, garantir migração + tipo TS + `map*` no service com fallback `#64748b` quando aplicável.

## Checklist — ícones Editar / Excluir

1. `import { typeMgmtEditIconBtn, typeMgmtDeleteIconBtn } from './ui/typeManagementStyles'` (ajustar path relativo ao ficheiro).
2. `<button type="button" className={typeMgmtEditIconBtn} aria-label="..."><EditIcon /></button>` e análogo para delete.
3. Não reintroduzir classes locais `text-slate-400`, `hover:bg-slate-200` só para estes pares salvo excepção documentada (ex.: cartão com fundo especial — pode compor com ` ${typeMgmtEditIconBtn} bg-white/80 ...`).

## Checklist — coluna Ações (tabelas densas)

1. Cabeçalho: `text-right`, `whitespace-nowrap`, `min-w-[10rem]` ou valor que caiba todos os ícones sem wrap.
2. Célula: `align-middle whitespace-nowrap text-right`.
3. Grupo de ícones: `inline-flex flex-row flex-nowrap items-center justify-end gap-0.5`.

## Checklist — UserManagement (ações de conta)

1. Editar: `typeMgmtEditIconBtn` + `EditIcon` com `h-5 w-5` se necessário.
2. Reenviar primeiro acesso / reset senha: `LockClosedIcon`; estados de loading com `aria-busy`, `disabled={!!mailBusy}`, tooltip “Enviando…” quando aplicável.
3. Inativar: `NoSymbolIcon`, não só texto vermelho.
4. Atualizar lista: botão com `RefreshIcon`; evitar animação de spinner infinito no ícone; opcional `active:scale-95` no botão.

## Checklist — acessibilidade

- Todo botão só com ícone: `aria-label` + idealmente `title` coerente (tooltip).

## Ficheiros de referência no repo

| Conceito | Caminho |
|----------|---------|
| Swatch | `frontend/components/ui/TypeColorSwatch.tsx` |
| Campo cor formulário | `frontend/components/ui/TypeColorFormField.tsx` |
| Classes edit/delete | `frontend/components/ui/typeManagementStyles.ts` |
| Ícones partilhados | `frontend/components/Icons.tsx` |

## Anti-padrões (evitar)

- Hex visível num formulário e só círculo noutro — **um só padrão**: `TypeColorFormField`.
- Listas de tipos só com nome, sem swatch, quando o modelo tem cor.
- `flex-wrap` na coluna de ações quando o desenho pede uma linha única de ícones.
- Substituir `RefreshIcon` por ícone de “recorrência” ou traço que possa ler-se como outro objeto.
