import test from "node:test"
import assert from "node:assert/strict"
import { identificarTipoNotificacao } from "../src/utils/notificationType.js"

test("classifica mensagens de sucesso", () => {
  assert.equal(identificarTipoNotificacao("Pedido salvo com sucesso"), "sucesso")
  assert.equal(identificarTipoNotificacao("Serviço excluído"), "sucesso")
})

test("classifica falhas como erro", () => {
  assert.equal(identificarTipoNotificacao("Servidor não respondeu"), "erro")
  assert.equal(identificarTipoNotificacao("Data inválida"), "erro")
})

test("usa aviso para validações orientativas", () => {
  assert.equal(identificarTipoNotificacao("Selecione pelo menos um serviço"), "aviso")
})
