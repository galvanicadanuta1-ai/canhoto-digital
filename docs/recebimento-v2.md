# Recebimento V2 — Mapeamento e plano de migração

## Objetivo
Criar uma nova versão do módulo de Recebimento sem alterar a produção atual (`main`), permitindo salvamento local rápido, operação offline e sincronização posterior com servidor próprio e Google Sheets.

## Produção atual
Arquivo principal: `menu-recebimento.html`

Endpoint atual:
`https://script.google.com/macros/s/AKfycbxw42iHfUghqkeunSGbU5syHFXJGsTHHvNT5GXm56jXOV-UPdlnebvxjxPvsIsbwcccxA/exec`

O navegador aguarda a resposta do Google Apps Script para concluir o salvamento.

## Campos do Recebimento atual

- Data de Recebimento (`data`)
- Ordens de Serviço (`ordens`) — uma ou mais OS
- Nome do Cliente (`cliente`)
- Nota Fiscal (`notaFiscal`) — opcional
- OP do Cliente (`opCliente`) — opcional
- Cromato (`cromato`)
- Linha de Banho (`linhaBanho`)
- Quantidade de Peças (`quantidade`)
- Volumes (`volumes`)
- Peso em kg (`kgs`)
- Lote Aprovado (`loteAprovado`) — OK/NOK
- Motivo da Reprovação (`motivoReprovacao`) — obrigatório quando NOK
- Fotografia (`foto`) — Base64, obrigatória em novo recebimento

Campos auxiliares de edição:
- `linhaPlanilhaEdicao`
- modo `INSERIR` / `EDITAR`

## Operações que dependem do Apps Script atual

### Inserção
`tipo: RECEBIMENTO`

### Edição
`tipo: EDITAR_RECEBIMENTO`

### Busca de OS
`tipo: BUSCAR_OS`

### Histórico de OS
`tipo: HISTORICO_OS`

### Lista de clientes
`tipo: LISTAR_CLIENTES`

## Regras importantes já existentes

- Não permite recebimento sem ao menos uma OS.
- Bloqueia OS duplicada conforme resposta do backend (`OS_DUPLICADA`).
- Nome do cliente é obrigatório.
- NF e OP do cliente aceitam somente números quando preenchidas.
- Cromato é obrigatório; opção "Outro" exige descrição.
- Linha de banho é obrigatória.
- Quantidade, volumes e peso são obrigatórios.
- Lote deve ser marcado como OK ou NOK.
- NOK exige motivo.
- Novo recebimento exige fotografia.
- Fotografias são reduzidas para no máximo 1280 px e JPEG qualidade 0,72 antes do envio.
- Cliente "Capo Acessórios" possui fluxo especial para envio de fotografia via WhatsApp.

## Gargalo atual

No clique em SALVAR, o navegador:
1. valida todo o formulário;
2. monta o JSON;
3. inclui a fotografia Base64;
4. envia ao Google Apps Script;
5. espera o Apps Script gravar/processar;
6. espera a resposta JSON;
7. somente então informa sucesso e libera o operador.

Assim, a operação fica diretamente dependente da internet e do tempo de processamento do Apps Script.

## Arquitetura V2

Fluxo de gravação operacional:

`Tela Recebimento -> IndexedDB local -> confirmação imediata ao operador`

Fluxo de sincronização:

`IndexedDB -> fila de sincronização -> API servidor Danuta -> banco de dados`

Espelho para faturamento:

`Banco servidor -> sincronizador Google -> planilha atual -> aba Recebimento`

A planilha de Recebimento permanece disponível ao faturamento no formato atual. A operação industrial deixa de depender dela para concluir cada lançamento.

## Estados de sincronização

Cada registro V2 deverá possuir:

- `id`: UUID gerado no dispositivo
- `modulo`: `RECEBIMENTO`
- `status`: `PENDENTE`, `ENVIANDO`, `SINCRONIZADO` ou `ERRO`
- `criadoEm`
- `atualizadoEm`
- `tentativas`
- `ultimoErro`
- `sincronizadoEm`
- `payload`

## Estratégia contra duplicidade

O `id` gerado no dispositivo será enviado ao servidor como chave idempotente.
Se o mesmo registro for reenviado após queda de conexão, o servidor deverá reconhecer o mesmo `id` e não criar uma segunda entrada.

A regra atual de OS duplicada também será preservada no servidor.

## Etapas

1. Criar motor local IndexedDB e fila comum.
2. Criar Recebimento V2 separado da produção.
3. Fazer salvamento local instantâneo.
4. Criar painel/status de pendências.
5. Criar API do servidor interno.
6. Criar banco de dados.
7. Sincronizar banco -> Google Sheets, preservando a aba Recebimento.
8. Testar lado a lado com produção.
9. Validar com faturamento.
10. Liberar gradualmente aos operadores.

## Regra de segurança da migração

A branch `main` é produção e não deve ser alterada durante o desenvolvimento da V2.
Todo desenvolvimento desta migração ocorre na branch `v2-offline-servidor` até homologação.