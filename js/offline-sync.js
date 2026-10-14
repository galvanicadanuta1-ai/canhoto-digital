(function () {
  const DB_NAME = 'danuta-v2';
  const DB_VERSION = 1;
  const STORE = 'fila_sincronizacao';

  function abrirBanco() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('modulo', 'modulo', { unique: false });
          store.createIndex('criadoEm', 'criadoEm', { unique: false });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function uuid() {
    if (crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async function adicionar(modulo, payload) {
    const db = await abrirBanco();
    const agora = new Date().toISOString();
    const registro = {
      id: uuid(),
      modulo,
      status: 'PENDENTE',
      criadoEm: agora,
      atualizadoEm: agora,
      tentativas: 0,
      ultimoErro: '',
      sincronizadoEm: '',
      payload
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add(registro);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    return registro;
  }

  async function listar(status) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = status ? store.index('status').getAll(status) : store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function atualizar(id, alteracoes) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const atual = getReq.result;
        if (!atual) {
          reject(new Error('Registro local não encontrado.'));
          return;
        }
        const novo = {
          ...atual,
          ...alteracoes,
          atualizadoEm: new Date().toISOString()
        };
        store.put(novo);
      };

      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function contarPendentes() {
    const pendentes = await listar('PENDENTE');
    const erros = await listar('ERRO');
    return pendentes.length + erros.length;
  }

  async function sincronizarUma(registro, endpoint) {
    await atualizar(registro.id, {
      status: 'ENVIANDO',
      tentativas: (registro.tentativas || 0) + 1,
      ultimoErro: ''
    });

    try {
      const resposta = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: registro.id,
          modulo: registro.modulo,
          ...registro.payload
        })
      });

      if (!resposta.ok) {
        throw new Error('HTTP ' + resposta.status);
      }

      const dados = await resposta.json().catch(() => ({}));
      if (dados && dados.sucesso === false) {
        throw new Error(dados.msg || 'Servidor recusou o registro.');
      }

      await atualizar(registro.id, {
        status: 'SINCRONIZADO',
        sincronizadoEm: new Date().toISOString(),
        ultimoErro: ''
      });

      return { sucesso: true, id: registro.id };
    } catch (erro) {
      await atualizar(registro.id, {
        status: 'ERRO',
        ultimoErro: erro && erro.message ? erro.message : String(erro)
      });
      return { sucesso: false, id: registro.id, erro };
    }
  }

  async function sincronizarPendentes(endpoint) {
    const registros = [
      ...(await listar('PENDENTE')),
      ...(await listar('ERRO'))
    ];

    const resultados = [];
    for (const registro of registros) {
      resultados.push(await sincronizarUma(registro, endpoint));
    }
    return resultados;
  }

  window.DanutaOffline = {
    adicionar,
    listar,
    atualizar,
    contarPendentes,
    sincronizarPendentes
  };
})();
