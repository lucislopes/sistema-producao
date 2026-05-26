import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"

export function BuscaGlobal() {
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])

  useEffect(() => {
    async function buscar() {
      try {
        if (!busca.trim()) {
          setResultados([])
          return
        }

        const response = await api.get("/busca-global", {
          params: {
            busca
          }
        })

        setResultados(response.data)

      } catch (error) {
        console.log(error)
      }
    }

    const timeout = setTimeout(() => {
      buscar()
    }, 400)

    return () => clearTimeout(timeout)

  }, [busca])

  return (
    <div className="relative w-full max-w-xl">
      <Input
        type="text"
        placeholder="Buscar pedido, cliente ou endereço..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {resultados.length > 0 && (
        <div className=" absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-200 mt-2 z-50 max-h-[400px] overflow-auto">
          {resultados.map((pedido) => (
            <Link
              key={pedido.id}
              to={`/pedidos/${pedido.id}`}
              className=" block p-4 border-b border-gray-100 hover:bg-gray-50 transition"
              onClick={() => {
                setBusca("")
                setResultados([])
              }}
            >
              <p className="font-semibold text-gray-800">
                Pedido #{pedido.numeroPedido}
              </p>

              <p className="text-xs text-gray-500">
                Cliente: {pedido.cliente?.nome}
              </p>

              <p className="text-xs text-gray-500">
                Endereço: {pedido.enderecoEntrega || "-"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}