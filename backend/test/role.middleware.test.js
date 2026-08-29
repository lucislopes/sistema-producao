import test from "node:test"
import assert from "node:assert/strict"
import { roleMiddleware } from "../src/middlewares/role.middleware.js"

function resposta() {
  return {
    statusCode: 200,
    body: null,
    status(codigo) { this.statusCode = codigo; return this },
    json(body) { this.body = body; return this }
  }
}

test("rejeita requisição sem usuário autenticado", () => {
  const res = resposta()
  roleMiddleware("ADMIN")({}, res, () => assert.fail("não deveria liberar"))
  assert.equal(res.statusCode, 401)
})

test("rejeita perfil sem permissão e libera perfil autorizado", () => {
  const negada = resposta()
  roleMiddleware("ADMIN")({ user: { funcao: "VENDEDOR" } }, negada, () => assert.fail("não deveria liberar"))
  assert.equal(negada.statusCode, 403)

  let liberou = false
  roleMiddleware("ADMIN", "VENDEDOR")(
    { user: { funcao: "VENDEDOR" } },
    resposta(),
    () => { liberou = true }
  )
  assert.equal(liberou, true)
})
