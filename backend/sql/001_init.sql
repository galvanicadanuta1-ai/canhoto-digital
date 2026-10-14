CREATE TABLE IF NOT EXISTS recebimentos (
  id UUID PRIMARY KEY,
  data_recebimento DATE NOT NULL,
  cliente TEXT NOT NULL,
  nota_fiscal TEXT,
  op_cliente TEXT,
  cromato TEXT NOT NULL,
  linha_banho TEXT NOT NULL,
  quantidade NUMERIC NOT NULL,
  volumes NUMERIC NOT NULL,
  kgs NUMERIC(14,3) NOT NULL,
  lote_aprovado TEXT NOT NULL CHECK (lote_aprovado IN ('OK','NOK')),
  motivo_reprovacao TEXT,
  foto_path TEXT,
  google_sync_status TEXT NOT NULL DEFAULT 'PENDENTE',
  google_sync_erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recebimento_ordens (
  recebimento_id UUID NOT NULL REFERENCES recebimentos(id) ON DELETE CASCADE,
  os TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (recebimento_id, os)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_recebimento_os_unica
  ON recebimento_ordens(os);

CREATE INDEX IF NOT EXISTS ix_recebimentos_data
  ON recebimentos(data_recebimento);

CREATE INDEX IF NOT EXISTS ix_recebimentos_cliente
  ON recebimentos(cliente);

CREATE INDEX IF NOT EXISTS ix_recebimentos_google_sync
  ON recebimentos(google_sync_status);
