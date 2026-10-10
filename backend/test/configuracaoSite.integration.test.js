import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { criarHandlersConfiguracaoSite } from '../src/utils/configuracaoSite.js';
import { bloquearAgenda } from '../src/utils/limitesDiarios.js';
dotenv.config({ quiet: true });
const response = () => ({ statusCode: 200, setHeader() {}, status(code) { this.statusCode=code; return this }, json(data) { this.data=data; return this } });
test('banco local: grava identidade, publica dados permitidos, desativa e preserva cadastro; rollback integral', { skip: process.env.RUN_SITE_DB_TESTS !== '1' }, async () => {
  if (!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname)) throw new Error('Teste permitido apenas em banco local.');
  const prisma = new PrismaClient();
  const rollback = new Error('ROLLBACK_TESTE_SITE');
  try {
    await assert.rejects(prisma.$transaction(async tx => {
      const original = await tx.configuracaoEmpresa.findFirst();
      const facade = { configuracaoEmpresa: tx.configuracaoEmpresa, configuracaoSite: tx.configuracaoSite, $transaction: fn => fn(tx) };
      const handlers = criarHandlersConfiguracaoSite(facade, bloquearAgenda);
      const payload = { nome: 'Empresa de teste do portal', telefone: '', email: '', logoUrl: '', ativo: true, corPrimaria: '#084f2b', corDestaque: '#ffbd16', whatsapp: '', instagramUrl: '', siteUrl: 'http://127.0.0.1:5180', sistemaUrl: 'http://localhost:5173' };
      const saved = response(); await handlers.salvar({ body: payload }, saved, error => { throw error });
      assert.equal(saved.statusCode, 200); assert.equal(saved.data.nome, payload.nome);
      const atual = await tx.configuracaoEmpresa.findFirst();
      if (original) for (const key of ['id','cnpj','endereco','cidade','estado','limiteFretesEmpresaDia','limiteFretesClienteDia','limiteChapasDia']) assert.deepEqual(atual[key], original[key]);
      const published = response(); await handlers.publico({}, published, error => { throw error });
      assert.equal(published.data.sistemaUrl, 'http://localhost:5173/');
      assert.equal('limiteChapasDia' in published.data, false); assert.equal('cnpj' in published.data, false);
      const invalid = response(); await handlers.salvar({ body: { ...payload, sistemaUrl:'javascript:alert(1)' } }, invalid, error => { throw error });
      assert.equal(invalid.statusCode, 400);
      await handlers.salvar({ body: { ...payload, ativo:false } }, response(), error => { throw error });
      const disabled = response(); await handlers.publico({}, disabled, error => { throw error }); assert.equal(disabled.statusCode, 404);
      throw rollback;
    }), error => error === rollback);
  } finally { await prisma.$disconnect(); }
});
