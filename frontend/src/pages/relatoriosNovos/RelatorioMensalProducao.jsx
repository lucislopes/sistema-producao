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

function RankingBar({
  posicao,
  nome,
  valor,
  valorMaximo,
  sufixo = ""
}) {
  const percentual =
    valorMaximo > 0
      ? Math.max(
          4,
          (Number(valor || 0) / Number(valorMaximo)) * 100
        )
      : 0

  return (
    <div className="report-ranking-row">
      <div className="report-ranking-label">
        <span>
          <strong>{posicao}º</strong> {nome}
        </span>

        <strong>
          {formatarNumero(valor)}
          {sufixo}
        </strong>
      </div>

      <div className="report-ranking-track">
        <div
          className="report-ranking-bar"
          style={{
            width: `${Math.min(percentual, 100)}%`
          }}
        />
      </div>
    </div>
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
  const [modoPdf, setModoPdf] = useState("completo")

  async function carregarRelatorio() {
  try {
    setCarregando(true)

    const [consumoRes, produtividadeRes] = await Promise.all([
      api.get("/relatorio-consumo-chapas", {
        params: {
          dataInicio,
          dataFim,
          baseData: "pedido",
          page: 1,
          limit: 1000
        }
      }),

      api.get("/produtividade/operadores", {
        params: {
          dataInicio,
          dataFim
        }
      })
    ])

    const consumo = consumoRes.data || {}
    const produtividade = produtividadeRes.data || []

    const resumoConsumo = consumo.resumo || {}

    const rankingVendedores =
      consumo.porVendedor || []

    const rankingDias =
      [...(consumo.porDia || [])].sort(
        (a, b) =>
          Number(b.chapas || 0) -
          Number(a.chapas || 0)
      )

    const consumoPorServico =
      (consumo.porTipoServico || []).map(
        (item) => ({
          id:
            item.tipoServicoId,

          nome:
            item.nome,

          quantidadeServicos:
            Number(
              item.quantidadeServicos || 0
            ),

          chapas:
            Number(
              item.chapas || 0
            ),

          metros:
            Number(
              item.metrosEncabecamento || 0
            )
        })
      )

    /*
      =====================================================
      PRODUTIVIDADE
      =====================================================
    */

    const rankingOperadores =
      produtividade.map(
        (item) => ({
          id:
            item.operadorId,

          nome:
            item.operador,

          total:
            Number(
              item.total || 0
            ),

          abertos:
            Number(
              item.abertos || 0
            ),

          emProducao:
            Number(
              item.iniciados || 0
            ),

          concluidos:
            Number(
              item.concluidos || 0
            ),

          cancelados:
            Number(
              item.cancelados || 0
            ),

          taxaConclusao:
            Number(
              item.taxaConclusao || 0
            ),

          tempoMedioMinutos:
            Number(
              item.tempoMedioMinutos || 0
            )
        })
      )

    const totalServicos =
      rankingOperadores.reduce(
        (total, item) =>
          total + item.total,
        0
      )

    const totalAbertos =
      rankingOperadores.reduce(
        (total, item) =>
          total + item.abertos,
        0
      )

    const totalEmProducao =
      rankingOperadores.reduce(
        (total, item) =>
          total + item.emProducao,
        0
      )

    const totalConcluidos =
      rankingOperadores.reduce(
        (total, item) =>
          total + item.concluidos,
        0
      )

    const totalCancelados =
      rankingOperadores.reduce(
        (total, item) =>
          total + item.cancelados,
        0
      )

    const melhorOperador =
      rankingOperadores[0] || null

    /*
      =====================================================
      MONTA O OBJETO NO FORMATO QUE O PDF JÁ USA
      =====================================================
    */

    setDados({
      periodo: {
        dataInicio,
        dataFim
      },

      chapas: {
        totalChapas:
          Number(
            resumoConsumo.totalChapas || 0
          ),

        producao:
          Number(
            resumoConsumo.totalProducao || 0
          ),

        chapasInteiras:
          Number(
            resumoConsumo.totalChapaInteira || 0
          ),

        pedidos:
          Number(
            resumoConsumo.totalPedidos || 0
          ),

        clientes:
          Number(
            resumoConsumo.clientesAtendidos || 0
          ),

        mediaPorPedido:
          Number(
            resumoConsumo.mediaPorPedido || 0
          ),

        totalServicos:
          Number(
            resumoConsumo.totalServicosConcluidos || 0
          ),

        metrosEncabecamento:
          Number(
            resumoConsumo.totalMetrosEncabecamento || 0
          )
      },

      destaques: {
        vendedor:
          rankingVendedores[0] || null,

        maiorConsumo:
          rankingDias[0] || null,

        servico:
          consumoPorServico[0] || null
      },

      rankingVendedores,

      rankingDias,

      consumoPorServico,

      produtividade: {
        totalServicos,

        operadores:
          rankingOperadores.length,

        abertos:
          totalAbertos,

        emProducao:
          totalEmProducao,

        concluidos:
          totalConcluidos,

        cancelados:
          totalCancelados,

        melhorOperador
      },

      rankingOperadores
    })

  } catch (error) {
    console.error(
      "Erro ao carregar relatório mensal:",
      error
    )

    alert(
      error.response?.data?.error ||
      "Erro ao carregar relatório mensal de produção."
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

  async function gerarPDF(tipo = "completo") {
  if (!relatorioRef.current) return

  try {
    setGerandoPdf(true)
    setModoPdf(tipo)

    /*
      Aguarda o React aplicar a versão
      resumida/completa antes de capturar.
    */
    await new Promise((resolve) =>
      setTimeout(resolve, 150)
    )

    const elemento = relatorioRef.current

    const opcoes = {
      margin:
        tipo === "resumido"
          ? [5, 5, 5, 5]
          : [8, 8, 10, 8],

      filename:
        tipo === "resumido"
          ? `producao-resumido-${dataInicio}-${dataFim}.pdf`
          : `producao-${dataInicio}-${dataFim}.pdf`,

      image: {
        type: "jpeg",
        quality: 0.98
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        logging: false,

        onclone: (documentoClonado) => {
          const relatorio =
            documentoClonado.querySelector(".report-pdf")

          if (!relatorio) return

          const resumido =
            relatorio.classList.contains("pdf-resumido")

          const linhas =
            relatorio.querySelectorAll(".report-ranking-row")

          linhas.forEach((linha) => {
            const label =
              linha.querySelector(".report-ranking-label")

            const nomeElemento =
              label?.querySelector("span")

            const valorElemento =
              label?.querySelector(":scope > strong")

            const barra =
              linha.querySelector(".report-ranking-bar")

            if (
              !nomeElemento ||
              !valorElemento ||
              !barra
            ) {
              return
            }

            const nome =
              nomeElemento.textContent?.trim() || ""

            const valor =
              valorElemento.textContent?.trim() || ""

            const percentual =
              Math.max(
                0,
                Math.min(
                  100,
                  parseFloat(barra.style.width) || 0
                )
              )

            /*
              Pegamos a largura real do ranking já
              renderizado antes de transformá-lo em SVG.
            */
            const largura =
              Math.max(
                300,
                Math.round(
                  linha.getBoundingClientRect().width
                )
              )

            const altura =
              resumido ? 24 : 34

            const tamanhoFonte =
              resumido ? 7 : 9

            const alturaBarra =
              resumido ? 4 : 6

            const yTexto =
              resumido ? 7 : 10

            const yBarra =
              resumido ? 15 : 22

            const larguraBarra =
              Math.max(
                2,
                (largura * percentual) / 100
              )

            const svgNS =
              "http://www.w3.org/2000/svg"

            const svg =
              documentoClonado.createElementNS(
                svgNS,
                "svg"
              )

            svg.setAttribute(
              "viewBox",
              `0 0 ${largura} ${altura}`
            )

            svg.setAttribute(
              "width",
              "100%"
            )

            svg.setAttribute(
              "height",
              String(altura)
            )

            svg.style.display = "block"
            svg.style.width = "100%"
            svg.style.height = `${altura}px`
            svg.style.overflow = "visible"

            /*
              Nome / posição
            */
            const textoNome =
              documentoClonado.createElementNS(
                svgNS,
                "text"
              )

            textoNome.setAttribute("x", "0")
            textoNome.setAttribute("y", String(yTexto))
            textoNome.setAttribute(
              "dominant-baseline",
              "middle"
            )

            textoNome.setAttribute(
              "font-family",
              "Arial, Helvetica, sans-serif"
            )

            textoNome.setAttribute(
              "font-size",
              String(tamanhoFonte)
            )

            textoNome.setAttribute(
              "font-weight",
              "600"
            )

            textoNome.setAttribute(
              "fill",
              "#111827"
            )

            textoNome.textContent = nome

            /*
              Valor na direita
            */
            const textoValor =
              documentoClonado.createElementNS(
                svgNS,
                "text"
              )

            textoValor.setAttribute(
              "x",
              String(largura)
            )

            textoValor.setAttribute(
              "y",
              String(yTexto)
            )

            textoValor.setAttribute(
              "text-anchor",
              "end"
            )

            textoValor.setAttribute(
              "dominant-baseline",
              "middle"
            )

            textoValor.setAttribute(
              "font-family",
              "Arial, Helvetica, sans-serif"
            )

            textoValor.setAttribute(
              "font-size",
              String(tamanhoFonte)
            )

            textoValor.setAttribute(
              "font-weight",
              "700"
            )

            textoValor.setAttribute(
              "fill",
              "#111827"
            )

            textoValor.textContent = valor

            /*
              Fundo da barra
            */
            const fundo =
              documentoClonado.createElementNS(
                svgNS,
                "rect"
              )

            fundo.setAttribute("x", "0")
            fundo.setAttribute(
              "y",
              String(yBarra)
            )

            fundo.setAttribute(
              "width",
              String(largura)
            )

            fundo.setAttribute(
              "height",
              String(alturaBarra)
            )

            fundo.setAttribute(
              "rx",
              String(alturaBarra / 2)
            )

            fundo.setAttribute(
              "fill",
              "#e5e7eb"
            )

            /*
              Parte azul
            */
            const progresso =
              documentoClonado.createElementNS(
                svgNS,
                "rect"
              )

            progresso.setAttribute("x", "0")
            progresso.setAttribute(
              "y",
              String(yBarra)
            )

            progresso.setAttribute(
              "width",
              String(larguraBarra)
            )

            progresso.setAttribute(
              "height",
              String(alturaBarra)
            )

            progresso.setAttribute(
              "rx",
              String(alturaBarra / 2)
            )

            progresso.setAttribute(
              "fill",
              "#2563eb"
            )

            svg.appendChild(textoNome)
            svg.appendChild(textoValor)
            svg.appendChild(fundo)
            svg.appendChild(progresso)

            /*
              Substitui SOMENTE na cópia do PDF.
              A tela original permanece intacta.
            */
            linha.innerHTML = ""
            linha.appendChild(svg)

            linha.style.display = "block"
            linha.style.height = `${altura}px`
            linha.style.minHeight = `${altura}px`
            linha.style.margin = "0"
            linha.style.padding = "0"
            linha.style.overflow = "visible"
            linha.style.breakInside = "avoid"
            linha.style.pageBreakInside = "avoid"
          })

          /*
            Espaçamento entre os SVGs.
          */
          const listas =
            relatorio.querySelectorAll(
              ".report-ranking-list"
            )

          listas.forEach((lista) => {
            lista.style.display = "flex"
            lista.style.flexDirection = "column"
            lista.style.gap =
              resumido ? "3px" : "6px"
          })
        }
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },

      pagebreak: {
        mode: ["css", "legacy"]
      }
    }

    await html2pdf()
      .set(opcoes)
      .from(elemento)
      .save()

  } catch (error) {
    console.error(error)

    alert(
      "Não foi possível gerar o PDF."
    )
  } finally {
    setModoPdf("completo")
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">

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
            variant="secondary"
            onClick={() => gerarPDF("resumido")}
            loading={gerandoPdf}
            disabled={!dados}
          >
            <Download size={17} />
            PDF Resumido
          </Button>

          <Button
            type="button"
            variant="success"
            onClick={() => gerarPDF("completo")}
            loading={gerandoPdf}
            disabled={!dados}
          >
            <Download size={17} />
            PDF Completo
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
          className={
            modoPdf === "resumido"
              ? "report-pdf pdf-resumido"
              : "report-pdf"
          }
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

              <div className="report-ranking-list">
              {(dados.rankingVendedores || [])
                .slice(
                  0,
                  modoPdf === "resumido" ? 6 : 10
                )
                .map((item, index) => (
                  <RankingBar
                    key={item.id || item.nome || index}
                    posicao={index + 1}
                    nome={item.nome}
                    valor={item.chapas}
                    valorMaximo={
                      dados.rankingVendedores?.[0]?.chapas || 1
                    }
                  />
                ))}
            </div>

            </div>


            <div className="report-panel">

              <h3>
                Ranking de Chapas por Dia
              </h3>

              <div className="report-ranking-list">
                {(dados.rankingDias || [])
                  .slice(
                    0,
                    modoPdf === "resumido" ? 6 : 10
                  )
                  .map((item, index) => (
                    <RankingBar
                      key={item.data || index}
                      posicao={index + 1}
                      nome={formatarData(item.data)}
                      valor={item.chapas}
                      valorMaximo={
                        dados.rankingDias?.[0]?.chapas || 1
                      }
                    />
                  ))}
              </div>

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
                  .slice(
                    0,
                    modoPdf === "resumido" ? 5 : undefined
                  )
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

          {modoPdf === "completo" && (
            <div className="page-break" />
          )}

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