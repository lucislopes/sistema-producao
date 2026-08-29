let setLoadingGlobal = null
let requisicoesAtivas = 0

export function registrarLoading(setLoading) {
  setLoadingGlobal = setLoading
}

export function iniciarLoading() {
  requisicoesAtivas += 1

  if (setLoadingGlobal) {
    setLoadingGlobal(true)
  }
}

export function finalizarLoading() {
  requisicoesAtivas = Math.max(0, requisicoesAtivas - 1)

  if (setLoadingGlobal) {
    setLoadingGlobal(requisicoesAtivas > 0)
  }
}
