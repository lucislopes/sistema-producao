export function rotaNaoEncontrada(req, res) {
  return res.status(404).json({ error: "Recurso não encontrado" })
}

export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  console.error("Erro não tratado", {
    method: req.method,
    path: req.originalUrl,
    message: error?.message
  })

  return res.status(500).json({ error: "Erro interno do servidor" })
}
