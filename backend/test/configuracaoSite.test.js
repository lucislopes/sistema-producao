import test from 'node:test';
import assert from 'node:assert/strict';
import { validarConfiguracaoSite, configuracaoPublica, criarHandlersConfiguracaoSite } from '../src/utils/configuracaoSite.js';
const body = { nome: 'Ferramad', telefone: '', email: '', logoUrl: '', ativo: true, corPrimaria: '#084f2b', corDestaque: '#ffbd16', whatsapp: '+55 (11) 99999-0000', siteUrl: 'http://127.0.0.1:5180', sistemaUrl: 'http://localhost:5173', instagramUrl: '' };
test('rejeita URLs executáveis, credenciais, cores inválidas e objetos; normaliza telefone', () => {
  assert.equal(validarConfiguracaoSite(body).site.whatsapp, '5511999990000');
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'https://user:pass@exemplo.com', 'ftp://exemplo.com']) {
    assert.throws(() => validarConfiguracaoSite({ ...body, sistemaUrl: value }));
  }
  for (const patch of [{ ativo: 'true' }, { corPrimaria: 'red' }, { nome: '' }, { email: 'errado' }, { whatsapp: 'abc' }, { logoUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }, { nome: {} }]) {
    assert.throws(() => validarConfiguracaoSite({ ...body, ...patch }));
  }
});
test('projeção pública não inclui dados internos e configuração ausente começa desativada', () => {
  const result = configuracaoPublica({ nome: 'Empresa', cnpj: 'privado', limiteChapasDia: 123, id: 'privado' }, { id: 'principal', ativo: true, segredo: 'privado' });
  assert.equal(result.nome, 'Empresa');
  assert.equal(result.ativo, true);
  for (const field of ['cnpj', 'limiteChapasDia', 'id', 'segredo']) assert.equal(field in result, false);
  assert.equal(configuracaoPublica(null, null).ativo, false);
});
test('logo legada inalterada continua compatível sem permitir novo SVG', () => {
  const antiga = 'data:image/svg+xml;base64,PHN2Zz4=';
  assert.equal(validarConfiguracaoSite({ ...body, logoUrl: antiga }, antiga).empresa.logoUrl, antiga);
  assert.throws(() => validarConfiguracaoSite({ ...body, logoUrl: antiga }, 'outra'));
});
const response = () => ({ statusCode: 200, headers: {}, setHeader(k,v) { this.headers[k]=v }, status(code) { this.statusCode=code; return this }, json(data) { this.data=data; return this } });
test('site desativado bloqueia endpoint público e não consulta dados da empresa', async () => {
  const handlers = criarHandlersConfiguracaoSite({ configuracaoSite: { findUnique: async () => ({ ativo: false }) }, configuracaoEmpresa: { findFirst: async () => assert.fail('Não consultar empresa') } });
  const res = response(); await handlers.publico({}, res, error => { throw error });
  assert.equal(res.statusCode, 404); assert.equal(res.data.code, 'SITE_DISABLED');
});
test('salvamento transacional preserva limites e endereço da empresa e ignora campos injetados', async () => {
  let update; let upsert; let locked = false;
  const tx = {
    configuracaoEmpresa: { findFirst: async () => ({ id: 'existente' }), update: async args => { update=args; assert.equal(locked,true); return args.data } },
    configuracaoSite: { upsert: async args => { upsert=args; return args.update } }
  };
  const handlers = criarHandlersConfiguracaoSite({ $transaction: async fn => fn(tx) }, async () => { locked=true });
  const res = response(); await handlers.salvar({ body: { ...body, limiteChapasDia: 0, endereco: 'sobrescrever', id: 'outra' } }, res, error => { throw error });
  assert.equal(update.where.id, 'existente');
  assert.equal('limiteChapasDia' in update.data, false); assert.equal('endereco' in update.data, false);
  assert.equal(upsert.where.id, 'principal'); assert.equal(res.data.nome, 'Ferramad');
});
