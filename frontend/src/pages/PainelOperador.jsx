import { useEffect, useState } from "react"
import { api } from "../services/api"

export function PainelOperador() {

  const [servicosDisponiveis, setServicosDisponiveis] = useState([])
  const [meusServicos, setMeusServicos] = useState([])
  const disponiveisAgrupados = agruparPorPedido(servicosDisponiveis)
  const meusServicosAgrupados = agruparPorPedido(meusServicos)

  async function carregarDados() {
    try {

      const [
        disponiveisRes,
        meusRes
      ] = await Promise.all([
        api.get("/servicos-plano/disponiveis"),
        api.get("/servicos-plano/meus")
      ])

      setServicosDisponiveis(disponiveisRes.data)
      setMeusServicos(meusRes.data)

    } catch (error) {
      console.log(error)
      alert("Erro ao carregar painel")
    }
  }

  useEffect(() => {
    carregarDados()

    const interval = setInterval(() => {
      carregarDados()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  async function assumirServico(id) {
    try {

      await api.put(`/servicos-plano/assumir/${id}`)

      carregarDados()

    } catch (error) {
      console.log(error)
      alert("Erro ao assumir serviço")
    }
  }

  async function alterarStatus(id, status) {
    try {

      await api.put(`/servicos-plano/status/${id}`, {
        status
      })

      carregarDados()

    } catch (error) {
      console.log(error)
      alert("Erro ao alterar status")
    }
  }

  function agruparPorPedido(servicos) {
    const grupos = {}

    servicos.forEach((servico) => {
        const pedido = servico.plano?.pedido
        const plano = servico.plano

        if (!pedido || !plano) return

        if (!grupos[pedido.id]) {
        grupos[pedido.id] = {
            pedido,
            planos: {}
        }
        }

        if (!grupos[pedido.id].planos[plano.id]) {
        grupos[pedido.id].planos[plano.id] = {
            plano,
            servicos: []
        }
        }

        grupos[pedido.id].planos[plano.id].servicos.push(servico)
    })

    return Object.values(grupos).map((grupo) => ({
        ...grupo,
        planos: Object.values(grupo.planos)
    }))
    }

  return (
    <div>
      {/* SERVIÇOS DISPONÍVEIS */}

      <div className="mb-10">

        <h2 className="text-2xl font-bold mb-4">
          Serviços Disponíveis
        </h2>

        <div className="grid grid-cols-1 gap-4">

          {disponiveisAgrupados.map((grupo) => (
            <div
                key={grupo.pedido.id}
                className="bg-white p-5 rounded-2xl shadow-md border"
            >
                <h3 className="text-xl font-bold mb-2">
                Pedido #{grupo.pedido.numeroPedido} - {grupo.pedido.cliente?.nome}
                </h3>

                <p className="text-gray-600 mb-4">
                Status pedido: {grupo.pedido.status}
                </p>

                {grupo.planos.map((itemPlano) => (
                <div
                    key={itemPlano.plano.id}
                    className="border rounded-xl p-4 mb-4 bg-gray-50"
                >
                    <h4 className="font-bold mb-3">
                    Plano {itemPlano.plano.numeroPlano} - {itemPlano.plano.quantidadeChapas} chapas
                    </h4>

                    <div className="flex flex-col gap-3">
                    {itemPlano.servicos.map((servico) => (
                        <div
                        key={servico.id}
                        className="bg-white border rounded-lg p-3 flex justify-between items-center"
                        >
                        <div>
                            <p className="font-semibold">
                            {servico.tipoServico?.nome}
                            </p>

                            <p className="text-sm text-gray-600">
                            Status: {servico.status}
                            </p>
                        </div>

                        <button
                            onClick={() => assumirServico(servico.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            Assumir
                        </button>
                        </div>
                    ))}
                    </div>
                </div>
                ))}
            </div>
            ))}

            {servicosDisponiveis.length === 0 && (
            <div className="bg-white p-5 rounded-2xl shadow-md">
                Nenhum serviço disponível.
            </div>
            )}

          {servicosDisponiveis.length === 0 && (
            <div className="bg-white p-5 rounded-2xl shadow-md">
              Nenhum serviço disponível.
            </div>
          )}

        </div>

      </div>

      {/* MEUS SERVIÇOS */}

      <div>

        <h2 className="text-2xl font-bold mb-4">
          Meus Serviços
        </h2>

        <div className="grid grid-cols-1 gap-4">

          {meusServicosAgrupados.map((grupo) => (
            <div
                key={grupo.pedido.id}
                className="bg-white p-5 rounded-2xl shadow-md border"
            >

                <h3 className="text-xl font-bold mb-2">
                Pedido #{grupo.pedido.numeroPedido} - {grupo.pedido.cliente?.nome}
                </h3>

                <p className="text-gray-600 mb-4">
                Status pedido: {grupo.pedido.status}
                </p>

                {grupo.planos.map((itemPlano) => (

                <div
                    key={itemPlano.plano.id}
                    className="border rounded-xl p-4 mb-4 bg-gray-50"
                >

                    <h4 className="font-bold mb-3">
                    Plano {itemPlano.plano.numeroPlano} - {itemPlano.plano.quantidadeChapas} chapas
                    </h4>

                    <div className="flex flex-col gap-3">

                    {itemPlano.servicos.map((servico) => (

                        <div
                        key={servico.id}
                        className="bg-white border rounded-lg p-3 flex justify-between items-center"
                        >

                        <div>

                            <p className="font-semibold">
                            {servico.tipoServico?.nome}
                            </p>

                            <p className="text-sm text-gray-600">
                            Operador: {servico.operador?.nome || "Sem operador"}
                            </p>

                            <p className="text-sm text-gray-600">
                            Status: {servico.status}
                            </p>

                        </div>

                        <div className="flex gap-2">

                            {servico.status !== "INICIADO" && (
                            <button
                                onClick={() =>
                                alterarStatus(servico.id, "INICIADO")
                                }
                                className="bg-green-600 text-white px-4 py-2 rounded-lg"
                            >
                                Iniciar
                            </button>
                            )}

                            {servico.status !== "PAUSADO" && (
                            <button
                                onClick={() =>
                                alterarStatus(servico.id, "PAUSADO")
                                }
                                className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                            >
                                Pausar
                            </button>
                            )}

                            {servico.status !== "CONCLUIDO" && (
                            <button
                                onClick={() =>
                                alterarStatus(servico.id, "CONCLUIDO")
                                }
                                className="bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                                Concluir
                            </button>
                            )}

                        </div>

                        </div>

                    ))}

                    </div>

                </div>

                ))}

            </div>
            ))}

          {meusServicos.length === 0 && (
            <div className="bg-white p-5 rounded-2xl shadow-md">
              Nenhum serviço atribuído.
            </div>
          )}

        </div>

      </div>

    </div>
  )
}