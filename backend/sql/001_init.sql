-- SOMENTE no banco novo danuta_v2. NUNCA no ERP.
CREATE TABLE IF NOT EXISTS recebimentos (
 id UUID PRIMARY KEY, data_recebimento DATE NOT NULL, cliente TEXT NOT NULL,
 nota_fiscal TEXT, op_cliente TEXT, cromato TEXT NOT NULL, linha_banho TEXT NOT NULL,
 quantidade NUMERIC NOT NULL CHECK(quantidade>0), volumes NUMERIC NOT NULL CHECK(volumes>0),
 kgs NUMERIC(14,3) NOT NULL CHECK(kgs>0),
 lote_aprovado TEXT NOT NULL CHECK(lote_aprovado IN ('OK','NOK')),
 motivo_reprovacao TEXT, foto_base64 TEXT NOT NULL,
 google_status TEXT NOT NULL DEFAULT 'PENDENTE', google_erro TEXT,
 whatsapp_status TEXT NOT NULL DEFAULT 'NAO_APLICAVEL',
 criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS recebimento_ordens (
 recebimento_id UUID NOT NULL REFERENCES recebimentos(id) ON DELETE CASCADE,
 os TEXT NOT NULL UNIQUE, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(recebimento_id,os)
);
CREATE INDEX IF NOT EXISTS ix_rec_data ON recebimentos(data_recebimento);
CREATE INDEX IF NOT EXISTS ix_rec_cliente ON recebimentos(cliente);
CREATE INDEX IF NOT EXISTS ix_rec_google ON recebimentos(google_status);
