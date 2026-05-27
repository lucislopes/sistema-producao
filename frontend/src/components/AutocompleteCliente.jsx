import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "./ui/Input"

export function AutocompleteCliente({ clienteId, onSelecionar }) {
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)

  useEffect(() => {
    async function buscarClientes() {
      if (!busca.trim()) {
        setResultados([])
        return
      }

      const response = await api.get("/clientes", {
        params: {
          busca
        }
      })

      setResultados(response.data)
    }

    const timeout = setTimeout(() => {
      buscarClientes()
    }, 400)

    return () => clearTimeout(timeout)
  }, [busca])

  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente)
    setBusca(cliente.nome)
    setResultados([])
    onSelecionar(cliente)
  }

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Digite para buscar o cliente..."
        value={clienteSelecionado ? clienteSelecionado.nome : busca}
        onChange={(e) => {
          setClienteSelecionado(null)
          setBusca(e.target.value)
          onSelecionar(null)
        }}
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