## ADDED Requirements

### Requirement: Cores do e-mail alinhadas ao menu
O sistema DEVE renderizar o HTML do e-mail de convite com a paleta slate escura do menu lateral (preto/cinza), e NÃO DEVE usar indigo/azul como cor principal de cabeçalho ou CTA.

#### Scenario: Cabeçalho e CTA no tom do menu
- **WHEN** o destinatário abre o e-mail de convite em HTML
- **THEN** o cabeçalho e o botão de ação usam tons slate escuros equivalentes ao menu (`slate-800` / `slate-900`)
- **THEN** o texto sobre esses fundos permanece claro e legível

#### Scenario: Sem indigo como cor de marca no HTML
- **WHEN** o template HTML do convite é gerado
- **THEN** não há uso de indigo (`#4f46e5` ou equivalente) no cabeçalho nem no botão CTA
