export function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuário não autenticado"
      })
    }

    if (!roles.includes(req.user.funcao)) {
      return res.status(403).json({
        error: "Sem permissão"
      })
    }

    return next()
  }
}