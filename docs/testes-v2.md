# Testes controlados DanutaV2
Não utilizar dados reais. Não modificar ERP ou planilha de faturamento.

## Já observado no computador 192.168.0.11
- SMB no endereço 192.168.0.241; Z: mapeado ao compartilhamento E:.
- Leitura/gravação do arquivo de teste em Z:\DanutaV2 funcionando.
- HTML Recebimento V2 foi aberto no navegador e gerou um ID via IndexedDB.
- Isso NÃO comprova persistência de recebimentos no servidor nem sincronização entre computadores.

## Ainda por validar
1. Banco dedicado `danuta_v2` ativo na máquina aprovada pela TI.
2. API responde /api/v2/health e somente grava no banco V2.
3. POST de dados fictícios, resposta 201 e consulta SQL.
4. Reenvio com mesmo UUID não duplica.
5. Mesma OS com UUID distinto devolve 409.
6. NOK sem motivo é recusado.
7. Falta de foto/data/cromato/linha é recusada.
8. Sem rede, operação local continua; reconexão sincroniza uma vez.
9. API não exposta externamente sem autenticação/HTTPS.
10. Envio para faturamento e WhatsApp ficam DESATIVADOS.

## Atenção à origem local do navegador
O protótipo aberto por `file://` armazena dados no IndexedDB local ao navegador/origem. Mover, renomear, mudar o navegador ou abrir por outra URL pode alterar a origem de armazenamento e esconder registros antes salvos. Não limpar dados do navegador. Para uso operacional, publicar em HTTPS com origem fixa e plano de migração local.
