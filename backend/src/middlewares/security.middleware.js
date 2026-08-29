const tentativasLogin = new Map()

const JANELA_LOGIN_MS = 15 * 60 * 1000
const LIMITE_LOGIN = 10

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  res.setHeader("Cross-Origin-Resource-Policy", "same-site")
  next()
}

export function limitarLogin(req, res, next) {
  const agora = Date.now()
  const chave = req.ip || req.socket.remoteAddress || "desconhecido"

  if (tentativasLogin.size > 1000) {
    for (const [ip, tentativa] of tentativasLogin.entries()) {
      if (agora >= tentativa.expiraEm) {
        tentativasLogin.delete(ip)
      }
    }
  }

  const registro = tentativasLogin.get(chave)

  if (!registro || agora >= registro.expiraEm) {
    tentativasLogin.set(chave, { quantidade: 1, expiraEm: agora + JANELA_LOGIN_MS })
    return next()
  }

  if (registro.quantidade >= LIMITE_LOGIN) {
    const retryAfter = Math.ceil((registro.expiraEm - agora) / 1000)
    res.setHeader("Retry-After", retryAfter)
    return res.status(429).json({
      error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente."
    })
  }

  registro.quantidade += 1
  next()
}

export function limparTentativasLogin(req) {
  const chave = req.ip || req.socket.remoteAddress || "desconhecido"
  tentativasLogin.delete(chave)
}
