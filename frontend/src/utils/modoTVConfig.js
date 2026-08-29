export const CONFIG_MODO_TV_PADRAO = {
  atualizacaoSegundos: 30,
  rotacaoSegundos: 20,
  paginacaoSegundos: 8,
  itensPorPagina: 6,
  rotacaoAutomatica: true,
  paineis: [0, 1, 2]
}

const OPCOES = {
  atualizacaoSegundos: [15, 30, 60, 120],
  rotacaoSegundos: [10, 20, 30, 60],
  paginacaoSegundos: [5, 8, 12, 15],
  itensPorPagina: [4, 6, 8]
}

export function normalizarConfigModoTV(config = {}) {
  const resultado = { ...CONFIG_MODO_TV_PADRAO }

  for (const campo of Object.keys(OPCOES)) {
    const valor = Number(config[campo])
    if (OPCOES[campo].includes(valor)) resultado[campo] = valor
  }

  if (typeof config.rotacaoAutomatica === "boolean") resultado.rotacaoAutomatica = config.rotacaoAutomatica

  const paineis = Array.isArray(config.paineis)
    ? [...new Set(config.paineis.map(Number).filter((item) => [0, 1, 2].includes(item)))]
    : []
  if (paineis.length) resultado.paineis = paineis.sort()

  return resultado
}

export function proximoPainelModoTV(painelAtual, paineis) {
  if (!paineis.length) return 0
  const indice = paineis.indexOf(painelAtual)
  return paineis[(indice + 1) % paineis.length]
}
