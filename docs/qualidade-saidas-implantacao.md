# Qualidade obrigatória nas saídas — implementação isolada

**Status:** recursos desenvolvidos em branch separada, ainda não ativados na produção.
**Não publicar HTML isoladamente**: o Apps Script precisa ser atualizado em conjunto para registrar as novas colunas.

## Fluxo
- Saída OS: 1 OS, 2 Qualidade, 3 Fotografia, 4 Expedidor, 5 Recebedor.
- Saída NFe: 1 NF, 2 Qualidade, 3 OS, 4 Fotografia, 5 Expedição, 6 Recebedor, 7 Assinatura.
- OK: mantém fluxo e campos anteriores, envia `qualidadeStatus: "OK"`.
- NOK: pergunta "Material não conforme, deseja fazer Registro de retrabalho?". 
- Não: fecha aviso, bloqueia saída, e seleção NOK reabre aviso.
- Sim: exige OS, guarda OS e NF temporariamente em sessionStorage e abre diretamente `menu-qualidade.html` em Registro de Retrabalho.
- Se operador volta sem salvar, OS/NFs podem ser recuperadas, com saída ainda NOK/bloqueada.
- Se o Google Apps Script responder `sucesso:true` ao registro do Retrabalho, o sistema encerra o processo de saída e redireciona para o menu de Expedição. O material retorna à produção.
- Saída NOK nunca deve gerar lançamento em Saídas OS/Dados.
- Um novo registro de saída é necessário depois de o material ficar conforme.

## Planilha
- Saídas OS: H Qualidade Status, I Registro de Retrabalho, J Referência do Retrabalho.
- Dados: J Qualidade Status, K Registro de Retrabalho, L Referência do Retrabalho.
- Saídas efetivadas OK: OK, NAO_APLICAVEL, vazio.
- Retrabalho NOK: informação fica na aba Retrabalho com a(s) OS. Não cria linha de expedição.
- Cabeçalhos já foram preparados na planilha, sem alterar linhas antigas.

## GS
- Código GS completo atualizado foi gerado separadamente a partir do código fornecido no chat.
- **Não foi publicado**: o projeto Apps Script não tem conexão de edição/publicação disponível nesta conversa.
- Código em produção deve ser comparado com o arquivo preparado antes de substituir: pode haver alterações recentes.
- Compatibilidade com clientes antigos: o GS preparado registra `NAO_INFORMADO` quando o status de qualidade não vem no payload, evitando bloquear dispositivos com cache antigo; não confundir com aprovação OK.
- Para obrigatoriedade absoluta, eliminar o fallback após atualização de todos dispositivos e aprovação de implantação.

## Homologação obrigatória
1. OK grava status nas colunas novas em ambos os módulos.
2. NOK não cria Saída, e Sim abre Retrabalho com OS.
3. Não bloqueia salvar, nova tentativa apresenta aviso.
4. Apps Script sem resposta confirmada não encerra saída.
5. Retrabalho confirmado encerra saída, sem rascunho pendente.
6. Falha de rede não cria duplicidade: verificar a planilha antes de reenviar.
7. Multi-OS/multi-NF preserva os registros existentes e o fluxo de fotos/assinaturas.
8. Realizar publicação coordenada do GS e do HTML e monitorar primeiras operações.

**Atenção:** o recebimento da resposta HTTP sem erro não garante sucesso do Apps Script. A confirmação do Retrabalho verifica JSON `sucesso: true`.
