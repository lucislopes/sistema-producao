import { useEffect, useMemo, useRef, useState } from "react"
import html2pdf from "html2pdf.js"

import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

import {
  Download,
  FileText,
  Factory,
  Layers,
  Package,
  ShoppingCart,
  Users,
  User,
  Trophy,
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react"

function hojeISO() {
  const agora = new Date()
  const offset = agora.getTimezoneOffset() * 60000

  return new Date(agora.getTime() - offset)
    .toISOString()
    .slice(0, 10)
}

function primeiroDiaMes() {
  const agora = new Date()

  const data = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    1
  )

  const offset = data.getTimezoneOffset() * 60000

  return new Date(data.getTime() - offset)
    .toISOString()
    .slice(0, 10)
}

function formatarData(data) {
  if (!data) return "-"

  const texto = String(data).substring(0, 10)
  const [ano, mes, dia] = texto.split("-")

  return `${dia}/${mes}/${ano}`
}

function formatarNumero(valor, casas = 0) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  })
}

function Card({
  titulo,
  valor,
  subtitulo,
  icon: Icon
}) {
  return (
    <div className="report-card">
      <div>
        <div className="report-card-title">
          {titulo}
        </div>

        <div className="report-card-value">
          {valor}
        </div>

        {subtitulo && (
          <div className="report-card-subtitle">
            {subtitulo}
          </div>
        )}
      </div>

      {Icon && (
        <div className="report-card-icon">
          <Icon size={22} />
        </div>
      )}
    </div>
  )
}

function TituloSecao({ children }) {
  return (
    <h2 className="report-section-title">
      {children}
    </h2>
  )
}

export function RelatorioMensalProducao() {
  const relatorioRef = useRef(null)

  const [dataInicio, setDataInicio] =
    useState(primeiroDiaMes())

  const [dataFim, setDataFim] =
    useState(hojeISO())

  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  async function carregarRelatorio() {
    try {
      setCarregando(true)

      const response = await api.get(
        "/relatorio-producao/mensal",
        {
            params: {
            dataInicio,
            dataFim
            }
        }
        )

      setDados(response.data)

    } catch (error) {
      console.error(error)

      alert(
        error.response?.data?.error ||
        "Erro ao carregar relatório."
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarRelatorio()
  }, [])

  const nomeArquivo = useMemo(() => {
    return `producao-${dataInicio}-${dataFim}.pdf`
  }, [dataInicio, dataFim])

  async function gerarPDF() {
    if (!relatorioRef.current) return

    try {
      setGerandoPdf(true)

      const elemento = relatorioRef.current

      const opcoes = {
        margin: [8, 8, 10, 8],

        filename: nomeArquivo,

        image: {
          type: "jpeg",
          quality: 0.98
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollY: 0
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        },

        pagebreak: {
          mode: ["avoid-all", "css", "legacy"]
        }
      }

      await html2pdf()
        .set(opcoes)
        .from(elemento)
        .save()

    } catch (error) {
      console.error(error)
      alert("Não foi possível gerar o PDF.")
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* CONTROLES */}

      <div className="no-pdf rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="mb-4">
          <h1 className="text-xl font-bold">
            Relatório Mensal de Produção
          </h1>

          <p className="text-sm text-gray-500">
            Consolida consumo de chapas e produtividade em um único PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

          <Input
            type="date"
            value={dataInicio}
            onChange={(e) =>
              setDataInicio(e.target.value)
            }
          />

          <Input
            type="date"
            value={dataFim}
            onChange={(e) =>
              setDataFim(e.target.value)
            }
          />

          <Button
            type="button"
            onClick={carregarRelatorio}
            loading={carregando}
          >
            <FileText size={17} />
            Gerar relatório
          </Button>

          <Button
            type="button"
            variant="success"
            onClick={gerarPDF}
            loading={gerandoPdf}
            disabled={!dados}
          >
            <Download size={17} />
            Gerar PDF
          </Button>

        </div>
      </div>

      {carregando && (
        <div className="rounded-xl border bg-white p-8 text-center">
          Gerando relatório...
        </div>
      )}

      {!carregando && dados && (

        <div
          ref={relatorioRef}
          className="report-pdf"
        >

          {/* CABEÇALHO */}

          <div className="report-header">

            <div>
              <h1>
                Relatório de Produção
              </h1>

              <p>
                Período de{" "}
                <strong>
                  {formatarData(dataInicio)}
                </strong>
                {" "}a{" "}
                <strong>
                  {formatarData(dataFim)}
                </strong>
              </p>
            </div>

            <div className="report-header-periodo">
              Produção
            </div>

          </div>


          {/* ========================= */}
          {/* CONSUMO DE CHAPAS */}
          {/* ========================= */}

          <TituloSecao>
            Consumo de Chapas
          </TituloSecao>

          <div className="report-grid-3">

            <Card
              titulo="Total de Chapas"
              valor={formatarNumero(
                dados.chapas?.totalChapas
              )}
              icon={Layers}
            />

            <Card
              titulo="Produção"
              valor={formatarNumero(
                dados.chapas?.producao
              )}
              icon={Factory}
            />

            <Card
              titulo="Chapas Inteiras"
              valor={formatarNumero(
                dados.chapas?.chapasInteiras
              )}
              icon={Package}
            />

            <Card
              titulo="Pedidos"
              valor={formatarNumero(
                dados.chapas?.pedidos
              )}
              icon={ShoppingCart}
            />

            <Card
              titulo="Clientes"
              valor={formatarNumero(
                dados.chapas?.clientes
              )}
              icon={Users}
            />

            <Card
              titulo="Média / Pedido"
              valor={formatarNumero(
                dados.chapas?.mediaPorPedido,
                2
              )}
              icon={FileText}
            />

          </div>


          {/* DESTAQUES */}

          <div className="report-grid-3 report-block">

            <Card
              titulo="Vendedor destaque"
              valor={
                dados.destaques?.vendedor?.nome ||
                "-"
              }
              subtitulo={
                dados.destaques?.vendedor
                  ? `${formatarNumero(
                      dados.destaques.vendedor.chapas
                    )} chapas`
                  : ""
              }
              icon={Trophy}
            />

            <Card
              titulo="Dia de maior consumo"
              valor={formatarData(
                dados.destaques
                  ?.maiorConsumo?.data
              )}
              subtitulo={
                dados.destaques?.maiorConsumo
                  ? `${formatarNumero(
                      dados.destaques.maiorConsumo.chapas
                    )} chapas`
                  : ""
              }
              icon={CalendarDays}
            />

            <Card
              titulo="Serviço mais consumido"
              valor={
                dados.destaques?.servico?.nome ||
                "-"
              }
              subtitulo={
                dados.destaques?.servico
                  ? `${formatarNumero(
                      dados.destaques.servico.chapas
                    )} chapas`
                  : ""
              }
              icon={Factory}
            />

          </div>


          {/* RANKINGS */}

          <div className="report-two-columns">

            <div className="report-panel">

              <h3>
                Ranking de Chapas por Vendedor
              </h3>

              <table className="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vendedor</th>
                    <th>Chapas</th>
                  </tr>
                </thead>

                <tbody>
                  {(dados.rankingVendedores || [])
                    .map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{index + 1}º</td>

                        <td>
                          {item.nome}
                        </td>

                        <td className="number">
                          {formatarNumero(
                            item.chapas
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

            </div>


            <div className="report-panel">

              <h3>
                Ranking de Chapas por Dia
              </h3>

              <table className="report-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Data</th>
                    <th>Chapas</th>
                  </tr>
                </thead>

                <tbody>
                  {(dados.rankingDias || [])
                    .map((item, index) => (
                      <tr key={item.data || index}>

                        <td>
                          {index + 1}º
                        </td>

                        <td>
                          {formatarData(
                            item.data
                          )}
                        </td>

                        <td className="number">
                          {formatarNumero(
                            item.chapas
                          )}
                        </td>

                      </tr>
                    ))}
                </tbody>

              </table>

            </div>

          </div>


          {/* CONSUMO POR SERVIÇO */}

          <div className="report-panel report-block">

            <h3>
              Consumo por Tipo de Serviço
            </h3>

            <table className="report-table">

              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Qtde Serviços</th>
                  <th>Chapas</th>
                  <th>Metros</th>
                </tr>
              </thead>

              <tbody>

                {(dados.consumoPorServico || [])
                  .map((item, index) => (

                    <tr
                      key={
                        item.id ||
                        item.nome ||
                        index
                      }
                    >

                      <td>
                        {item.nome}
                      </td>

                      <td className="number">
                        {formatarNumero(
                          item.quantidadeServicos
                        )}
                      </td>

                      <td className="number">
                        {formatarNumero(
                          item.chapas
                        )}
                      </td>

                      <td className="number">
                        {formatarNumero(
                          item.metros,
                          2
                        )}
                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>


          {/* ========================= */}
          {/* PRODUTIVIDADE */}
          {/* ========================= */}

          <div className="page-break" />

          <TituloSecao>
            Produtividade
          </TituloSecao>


          <div className="report-grid-3">

            <Card
              titulo="Total Serviços"
              valor={formatarNumero(
                dados.produtividade
                  ?.totalServicos
              )}
              icon={Factory}
            />

            <Card
              titulo="Operadores"
              valor={formatarNumero(
                dados.produtividade
                  ?.operadores
              )}
              icon={User}
            />

            <Card
              titulo="Em Produção"
              valor={formatarNumero(
                dados.produtividade
                  ?.emProducao
              )}
              icon={Clock}
            />

            <Card
              titulo="Concluídos"
              valor={formatarNumero(
                dados.produtividade
                  ?.concluidos
              )}
              icon={CheckCircle2}
            />

            <Card
              titulo="Cancelados"
              valor={formatarNumero(
                dados.produtividade
                  ?.cancelados
              )}
              icon={XCircle}
            />

            <Card
              titulo="Melhor Operador"
              valor={
                dados.produtividade
                  ?.melhorOperador?.nome ||
                dados.produtividade
                  ?.melhorOperador ||
                "-"
              }
              icon={Trophy}
            />

          </div>


          {/* RANKING OPERADORES */}

          <div className="report-panel report-block">

            <h3>
              Ranking de Operadores
            </h3>

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Operador</th>
                  <th>Total</th>
                  <th>Em Produção</th>
                  <th>Concluídos</th>
                  <th>Cancelados</th>
                  <th>% conclusão</th>
                </tr>
              </thead>

              <tbody>

                {(dados.rankingOperadores || [])
                  .map((item, index) => {

                    const percentual =
                      item.total > 0
                        ? (
                            (
                              Number(
                                item.concluidos
                              ) /
                              Number(item.total)
                            ) *
                            100
                          ).toFixed(1)
                        : "0,0"

                    return (
                      <tr
                        key={
                          item.id ||
                          item.nome ||
                          index
                        }
                      >

                        <td>
                          {index + 1}º
                        </td>

                        <td>
                          <strong>
                            {item.nome}
                          </strong>
                        </td>

                        <td className="number">
                          {formatarNumero(
                            item.total
                          )}
                        </td>

                        <td className="number">
                          {formatarNumero(
                            item.emProducao
                          )}
                        </td>

                        <td className="number">
                          {formatarNumero(
                            item.concluidos
                          )}
                        </td>

                        <td className="number">
                          {formatarNumero(
                            item.cancelados
                          )}
                        </td>

                        <td className="number">
                          {percentual}%
                        </td>

                      </tr>
                    )
                  })}

              </tbody>

            </table>

          </div>


          {/* RODAPÉ */}

          <div className="report-footer">
            Relatório gerado pelo Sistema de Produção
          </div>

        </div>
      )}
    </div>
  )
}