import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "./ui/Input"

export function AutocompleteCliente({ clienteId, onSelecionar }) {
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)

  useEffect(() => {
    async function carregarClienteSelecionado() {
      if (!clienteId) {
        setBusca("")
        setClienteSelecionado(null)
        return
      }

      try {
        let cliente = null
          const response = await api.get("/clientes")
          cliente = response.data.find((item) => item.id === clienteId)

        if (cliente) {
          setClienteSelecionado(cliente)
          setBusca(cliente.nome || "")
        }
      } catch (error) {
        console.log(error)
      }
    }

    carregarClienteSelecionado()
  }, [clienteId])

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

      const response = await api.get("/clientes", {
        params: { busca }
      })

      setResultados(response.data)
    }

    const timeout = setTimeout(buscarClientes, 400)

    return () => clearTimeout(timeout)
  }, [busca, clienteSelecionado])

  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente)
    setBusca(cliente.nome || "")
    setResultados([])
    onSelecionar(cliente)
  }

  function alterarBusca(e) {
    setClienteSelecionado(null)
    setBusca(e.target.value)
    setResultados([])
    onSelecionar(null)
  }

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Digite para buscar o cliente..."
        value={busca}
        onChange={alterarBusca}
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
                {cliente.nome}
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