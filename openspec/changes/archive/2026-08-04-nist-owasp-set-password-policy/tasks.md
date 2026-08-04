## 1. Backend — política de senha

- [x] 1.1 Criar `backend/app/core/password_policy.py` com constantes (min 8, max 64), lista de senhas comuns e `validate_password()` com mensagens pt-BR
- [x] 1.2 Atualizar `CompleteInviteRequest` em `auth_schema.py` (`min_length=8`, `max_length=64`, validador delegando à política)
- [x] 1.3 Chamar `validate_password` em `invite_service.complete_invite` antes de persistir o hash
- [x] 1.4 Adicionar testes pytest para senha válida, curta, longa, comum e confirmação divergente

## 2. Frontend — utilitário e UI

- [x] 2.1 Criar `frontend/utils/passwordPolicy.ts` espelhando regras (validação, mensagem de erro, `getPasswordStrength`: fraca/média/forte)
- [x] 2.2 Atualizar `SetPasswordView.tsx`: validação no submit, `maxLength={64}`, bloqueio quando política inválida
- [x] 2.3 Adicionar ícone `?` com popup de ajuda (pt-BR) ao lado do rótulo “Nova senha” (`aria-label`, fechar com Esc/clique fora)
- [x] 2.4 Implementar barra animada de força da senha (cores fraca/média/forte, transição CSS, rótulo acessível)

## 3. Verificação

- [x] 3.1 Abrir link de convite (`flow=set-password`) e conferir ajuda, medidor e bloqueio de senha fraca/comum
- [x] 3.2 Confirmar que API retorna `detail` pt-BR coerente ao burlar validação do frontend
- [x] 3.3 Rodar `pytest` nos novos testes de política de senha
