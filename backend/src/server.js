import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

app.use(cors({ origin: process.env.CORS_ORIGIN === 'file://' ? true : (process.env.CORS_ORIGIN || 'http://localhost:3000') }));
app.use(express.json({ limit: '20mb' }));

app.get('/api/v2/health', async (_req, res) => {
  try {
    await pool.query('select 1 as ok');
    res.json({ sucesso: true, servico: 'danuta-v2', banco: 'online' });
  } catch (erro) {
    res.status(503).json({ sucesso: false, servico: 'danuta-v2', banco: 'offline', msg: erro.message });
  }
});

app.post('/api/v2/recebimentos', async (req, res) => {
  const dados = req.body || {};
  const id = String(dados.id || '').trim();
  const ordens = Array.isArray(dados.ordens) ? dados.ordens.map(v => String(v).trim()).filter(Boolean) : [];
  const cliente = String(dados.cliente || '').trim().replace(/\s+/g, ' ');

  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return res.status(400).json({ sucesso: false, msg: 'ID UUID inválido.' });
  if (!dados.data || !/^\d{4}-\d{2}-\d{2}$/.test(String(dados.data))) return res.status(400).json({ sucesso: false, msg: 'Data inválida.' });
  if (!dados.cromato || !dados.linhaBanho || !dados.foto || !['OK','NOK'].includes(dados.loteAprovado)) return res.status(400).json({ sucesso: false, msg: 'Campos obrigatórios incompletos.' });
  if (dados.loteAprovado === 'NOK' && !String(dados.motivoReprovacao || '').trim()) return res.status(400).json({ sucesso: false, msg: 'Motivo NOK obrigatório.' });
  if (![dados.quantidade,dados.volumes,dados.kgs].every(v => Number.isFinite(Number(v)) && Number(v)>0)) return res.status(400).json({ sucesso: false, msg: 'Quantidade, volumes e kgs devem ser positivos.' });
  if (new Set(ordens).size !== ordens.length) return res.status(400).json({ sucesso: false, msg: 'OS duplicada no envio.' });
  if (!id) return res.status(400).json({ sucesso: false, msg: 'ID do dispositivo é obrigatório.' });
  if (!ordens.length) return res.status(400).json({ sucesso: false, msg: 'Ao menos uma OS é obrigatória.' });
  if (!cliente) return res.status(400).json({ sucesso: false, msg: 'Cliente é obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existente = await client.query('select id from recebimentos where id = $1', [id]);
    if (existente.rowCount) {
      await client.query('COMMIT');
      return res.json({ sucesso: true, duplicadoIdempotente: true, id });
    }

    const duplicadas = await client.query(
      `select distinct os from recebimento_ordens where os = any($1::text[])`,
      [ordens]
    );
    if (duplicadas.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        sucesso: false,
        codigo: 'OS_DUPLICADA',
        ordensDuplicadas: duplicadas.rows.map(r => r.os),
        msg: 'Uma ou mais OS já estão registradas.'
      });
    }

    await client.query(
      `insert into recebimentos (
        id, data_recebimento, cliente, nota_fiscal, op_cliente, cromato, linha_banho,
        quantidade, volumes, kgs, lote_aprovado, motivo_reprovacao, foto_base64,
        google_status, whatsapp_status, criado_em, atualizado_em
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'PENDENTE','NAO_APLICAVEL',now(),now())`,
      [
        id,
        dados.data || null,
        cliente,
        dados.notaFiscal || null,
        dados.opCliente || null,
        dados.cromato || null,
        dados.linhaBanho || null,
        dados.quantidade || null,
        dados.volumes || null,
        dados.kgs || null,
        dados.loteAprovado || null,
        dados.motivoReprovacao || '',
        dados.foto || null
      ]
    );

    for (const os of ordens) {
      await client.query('insert into recebimento_ordens (recebimento_id, os) values ($1,$2)', [id, os]);
    }

    if (cliente.toLocaleLowerCase('pt-BR') === 'capo acessórios'.toLocaleLowerCase('pt-BR')) {
      await client.query(`update recebimentos set whatsapp_status = 'PENDENTE' where id = $1`, [id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ sucesso: true, id, googleStatus: 'PENDENTE' });
  } catch (erro) {
    await client.query('ROLLBACK');
    res.status(erro.code === '23505' ? 409 : 500).json({ sucesso: false, codigo: erro.code === '23505' ? 'OS_DUPLICADA' : 'ERRO_INTERNO', msg: erro.code === '23505' ? 'OS já registrada no ambiente V2.' : 'Falha no banco V2.' });
  } finally {
    client.release();
  }
});

app.get('/api/v2/recebimentos/:id/status', async (req, res) => {
  try {
    const r = await pool.query(
      `select id, google_status, whatsapp_status, criado_em, atualizado_em
       from recebimentos where id = $1`,
      [req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ sucesso: false, msg: 'Registro não encontrado.' });
    res.json({ sucesso: true, ...r.rows[0] });
  } catch (erro) {
    res.status(500).json({ sucesso: false, msg: erro.message });
  }
});

app.post('/api/v2/recebimentos/:id/whatsapp/confirmar', async (req, res) => {
  try {
    const r = await pool.query(
      `update recebimentos set whatsapp_status = 'ENVIADO_MANUAL', atualizado_em = now()
       where id = $1 returning id, whatsapp_status`,
      [req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ sucesso: false, msg: 'Registro não encontrado.' });
    res.json({ sucesso: true, ...r.rows[0] });
  } catch (erro) {
    res.status(500).json({ sucesso: false, msg: erro.message });
  }
});

app.listen(port, host, () => {
  console.log(`Danuta V2 API ouvindo em ${host}:${port} (ambiente isolado)`);
});
