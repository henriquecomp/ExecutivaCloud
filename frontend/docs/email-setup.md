# E-mail: Web3Forms (relatórios na interface) e Brevo (transacional no backend)

## Web3Forms — relatórios “Reportar problema” (já implementado no frontend)

Usado na **tela de login** e no **cabeçalho quando logado**. O browser envia um `POST` para a API do Web3Forms; eles encaminham o conteúdo para a **caixa de e-mail associada à tua Access Key** (no painel do Web3Forms).

### O que fazer

1. Criar conta / obter chave em [https://web3forms.com](https://web3forms.com).
2. No painel, confirma o e-mail de destino onde queres receber os relatórios.
3. No projeto, cria ou edita `frontend/.env`:
   ```env
   VITE_WEB3FORMS_ACCESS_KEY=cole_sua_access_key_aqui
   ```
4. Reinicia o Vite (`npm run dev` ou o comando que usares). Variáveis `VITE_*` só entram após reinício.

### O que **não** é

- Não é SMTP nem envio a partir do FastAPI.
- Não serve como substituto seguro de **reset de senha** ou outros e-mails transacionais gerados no servidor (para isso usa Brevo ou outro serviço no backend).

---

## Brevo — envio transacional (API / SMTP) para o **backend**

O Brevo envia e-mail **a partir do teu servidor** (por exemplo **reset de senha**, convites, notificações). O fluxo típico: o **FastAPI** gera o token, monta a mensagem e chama a **API REST do Brevo** ou **SMTP do Brevo**.

### 1. Conta e remetente

1. Conta em [https://www.brevo.com](https://www.brevo.com).
2. **Remetente**: em *Senders, domains & dedicated IPs* (ou equivalente), adiciona e confirma:
   - um **endereço** (ex.: `noreply@teudominio.com`), e/ou
   - autentica o **domínio** (recomendado em produção: SPF, DKIM que o Brevo indica).
3. Sem remetente verificado, o Brevo pode recusar ou cair em spam.

### 2. Chave de API (recomendado para app Python)

1. *SMTP & API* → *API keys* (ou *API*).
2. Cria uma chave com permissão de **envio transacional** (ou escopo que a documentação atual do Brevo descrever).
3. Guarda a chave em **variável de ambiente no servidor** (nunca no frontend), por exemplo:
   ```env
   BREVO_API_KEY=xkeysib-...
   BREVO_SENDER_EMAIL=noreply@teudominio.com
   BREVO_SENDER_NAME=Executiva Cloud
   ```

4. No código Python, usas a **API REST** (ex.: `POST /v3/smtp/email` com o header `api-key`) ou a **SDK oficial** do Brevo, se existir para a tua versão.

### 3. Alternativa SMTP

- Em *SMTP & API* → *SMTP* obténs **servidor, porta, utilizador, password** (específicos Brevo).
- No FastAPI podes usar `smtplib` ou uma biblioteca de e-mail — o remetente ainda tem de ser um endereço/domínio **autorizado** no Brevo.

### 4. Produção e segurança

- **Nunca** expor `BREVO_API_KEY` no repositório ou no bundle do Vite.
- **Rate limits** e **reputação** de domínio: segue as boas práticas do Brevo (evitar rebotes, manter listas limpas).
- **Reset de senha**: o link deve ser **gerado e validado no backend**; o e-mail só transporta o link, não a lógica de segurança.

### 5. Estado do projeto Executiva Cloud

- Os relatórios na UI usam **Web3Forms** (`VITE_WEB3FORMS_ACCESS_KEY`).
- A integração **Brevo no backend** (variáveis acima + chamada HTTP desde o FastAPI) é o caminho certo quando implementares reset de senha ou outros e-mails transacionais — ainda não faz parte do código base até ser adicionada ao serviço Python.
