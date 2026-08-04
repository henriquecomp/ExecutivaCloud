## Context

O menu (`Sidebar`) usa `bg-slate-800`, item ativo `bg-slate-900`, bordas `slate-700` e textos `slate-300`/`slate-400`. O HTML do convite em `email_service.py` ainda usa `#4f46e5` (indigo) no header e no botão.

## Goals / Non-Goals

**Goals:**

- Substituir indigo por tons slate do menu no cabeçalho, CTA e links do HTML.
- Preservar layout, copy e fallback text/plain.

**Non-Goals:**

- Alterar cores do e-mail de reset de senha ou report de problema.
- Mudar a sidebar ou o tema do frontend.

## Decisions

1. **Mapear Tailwind → hex do e-mail**  
   - Cabeçalho / CTA: `#1e293b` (`slate-800`)  
   - Hover visual do botão (borda/fundo levemente mais escuro): `#0f172a` (`slate-900`) onde fizer sentido  
   - Label “HMR” no header: `#cbd5e1` (`slate-300`)  
   - Links de fallback: `#334155` (`slate-700`) ou `#1e293b`  
   - Fundo da página do e-mail permanece `#f1f5f9` (`slate-100`); card branco.

2. **Só HTML**  
   O text/plain não tem cores; nenhuma mudança necessária nele.

## Risks / Trade-offs

- **[Risk]** CTA slate escuro pode parecer menos “botão” que indigo → **Mitigation** padding, peso tipográfico e contraste branco no texto do botão mantêm clareza.
