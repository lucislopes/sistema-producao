export function identificarTipoNotificacao(mensagem) {
  const texto = String(mensagem).toLocaleLowerCase("pt-BR")

  if (/sucesso|salv[oa]|alterad[oa]|criad[oa]|exclu[ií]d[oa]/.test(texto)) {
    return "sucesso"
  }

  if (/erro|n[aã]o foi poss[ií]vel|inv[aá]lid|expirad|sem permiss[aã]o|n[aã]o respondeu/.test(texto)) {
    return "erro"
  }

  return "aviso"
}
