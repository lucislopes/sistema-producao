import { useEffect, useId, useState } from "react"
import { api } from "../services/api"
import { Input } from "./ui/Input"

export function AutocompleteCliente({ clienteId, clienteInicial, onSelecionar }) {
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [indiceAtivo, setIndiceAtivo] = useState(-1)
  const listaId = useId()

  useEffect(() => {
    if (!clienteId) {
      setBusca("")
      setClienteSelecionado(null)
      setResultados([])
      return
    }

    if (
      clienteInicial &&
      String(clienteInicial.id) === String(clienteId)
    ) {
      setClienteSelecionado(clienteInicial)
      setBusca(clienteInicial.nome || "")
      setResultados([])
      return
    }

    async function carregarClienteSelecionado() {
      try {
        const response = await api.get("/clientes", {
          params: {
            busca: clienteId,
            incluirInativos: true
          }
        })

        const lista = Array.isArray(response.data)
          ? response.data
          : response.data?.dados || []

        const cliente = lista.find(
          (item) => String(item.id) === String(clienteId)
        )

        if (cliente) {
          setClienteSelecionado(cliente)
          setBusca(cliente.nome || "")
          setResultados([])
        } else {
          console.log("Cliente não encontrado para o pedido:", {
            clienteId,
            clienteInicial,
            retorno: response.data
          })

          setClienteSelecionado(null)
          setBusca("")
          setResultados([])
        }
      } catch (error) {
        console.log("Erro ao carregar cliente selecionado:", error)
        setClienteSelecionado(null)
        setBusca("")
        setResultados([])
      }
    }

    carregarClienteSelecionado()
  }, [clienteId, clienteInicial])

  useEffect(() => {
    const controller = new AbortController()

    async function buscarClientes() {
      if (clienteSelecionado) {
        setResultados([])
        return
      }

      if (!busca.trim()) {
        setResultados([])
        return
      }

      try {
        const response = await api.get("/clientes", {
          params: {
            busca: busca.trim(),
            incluirInativos: true
          },
          signal: controller.signal
        })

        const lista = Array.isArray(response.data)
          ? response.data
          : response.data?.dados || []

        setResultados(lista)
      } catch (error) {
        if (error.code === "ERR_CANCELED") return
        console.log("Erro ao buscar clientes:", error)
        setResultados([])
      }
    }

    const timeout = setTimeout(buscarClientes, 400)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [busca, clienteSelecionado])

  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente)
    setBusca(cliente.nome || "")
    setResultados([])
    setIndiceAtivo(-1)

    if (onSelecionar) {
      onSelecionar(cliente)
    }
  }

  function alterarBusca(e) {
    setClienteSelecionado(null)
    setBusca(e.target.value)
    setResultados([])
    setIndiceAtivo(-1)

    if (onSelecionar) {
      onSelecionar(null)
    }
  }

  function navegarResultados(event) {
    if (resultados.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setIndiceAtivo((atual) => (atual + 1) % resultados.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setIndiceAtivo((atual) => (atual <= 0 ? resultados.length - 1 : atual - 1))
    } else if (event.key === "Enter" && indiceAtivo >= 0) {
      event.preventDefault()
      selecionarCliente(resultados[indiceAtivo])
    } else if (event.key === "Escape") {
      setResultados([])
      setIndiceAtivo(-1)
    }
  }

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Digite para buscar o cliente..."
        value={busca}
        onChange={alterarBusca}
        onKeyDown={navegarResultados}
        autoComplete="off"
        role="combobox"
        aria-label="Buscar cliente"
        aria-autocomplete="list"
        aria-expanded={resultados.length > 0}
        aria-controls={resultados.length > 0 ? listaId : undefined}
        aria-activedescendant={indiceAtivo >= 0 ? `${listaId}-${indiceAtivo}` : undefined}
      />

      {resultados.length > 0 && (
        <div id={listaId} role="listbox" className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-72 overflow-auto">
          {resultados.map((cliente, index) => (
            <button
              key={cliente.id}
              id={`${listaId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === indiceAtivo}
              onClick={() => selecionarCliente(cliente)}
              className={`block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${index === indiceAtivo ? "bg-blue-50" : ""}`}
            >
              <p className="font-semibold text-sm">
                {cliente.nome || "Cliente sem nome"}
              </p>

              <p className="text-xs text-gray-500">
                {cliente.documento || "Sem documento"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
