# DanutaV2 — entrega para TI (ambiente separado)
**Estado:** preparação, NÃO implantar em produção sem aprovação escrita.

## Restrições inegociáveis
- Não modificar, apagar, reinstalar, configurar, reiniciar ou utilizar serviços, arquivos, diretórios e bancos existentes no SERVIDOR, Microsis, ponto, CiaERP, planilhas de faturamento e sistemas Danuta atuais.
- Não fazer merge em `main`. Trabalhar só na branch `v2-offline-servidor`.
- `E:\DanutaV2` é apenas uma pasta de arquivos compartilhados já criada, não prova capacidade de executar serviços remotamente.
- Descobrir com a TI se `192.168.0.241` é o host adequado e se a máquina de direção com W:/Y: está mapeando compartilhamentos; não assumir que W:/Y: sejam servidores.
- Não abrir portas à internet, não habilitar RDP/SMB externamente, não permitir CORS wildcard e não alterar firewall sem análise/consentimento da TI.
- Fazer backup do ambiente V2 e plano de reversão antes de homologar. V2 sempre isolada dos bancos e APIs da produção.
- Pasta exclusiva: `E:\DanutaV2` (do PC de operação: `Z:\DanutaV2`). A execução de software exige processo no host de implantação; copiar arquivos via SMB não inicia API.

## Entregáveis preparados
- `menu-recebimento-v2.html` protótipo de captura offline no navegador.
- `js/offline-sync.js` fila IndexedDB local.
- `backend/src/server.js` API Express de recebimentos; padrão `HOST=127.0.0.1`.
- `backend/sql/001_init.sql` schema NOVO, exclusivamente PostgreSQL `danuta_v2`.
- `backend/.env.example` exemplo de variáveis sem credenciais.
- Google Sheets e WhatsApp: ainda **NÃO integrados**. Não ativar envio real em homologação.

## Decisões exigidas da TI
1. Escolher host independente, VM ou servidor atual após medir RAM/CPU/disco/backup/carga e licenças.
2. Decidir diretório de dados, backup e contas de serviço *exclusivos* da V2.
3. Aprovar instalação do runtime Node.js 20+ e PostgreSQL 15+ isolados (sem usar instância do ERP).
4. Criar banco PostgreSQL novo `danuta_v2` e usuário de menor privilégio, exclusivo; guardar segredo fora do Git.
5. Aplicar `backend/sql/001_init.sql` **somente** dentro de `danuta_v2`.
6. Configurar HOST, PORT, DATABASE_URL, CORS_ORIGIN e TLS/reverse proxy conforme a política da TI.
7. Restringir a API a rede de testes. Acesso externo só com autenticação, HTTPS e aprovação formal. Não publicar API diretamente.
8. Não iniciar sincronização com Google Sheets/WhatsApp até serem homologadas credenciais, mapeamento de colunas, falhas e tentativas.

## Validação em ambiente isolado
- Executar `npm ci` quando existir lockfile validado; caso contrário, `npm install` somente dentro do diretório V2 e com aprovação da TI.
- Configurar `.env` local a partir de `.env.example`, com URL **exclusiva do banco danuta_v2**.
- `npm start` na máquina autorizada. `GET http://127.0.0.1:3000/api/v2/health` deve retornar `banco: online`.
- Criar recebimento fictício e confirmar status no banco V2, repetição idempotente de UUID e rejeição de OS duplicada.
- Testar bloqueio de dados inválidos; operação sem rede no navegador; reenvio após falha; foto, NOK, múltiplas OS.
- Comparar tabelas e colunas da planilha de faturamento para futura integração, **sem enviar dados reais ainda**.
- Verificar não interferência com os serviços atuais; validar logs e recuperação de backup.

## Pendências técnicas antes de produção
- Autenticação/autorização, HTTPS, trilha de auditoria, retenção de fotos e backups.
- Endurecimento de CORS, rate limits, proteção de acesso e monitoramento.
- Implementar sincronização Google Sheets com exatamente a estrutura da aba Recebimento.
- WhatsApp oficial somente com credenciais e acordo de uso.
- Homologar edição, histórico, buscas, Capo Acessórios e restantes módulos.
- Teste completo com operacionais e faturamento. Migração apenas após liberação.

**Ponto de contato:** responsável da empresa e TI. Não enviar senhas em chat ou repositório.
