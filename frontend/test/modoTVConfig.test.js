import test from "node:test"
import assert from "node:assert/strict"
import { CONFIG_MODO_TV_PADRAO, normalizarConfigModoTV, proximoPainelModoTV } from "../src/utils/modoTVConfig.js"

test("mantém apenas opções válidas e ao menos um painel", () => {
  assert.deepEqual(normalizarConfigModoTV({ atualizacaoSegundos: 999, itensPorPagina: 8, paineis: [] }), {
    ...CONFIG_MODO_TV_PADRAO,
    itensPorPagina: 8
  })
})

test("remove painéis inválidos e duplicados", () => {
  assert.deepEqual(normalizarConfigModoTV({ paineis: [2, 2, 8, 0] }).paineis, [0, 2])
})

test("avança somente entre os painéis habilitados", () => {
  assert.equal(proximoPainelModoTV(0, [0, 2]), 2)
  assert.equal(proximoPainelModoTV(2, [0, 2]), 0)
})
