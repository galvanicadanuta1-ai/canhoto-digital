/* Danuta: validação de qualidade nas saídas — módulo isolado.
   NOK interrompe a saída e obriga registro de retrabalho confirmado.
   Nenhuma saída NOK é enviada ao Apps Script. */
(function () {
  "use strict";
  const CHAVE = "danuta_nok_saida_contexto_v1";
  let status = "";
  let houveNok = false;
  let origem = "";
  let obterOS = () => [];
  let obterNF = () => [];

  function pintar() {
    const ok = document.getElementById("qualidadeSaidaOK");
    const nok = document.getElementById("qualidadeSaidaNOK");
    const aviso = document.getElementById("qualidadeSaidaAviso");
    if (!ok || !nok || !aviso) return;
    ok.style.background = status === "OK" ? "#16a34a" : "#fff";
    ok.style.color = status === "OK" ? "#fff" : "#16a34a";
    nok.style.background = status === "NOK" ? "#dc2626" : "#fff";
    nok.style.color = status === "NOK" ? "#fff" : "#dc2626";
    aviso.style.display = status === "NOK" ? "block" : "none";
  }

  function iniciar(opcoes) {
    origem = opcoes.origem;
    obterOS = opcoes.obterOS;
    obterNF = opcoes.obterNF || (() => []);
    // Não reaproveitar status de outra operação ou de outra saída.
    status = "";
    houveNok = false;
    if (new URLSearchParams(window.location.search).get("retornoNok") === "1") {
      try {
        const contexto = JSON.parse(sessionStorage.getItem(CHAVE) || "null");
        const tempo = contexto ? Date.parse(contexto.criadoEm) : NaN;
        if (contexto && contexto.origem === origem && Array.isArray(contexto.ordens) &&
            Number.isFinite(tempo) && Date.now() - tempo < 7200000) {
          opcoes.restaurar && opcoes.restaurar(contexto);
          status = "NOK";
          houveNok = true;
        }
      } catch (_) {
        // Falha de recuperação não autoriza saída.
        status = "NOK";
        houveNok = true;
      }
    }
    pintar();
  }

  function selecionar(opcao) {
    if (opcao === "OK" && houveNok) {
      alert("⚠️ Esta operação já foi marcada NOK e deve ser encaminhada ao Retrabalho. Para corrigir uma seleção por engano, reinicie o formulário.");
      return;
    }
    if (opcao !== "OK" && opcao !== "NOK") return;
    status = opcao;
    if (opcao === "NOK") houveNok = true;
    pintar();
  }

  function naoRegistrar() {
    const aviso = document.getElementById("qualidadeSaidaAviso");
    if (aviso) aviso.style.display = "none";
    alert("⚠️ Material NOK: a saída não pode ser concluída. Para registrar o retrabalho, selecione NOK novamente.");
  }

  function encaminharRetrabalho() {
    if (status !== "NOK") return;
    const ordens = obterOS().map(v => String(v).trim()).filter(Boolean);
    if (!ordens.length) {
      alert("⚠️ Informe a(s) OS antes de encaminhar ao Registro de Retrabalho.");
      return;
    }
    // Mantém apenas dados necessários ao registro; nenhuma foto/assinatura de saída é transmitida.
    const contexto = {
      origem,
      ordens,
      notas: obterNF().map(v => String(v).trim()).filter(Boolean),
      criadoEm: new Date().toISOString()
    };
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(contexto));
    } catch (e) {
      alert("❌ Não foi possível preservar os dados para o retrabalho. A saída permanece bloqueada.");
      return;
    }
    window.location.href = "menu-qualidade.html?origemSaidaNok=" + encodeURIComponent(origem);
  }

  function validar() {
    if (status !== "OK" || houveNok) {
      alert(status === "NOK" || houveNok
        ? "⚠️ Material NOK: não é permitido registrar saída. Conclua o Registro de Retrabalho."
        : "⚠️ Selecione Qualidade Status: OK ou NOK antes de salvar.");
      if (status === "NOK") pintar();
      return false;
    }
    return true;
  }

  window.DanutaQualidadeSaida = { iniciar, selecionar, naoRegistrar, encaminharRetrabalho, validar, status: () => status, CHAVE };
})();
