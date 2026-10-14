# Danuta Sistema V2 — Backend

Este backend pertence exclusivamente à branch `v2-offline-servidor` e não altera a produção atual.

## Pré-requisitos do servidor

- Node.js 20+
- PostgreSQL 15+
- Acesso administrativo ao servidor
- Porta interna disponível (padrão sugerido: 3000)

## Instalação

1. Copiar a pasta `backend` para o servidor.
2. Executar `npm install`.
3. Criar o banco PostgreSQL `danuta_v2`.
4. Executar o script `sql/001_init.sql` no banco.
5. Copiar `.env.example` para `.env` e preencher `DATABASE_URL`.
6. Executar `npm start`.
7. Testar `GET /api/v2/health`.

## Endpoints iniciais

- `GET /api/v2/health`
- `POST /api/v2/recebimentos`
- `GET /api/v2/recebimentos/:id/status`
- `POST /api/v2/recebimentos/:id/whatsapp/confirmar`

## Regras já preparadas

- ID único por registro, permitindo reenvio idempotente.
- Bloqueio de OS duplicada.
- Recebimentos entram com sincronização Google como `PENDENTE`.
- Cliente `Capo Acessórios` entra com WhatsApp como `PENDENTE`.
- Demais clientes entram como `NAO_APLICAVEL` para WhatsApp.

## Google Sheets

A V2 manterá a aba `Recebimento` como espelho para o faturamento. O backend foi desenhado para registrar o estado de sincronização separadamente da gravação operacional.

A integração real com Google Sheets será adicionada sem alterar a produção atual e poderá ser realizada por:

- n8n self-hosted; ou
- serviço dedicado no próprio backend.

A decisão pode ser tomada após o acesso ao servidor.

## WhatsApp

A estrutura já separa o status de WhatsApp do status do recebimento. Assim, falha no WhatsApp nunca bloqueia a operação.

Para `Capo Acessórios`, o caminho inicial pode permanecer manual. Futuramente, com WhatsApp Business Platform, a automação poderá usar n8n ou um serviço do backend.

## Informações necessárias amanhã

- Sistema operacional do servidor.
- IP interno do servidor.
- Usuário com permissão administrativa.
- Se Node.js pode ser instalado.
- Se PostgreSQL já existe ou pode ser instalado.
- Porta interna permitida.
- Pasta/local de backup.
- Como os tablets acessam a rede interna.
