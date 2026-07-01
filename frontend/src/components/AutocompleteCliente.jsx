import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "./ui/Input"

export function AutocompleteCliente({ clienteId, clienteInicial, onSelecionar }) {
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)

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
          }
        })

        const lista = Array.isArray(response.data)
          ? response.data
          : response.data?.dados || []

        setResultados(lista)
      } catch (error) {
        console.log("Erro ao buscar clientes:", error)
        setResultados([])
      }
    }

    const timeout = setTimeout(buscarClientes, 400)

    return () => clearTimeout(timeout)
  }, [busca, clienteSelecionado])

  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente)
    setBusca(cliente.nome || "")
    setResultados([])

    if (onSelecionar) {
      onSelecionar(cliente)
    }
  }

  function alterarBusca(e) {
    setClienteSelecionado(null)
    setBusca(e.target.value)
    setResultados([])

    if (onSelecionar) {
      onSelecionar(null)
    }
  }

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Digite para buscar o cliente..."
        value={busca}
        onChange={alterarBusca}
        autoComplete="off"
      />

      {resultados.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-72 overflow-auto">
          {resultados.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              onClick={() => selecionarCliente(cliente)}
              className="block w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
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