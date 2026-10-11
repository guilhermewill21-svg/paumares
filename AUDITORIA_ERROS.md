# AUDITORIA DE ERROS E CORREÇÕES DO PROJETO TCC - REDECANAIS SUITE

Este arquivo é um registro permanente, acumulativo e append-only de todas as auditorias, diagnósticos, correções e validações realizadas no projeto.

---

## Registro: AUD-001

- Data/Hora: 2025-02-15 12:00:00 UTC
- Arquivo: redecanais-suite.user.js
- Linha/Bloco/Função/Classe: validateStreamUrl() / Linhas 243-247
- Tipo de erro: Lógica / Fluxo de execução
- Descrição: A função validateStreamUrl retornava precocemente se os elementos HTML do painel (#rc-stream-url e #rc-stream-status) ainda não tivessem sido injetados no DOM, impedindo o salvamento da URL capturada em RCSuite.capturedStreamUrl quando as requisições ocorriam no document-start.
- Evidência: Requisições de mídia/m3u8 disparadas durante o carregamento inicial da página eram ignoradas e a URL não era exibida após a criação da UI.
- Causa provável: Verificação condicional antecipada `if (!urlEl || !statusEl) return;` colocada antes da atribuição `RCSuite.capturedStreamUrl = url;`.
- Solução aplicada: Alterada a ordem das instruções em validateStreamUrl para atribuir a URL capturada a RCSuite.capturedStreamUrl em qualquer momento e, no momento da renderização da interface (buildUI), verificar e re-validar a URL previamente armazenada.
- Arquivos alterados: redecanais-suite.user.js
- Validação executada: Teste de integração via node test/verify_script.js simulando chamada fetch antes do buildUI.
- Resultado: Sucesso. URL capturada corretamente armazenada e exibida no painel.
- Status: Corrigido
- Observações: Garante o correto funcionamento com o script rodando em document-start.
- Relação com registros anteriores: Nenhum (primeiro registro).

---

## Registro: AUD-002

- Data/Hora: 2025-02-15 12:05:00 UTC
- Arquivo: redecanais-suite.user.js
- Linha/Bloco/Função/Classe: enablePopupBlocking() / Linhas 206-210
- Tipo de erro: Compatibilidade / Tratamento de erros
- Descrição: Sobrescrita de window.open retornava `null`, o que gerava exceções do tipo TypeError (Cannot read properties of null) em scripts da página hospedeira que tentavam invocar métodos como `.focus()`, `.blur()`, `.close()` ou acessar `.closed`.
- Evidência: Exceções em console em players que mantêm referência da janela aberta via window.open.
- Causa provável: Retorno simplificado `return null;` no mock de window.open.
- Solução aplicada: Modificado o mock de window.open para retornar um objeto 'dummy' seguro contendo métodos no-op (`focus`, `blur`, `close`, `postMessage`) e propriedade `closed: true`.
- Arquivos alterados: redecanais-suite.user.js
- Validação executada: Teste automatizado em node test/verify_script.js invocando win.open() e executando métodos do objeto retornado.
- Resultado: Sucesso. Nenhuma exceção lançada ao interagir com o objeto retornado.
- Status: Corrigido
- Observações: Melhora significativamente a resiliência contra detecção de bloqueadores.
- Relação com registros anteriores: Nenhum.

---

## Registro: AUD-003

- Data/Hora: 2025-02-15 12:10:00 UTC
- Arquivo: redecanais-suite.user.js
- Linha/Bloco/Função/Classe: window.fetch / window.XMLHttpRequest.prototype.open / isStreamUrl()
- Tipo de erro: Tipo / Incompatibilidade de argumentos
- Descrição: O interceptador do fetch assumia que o primeiro argumento seria sempre uma string ou um objeto Request com a propriedade `.url`. Caso um objeto `URL` fosse passado (`new URL(...)`), `args[0].url` resultava em `undefined`, falhando a captura. Além disso, `isStreamUrl` retornava false se o argumento não fosse estritamente uma string.
- Evidência: Requisições efetuadas via instâncias da API standard `URL` não eram detectadas ou validadas.
- Causa provável: Ausência de coerção e verificação de tipo para instâncias de `URL` e outros objetos conversíveis para string.
- Solução aplicada: Atualizado o extrator de URL no interceptador fetch e na função `isStreamUrl` para tratar com segurança `string`, `URL` e `Request`, convertendo adequadamente o parâmetro.
- Arquivos alterados: redecanais-suite.user.js
- Validação executada: Teste automatizado simulando chamadas de `fetch(new URL(...))` em node test/verify_script.js.
- Resultado: Sucesso. Streams iniciados com instâncias de `URL` foram devidamente capturados.
- Status: Corrigido
- Observações: Compatível com modernas APIs de fetch do navegador.
- Relação com registros anteriores: Complementa AUD-001.

---

## Registro: AUD-004

- Data/Hora: 2025-02-15 12:15:00 UTC
- Arquivo: redecanais-suite.user.js
- Linha/Bloco/Função/Classe: setupSearch() e renderRecentChannels()
- Tipo de erro: Segurança / Sanitização de Entrada / Quebra de Layout
- Descrição: Interpolação direta de nomes de canais contendo aspas, caracteres especiais ou tags HTML em templates strings de innerHTML e atributos HTML (`data-name="${c.name}"`), podendo corromper o DOM e permitir XSS.
- Evidência: Canais com aspas duplas no título quebravam a sintaxe do atributo `data-name`.
- Causa provável: Ausência de funções utilitárias para sanitização/escape de HTML.
- Solução aplicada: Implementadas as funções utilitárias `escapeHtml` e `escapeAttr` e aplicadas em todas as concatenações e interpolações do painel.
- Arquivos alterados: redecanais-suite.user.js
- Validação executada: Teste automatizado em node test/verify_script.js injetando canal com caracteres especiais `<script>`, aspas e e comercial.
- Resultado: Sucesso. Atributos e nós de texto renderizados com segurança.
- Status: Corrigido
- Observações: Previne vulnerabilidades de DOM XSS no userscript.
- Relação com registros anteriores: Nenhum.

---

## Registro: AUD-005

- Data/Hora: 2025-02-15 12:20:00 UTC
- Arquivo: redecanais-suite.user.js
- Linha/Bloco/Função/Classe: scrapePageChannels()
- Tipo de erro: Lógica / Manipulação de DOM
- Descrição: A busca de canais via `querySelectorAll` incluía seletores como `.canal-item` e `.thumb` que podem apontar para contêineres `<div>` ou elementos `<img>` em vez de tags `<a>`, resultando em elementos com `href` indefinido (`undefined`).
- Evidência: Objetos na lista `allChannels` contendo `url: undefined`.
- Causa provável: Suposição de que todos os elementos correspondentes aos seletores possuíam a propriedade `.href`.
- Solução aplicada: Refatorada a rotina de scraping para verificar `.href`, buscar elementos `<a>` filhos, checar `data-url` e extrair títulos a partir de `title`, `alt` ou texto interno de tags filhas.
- Arquivos alterados: redecanais-suite.user.js
- Validação executada: Teste de scraping em node test/verify_script.js contendo estrutura DOM com `.thumb` englobando links e imagens.
- Resultado: Sucesso. Links e títulos extraídos corretamente.
- Status: Corrigido
- Observações: Maior resiliência na raspagem de novos temas e layouts do RedeCanais.
- Relação com registros anteriores: Nenhum.

---

## Registro: AUD-006

- Data/Hora: 2025-02-15 12:25:00 UTC
- Arquivo: package.json
- Linha/Bloco/Função/Classe: package.json
- Tipo de erro: Configuração
- Descrição: O arquivo `package.json` definia a dependência `jsdom`, porém não possuía a chave `"scripts"` configurada com o comando de testes automatizados (`"test": "node test/verify_script.js"`).
- Evidência: O comando `npm test` falhava com mensagem de script ausente.
- Causa provável: Arquivo package.json incompleto.
- Solução aplicada: Adicionada a seção `"scripts": { "test": "node test/verify_script.js" }` no package.json.
- Arquivos alterados: package.json
- Validação executada: Execução de `npm test` no terminal.
- Resultado: Sucesso. Testes executados e finalizados com código 0.
- Status: Corrigido
- Observações: Permite integração contínua e execução facilitada para desenvolvedores.
- Relação com registros anteriores: Nenhum.

---

## Registro: AUD-007

- Data/Hora: 2025-02-15 12:30:00 UTC
- Arquivo: test/verify_script.js
- Linha/Bloco/Função/Classe: Testes de integração
- Tipo de erro: Cobertura de Testes
- Descrição: O script de testes `test/verify_script.js` cobria apenas o fluxo básico inicial e não testava cenários de borda como captura antes do buildUI, tratamento de objetos `URL`, métodos do mock de window.open, escape de caracteres especiais ou salvamento de configurações.
- Evidência: Ausência de asserções para regressões recém-identificadas.
- Causa provável: Suíte de testes simplificada.
- Solução aplicada: Expandido o script de testes para cobrir minuciosamente todas as novas funcionalidades, exceções e bordas de código.
- Arquivos alterados: test/verify_script.js
- Validação executada: Execução de `node test/verify_script.js`.
- Resultado: Sucesso. Todos os testes de integração passaram sem falhas.
- Status: Corrigido
- Observações: Suíte de testes robusta para garantir qualidade contínua.
- Relação com registros anteriores: Relação com AUD-001 até AUD-006.

---

## Registro: AUD-008

- Data/Hora: 2025-02-15 12:35:00 UTC
- Arquivo: redecanais-suite.user.js
- Linha/Bloco/Função/Classe: setPlaybackSpeed()
- Tipo de erro: Validação de Entrada
- Descrição: Falta de validação defensiva caso o valor repassado a `setPlaybackSpeed` não fosse um número válido (ex: `NaN` ou `undefined`), o que corrompia `v.playbackRate`.
- Evidência: Chamadas acidentais com parâmetro inválido deixavam o player com velocidade `NaN`.
- Causa provável: Chamada a `parseFloat` sem checagem de `isNaN`.
- Solução aplicada: Adicionada validação de segurança `if (isNaN(speed)) speed = 1.0;` e arredondamento defensivo.
- Arquivos alterados: redecanais-suite.user.js
- Validação executada: Invocação de `setPlaybackSpeed(NaN)` no teste automatizado.
- Resultado: Sucesso. Velocidade redefinida de forma segura para 1.0x.
- Status: Corrigido
- Observações: Garante estabilidade do controle de reprodução.
- Relação com registros anteriores: Nenhum.
