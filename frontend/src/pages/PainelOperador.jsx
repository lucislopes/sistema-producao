import { useEffect, useMemo, useState } from "react"
import { api } from "../services/api"

export function PainelOperador() {
  const [servicosDisponiveis, setServicosDisponiveis] = useState([])
  const [meusServicos, setMeusServicos] = useState([])
  const [carregando, setCarregando] = useState(false)

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

  const disponiveisAgrupados = useMemo(
    () => agruparPorPedido(servicosDisponiveis),
    [servicosDisponiveis]
  )

  const meusServicosAgrupados = useMemo(
    () => agruparPorPedido(meusServicos),
    [meusServicos]
  )

  async function carregarDados() {
    try {
      setCarregando(true)

      const [disponiveisRes, meusRes] = await Promise.all([
        api.get("/servicos-plano/disponiveis"),
        api.get("/servicos-plano/meus")
      ])

      setServicosDisponiveis(disponiveisRes.data)
      setMeusServicos(meusRes.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar painel")
    } finally {
      setCarregando(false)
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
      await carregarDados()
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

      await carregarDados()
    } catch (error) {
      console.log(error)
      alert("Erro ao alterar status")
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Painel do Operador
        </h1>

        <button
          onClick={carregarDados}
          disabled={carregando}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* SERVIÇOS DISPONÍVEIS */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          Serviços Disponíveis
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {disponiveisAgrupados.map((grupo) => (
            <div
              key={grupo.pedido.id}
              className="bg-white p-5 rounded-2xl shadow-md border"
            >
              <h3 className="text-lg font-bold mb-2">
                Pedido #{grupo.pedido.numeroPedido} -{" "}
                {grupo.pedido.cliente?.nome || "Cliente não informado"}
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
                    Plano {itemPlano.plano.numeroPlano} -{" "}
                    {itemPlano.plano.quantidadeChapas} chapas
                  </h4>

                  <div className="flex flex-col gap-3">
                    {itemPlano.servicos.map((servico) => (
                      <div
                        key={servico.id}
                        className="bg-white border rounded-lg p-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {servico.tipoServico?.nome || "Serviço sem nome"}
                          </p>

                          <p className="text-sm text-gray-600">
                            Status: {servico.status}
                          </p>

                          <p className="text-sm text-gray-600">
                            Operador:{" "}
                            {servico.operador?.nome || "Sem operador"}
                          </p>
                        </div>

                        <button
                          onClick={() => assumirServico(servico.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg whitespace-nowrap hover:bg-blue-700"
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
            <div className="bg-white p-5 rounded-2xl shadow-md border text-gray-600">
              Nenhum serviço disponível.
            </div>
          )}
        </div>
      </section>

      {/* MEUS SERVIÇOS */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          Meus Serviços
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {meusServicosAgrupados.map((grupo) => (
            <div
              key={grupo.pedido.id}
              className="bg-white p-5 rounded-2xl shadow-md border"
            >
              <h3 className="text-lg font-bold mb-2">
                Pedido #{grupo.pedido.numeroPedido} -{" "}
                {grupo.pedido.cliente?.nome || "Cliente não informado"}
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
                    Plano {itemPlano.plano.numeroPlano} -{" "}
                    {itemPlano.plano.quantidadeChapas} chapas
                  </h4>

                  <div className="flex flex-col gap-3">
                    {itemPlano.servicos.map((servico) => (
                      <div
                        key={servico.id}
                        className="bg-white border rounded-lg p-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {servico.tipoServico?.nome || "Serviço sem nome"}
                          </p>

                          <p className="text-sm text-gray-600">
                            Operador:{" "}
                            {servico.operador?.nome || "Sem operador"}
                          </p>

                          <p className="text-sm text-gray-600">
                            Status: {servico.status}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {servico.status === "ABERTO" && (
                            <button
                              onClick={() =>
                                alterarStatus(servico.id, "INICIADO")
                              }
                              className="bg-green-600 text-white px-4 py-2 rounded-lg whitespace-nowrap hover:bg-green-700"
                            >
                              Iniciar
                            </button>
                          )}

                          {servico.status === "INICIADO" && (
                            <button
                              onClick={() =>
                                alterarStatus(servico.id, "CONCLUIDO")
                              }
                              className="bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap hover:bg-blue-800"
                            >
                              Concluir
                            </button>
                          )}

                          {servico.status === "CONCLUIDO" && (
                            <span className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm">
                              Concluído
                            </span>
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
            <div className="bg-white p-5 rounded-2xl shadow-md border text-gray-600">
              Nenhum serviço atribuído.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}