let setLoadingGlobal = null

export function registrarLoading(setLoading) {
  setLoadingGlobal = setLoading
}

export function iniciarLoading() {
  if (setLoadingGlobal) {
    setLoadingGlobal(true)
  }
}

export function finalizarLoading() {
  if (setLoadingGlobal) {
    setLoadingGlobal(false)
  }
}