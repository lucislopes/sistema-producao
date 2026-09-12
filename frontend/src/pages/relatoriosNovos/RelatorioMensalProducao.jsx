import { useEffect, useMemo, useRef, useState } from "react"
import html2pdf from "html2pdf.js"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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

function desenharCabecalhoPdf(
  doc,
  dataInicio,
  dataFim,
  titulo = "Relatório de Produção"
) {
  doc.setTextColor(17, 24, 39)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)

  doc.text(titulo, 12, 15)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)

  doc.text(
    `Período de ${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    12,
    21
  )

  doc.setFillColor(29, 78, 216)
  doc.roundedRect(
    165,
    8,
    32,
    13,
    2,
    2,
    "F"
  )

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)

  doc.text(
    "Produção",
    181,
    16,
    {
      align: "center"
    }
  )

  doc.setDrawColor(29, 78, 216)
  doc.setLineWidth(0.5)

  doc.line(
    12,
    25,
    198,
    25
  )

  doc.setTextColor(17, 24, 39)
}


function tituloSecaoPdf(
  doc,
  titulo,
  y
) {
  doc.setFont(
    "helvetica",
    "bold"
  )

  doc.setFontSize(12)

  doc.setTextColor(
    17,
    24,
    39
  )

  doc.text(
    titulo,
    12,
    y
  )

  return y + 5
}


function cardPdf(
  doc,
  {
    x,
    y,
    largura,
    altura,
    titulo,
    valor,
    subtitulo = ""
  }
) {
  doc.setFillColor(
    249,
    250,
    251
  )

  doc.setDrawColor(
    209,
    213,
    219
  )

  doc.setLineWidth(0.25)

  doc.roundedRect(
    x,
    y,
    largura,
    altura,
    2,
    2,
    "FD"
  )

  doc.setFont(
    "helvetica",
    "normal"
  )

  doc.setFontSize(6.5)

  doc.setTextColor(
    107,
    114,
    128
  )

  doc.text(
    String(titulo),
    x + 3,
    y + 5
  )

  doc.setFont(
    "helvetica",
    "bold"
  )

  doc.setFontSize(11)

  doc.setTextColor(
    17,
    24,
    39
  )

  const valorTexto =
    String(
      valor ?? "-"
    )

  doc.text(
    valorTexto,
    x + 3,
    y + 12
  )

  if (subtitulo) {
    doc.setFont(
      "helvetica",
      "normal"
    )

    doc.setFontSize(6)

    doc.setTextColor(
      107,
      114,
      128
    )

    doc.text(
      String(subtitulo),
      x + 3,
      y + altura - 3
    )
  }
}


function desenharCardsPdf(
  doc,
  cards,
  y,
  {
    altura = 22,
    gap = 3
  } = {}
) {
  const margem = 12
  const larguraUtil = 186

  const largura =
    (
      larguraUtil -
      gap * 2
    ) / 3

  cards.forEach(
    (card, index) => {
      const coluna =
        index % 3

      const linha =
        Math.floor(
          index / 3
        )

      cardPdf(
        doc,
        {
          x:
            margem +
            coluna *
              (
                largura +
                gap
              ),

          y:
            y +
            linha *
              (
                altura +
                gap
              ),

          largura,

          altura,

          ...card
        }
      )
    }
  )

  const linhas =
    Math.ceil(
      cards.length / 3
    )

  return (
    y +
    linhas *
      (
        altura +
        gap
      )
  )
}


function desenharRankingPdf(
  doc,
  {
    titulo,
    itens,
    x,
    y,
    largura,
    obterNome,
    obterValor,
    limite = 10,
    compacto = false
  }
) {
  const lista =
    (itens || [])
      .slice(0, limite)

  doc.setFont(
    "helvetica",
    "bold"
  )

  doc.setFontSize(
    compacto ? 7.5 : 9
  )

  doc.setTextColor(
    17,
    24,
    39
  )

  doc.text(
    titulo,
    x,
    y
  )

  let atualY =
    y +
    (
      compacto ? 5 : 7
    )

  const maior =
    Math.max(
      ...lista.map(
        (item) =>
          Number(
            obterValor(item) ||
            0
          )
      ),
      1
    )

  lista.forEach(
    (item, index) => {
      const nome =
        String(
          obterNome(item) ||
          "-"
        )

      const valor =
        Number(
          obterValor(item) ||
          0
        )

      doc.setFont(
        "helvetica",
        "normal"
      )

      doc.setFontSize(
        compacto ? 5.5 : 7
      )

      doc.setTextColor(
        17,
        24,
        39
      )

      const nomeLimpo =
        `${index + 1}º ${nome}`

      doc.text(
        nomeLimpo,
        x,
        atualY
      )

      doc.setFont(
        "helvetica",
        "bold"
      )

      doc.text(
        formatarNumero(valor),
        x + largura,
        atualY,
        {
          align: "right"
        }
      )

      atualY +=
        compacto
          ? 2.2
          : 3

      const alturaBarra =
        compacto
          ? 1.5
          : 2

      doc.setFillColor(
        229,
        231,
        235
      )

      doc.roundedRect(
        x,
        atualY,
        largura,
        alturaBarra,
        alturaBarra / 2,
        alturaBarra / 2,
        "F"
      )

      const larguraAzul =
        Math.max(
          1,
          largura *
            (
              valor /
              maior
            )
        )

      doc.setFillColor(
        37,
        99,
        235
      )

      doc.roundedRect(
        x,
        atualY,
        larguraAzul,
        alturaBarra,
        alturaBarra / 2,
        alturaBarra / 2,
        "F"
      )

      atualY +=
        compacto
          ? 5.2
          : 7
    }
  )

  return atualY
}


function rodapePdf(doc) {
  const paginas =
    doc.getNumberOfPages()

  for (
    let pagina = 1;
    pagina <= paginas;
    pagina += 1
  ) {
    doc.setPage(pagina)

    doc.setDrawColor(
      229,
      231,
      235
    )

    doc.line(
      12,
      286,
      198,
      286
    )

    doc.setFont(
      "helvetica",
      "normal"
    )

    doc.setFontSize(6)

    doc.setTextColor(
      107,
      114,
      128
    )

    doc.text(
      "Relatório gerado pelo Sistema de Produção",
      105,
      291,
      {
        align: "center"
      }
    )

    doc.text(
      `Página ${pagina} de ${paginas}`,
      198,
      291,
      {
        align: "right"
      }
    )
  }
}



export function RelatorioMensalProducao() {

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
  if (!dados) return

  try {
    setGerandoPdf(true)

    const resumido =
      tipo === "resumido"

    const doc =
      new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })

    /*
      =====================================================
      PDF RESUMIDO
      =====================================================
    */

    if (resumido) {
      desenharCabecalhoPdf(
        doc,
        dataInicio,
        dataFim,
        "Relatório Resumido de Produção"
      )

      let y = 33

      y =
        tituloSecaoPdf(
          doc,
          "Consumo de Chapas",
          y
        )

      y =
        desenharCardsPdf(
          doc,
          [
            {
              titulo:
                "Total de Chapas",
              valor:
                formatarNumero(
                  dados.chapas
                    ?.totalChapas
                )
            },
            {
              titulo:
                "Produção",
              valor:
                formatarNumero(
                  dados.chapas
                    ?.producao
                )
            },
            {
              titulo:
                "Chapas Inteiras",
              valor:
                formatarNumero(
                  dados.chapas
                    ?.chapasInteiras
                )
            },
            {
              titulo:
                "Pedidos",
              valor:
                formatarNumero(
                  dados.chapas
                    ?.pedidos
                )
            },
            {
              titulo:
                "Clientes",
              valor:
                formatarNumero(
                  dados.chapas
                    ?.clientes
                )
            },
            {
              titulo:
                "Média / Pedido",
              valor:
                formatarNumero(
                  dados.chapas
                    ?.mediaPorPedido,
                  2
                )
            }
          ],
          y,
          {
            altura: 16,
            gap: 2
          }
        )

      y += 2

      y =
        desenharCardsPdf(
          doc,
          [
            {
              titulo:
                "Vendedor destaque",

              valor:
                dados.destaques
                  ?.vendedor
                  ?.nome ||
                "-",

              subtitulo:
                dados.destaques
                  ?.vendedor
                  ? `${formatarNumero(
                      dados.destaques
                        .vendedor
                        .chapas
                    )} chapas`
                  : ""
            },

            {
              titulo:
                "Dia de maior consumo",

              valor:
                formatarData(
                  dados.destaques
                    ?.maiorConsumo
                    ?.data
                ),

              subtitulo:
                dados.destaques
                  ?.maiorConsumo
                  ? `${formatarNumero(
                      dados.destaques
                        .maiorConsumo
                        .chapas
                    )} chapas`
                  : ""
            },

            {
              titulo:
                "Serviço mais consumido",

              valor:
                dados.destaques
                  ?.servico
                  ?.nome ||
                "-",

              subtitulo:
                dados.destaques
                  ?.servico
                  ? `${formatarNumero(
                      dados.destaques
                        .servico
                        .chapas
                    )} chapas`
                  : ""
            }
          ],
          y,
          {
            altura: 16,
            gap: 2
          }
        )

      y += 3

      const yVendedores =
        desenharRankingPdf(
          doc,
          {
            titulo:
              "Ranking de Chapas por Vendedor",

            itens:
              dados.rankingVendedores,

            x: 12,

            y,

            largura: 87,

            obterNome:
              (item) =>
                item.nome,

            obterValor:
              (item) =>
                item.chapas,

            limite: 6,

            compacto: true
          }
        )

      const yDias =
        desenharRankingPdf(
          doc,
          {
            titulo:
              "Ranking de Chapas por Dia",

            itens:
              dados.rankingDias,

            x: 111,

            y,

            largura: 87,

            obterNome:
              (item) =>
                formatarData(
                  item.data
                ),

            obterValor:
              (item) =>
                item.chapas,

            limite: 6,

            compacto: true
          }
        )

      y =
        Math.max(
          yVendedores,
          yDias
        ) + 2

      /*
        Consumo por serviço
      */

      doc.setFont(
        "helvetica",
        "bold"
      )

      doc.setFontSize(8)

      doc.text(
        "Consumo por Tipo de Serviço",
        12,
        y
      )

      autoTable(
        doc,
        {
          startY: y + 3,

          margin: {
            left: 12,
            right: 12
          },

          head: [[
            "Serviço",
            "Qtde Serviços",
            "Chapas",
            "Metros"
          ]],

          body:
            (
              dados
                .consumoPorServico ||
              []
            )
              .slice(0, 5)
              .map(
                (item) => [
                  item.nome,

                  formatarNumero(
                    item
                      .quantidadeServicos
                  ),

                  formatarNumero(
                    item.chapas
                  ),

                  formatarNumero(
                    item.metros,
                    2
                  )
                ]
              ),

          styles: {
            fontSize: 5.5,
            cellPadding: 1.3,
            textColor: [
              17,
              24,
              39
            ]
          },

          headStyles: {
            fillColor: [
              243,
              244,
              246
            ],

            textColor: [
              17,
              24,
              39
            ],

            fontStyle:
              "bold"
          },

          theme:
            "grid"
        }
      )

      y =
        doc.lastAutoTable
          .finalY +
        5

      y =
        tituloSecaoPdf(
          doc,
          "Produtividade",
          y
        )

      y =
        desenharCardsPdf(
          doc,
          [
            {
              titulo:
                "Total Serviços",

              valor:
                formatarNumero(
                  dados.produtividade
                    ?.totalServicos
                )
            },

            {
              titulo:
                "Operadores",

              valor:
                formatarNumero(
                  dados.produtividade
                    ?.operadores
                )
            },

            {
              titulo:
                "Em Produção",

              valor:
                formatarNumero(
                  dados.produtividade
                    ?.emProducao
                )
            },

            {
              titulo:
                "Concluídos",

              valor:
                formatarNumero(
                  dados.produtividade
                    ?.concluidos
                )
            },

            {
              titulo:
                "Cancelados",

              valor:
                formatarNumero(
                  dados.produtividade
                    ?.cancelados
                )
            },

            {
              titulo:
                "Melhor Operador",

              valor:
                dados.produtividade
                  ?.melhorOperador
                  ?.nome ||
                "-"
            }
          ],
          y,
          {
            altura: 15,
            gap: 2
          }
        )

      y += 2

      autoTable(
        doc,
        {
          startY: y,

          margin: {
            left: 12,
            right: 12
          },

          head: [[
            "#",
            "Operador",
            "Total",
            "Em Produção",
            "Concluídos",
            "Cancelados",
            "%"
          ]],

          body:
            (
              dados
                .rankingOperadores ||
              []
            )
              .slice(0, 8)
              .map(
                (
                  item,
                  index
                ) => [
                  `${index + 1}º`,

                  item.nome,

                  formatarNumero(
                    item.total
                  ),

                  formatarNumero(
                    item.emProducao
                  ),

                  formatarNumero(
                    item.concluidos
                  ),

                  formatarNumero(
                    item.cancelados
                  ),

                  `${formatarNumero(
                    item.taxaConclusao,
                    0
                  )}%`
                ]
              ),

          styles: {
            fontSize: 5,
            cellPadding: 1.1
          },

          headStyles: {
            fillColor: [
              243,
              244,
              246
            ],

            textColor: [
              17,
              24,
              39
            ],

            fontStyle:
              "bold"
          },

          theme:
            "grid"
        }
      )

      rodapePdf(doc)

      doc.save(
        `producao-resumido-${dataInicio}-${dataFim}.pdf`
      )

      return
    }


    /*
      =====================================================
      PDF COMPLETO
      PÁGINA 1 — CONSUMO DE CHAPAS
      =====================================================
    */

    desenharCabecalhoPdf(
      doc,
      dataInicio,
      dataFim
    )

    let y = 33

    y =
      tituloSecaoPdf(
        doc,
        "Consumo de Chapas",
        y
      )

    y =
      desenharCardsPdf(
        doc,
        [
          {
            titulo:
              "Total de Chapas",

            valor:
              formatarNumero(
                dados.chapas
                  ?.totalChapas
              )
          },

          {
            titulo:
              "Produção",

            valor:
              formatarNumero(
                dados.chapas
                  ?.producao
              )
          },

          {
            titulo:
              "Chapas Inteiras",

            valor:
              formatarNumero(
                dados.chapas
                  ?.chapasInteiras
              )
          },

          {
            titulo:
              "Pedidos",

            valor:
              formatarNumero(
                dados.chapas
                  ?.pedidos
              )
          },

          {
            titulo:
              "Clientes",

            valor:
              formatarNumero(
                dados.chapas
                  ?.clientes
              )
          },

          {
            titulo:
              "Média / Pedido",

            valor:
              formatarNumero(
                dados.chapas
                  ?.mediaPorPedido,
                2
              )
          }
        ],
        y
      )

    y += 2

    y =
      desenharCardsPdf(
        doc,
        [
          {
            titulo:
              "Vendedor destaque",

            valor:
              dados.destaques
                ?.vendedor
                ?.nome ||
              "-",

            subtitulo:
              dados.destaques
                ?.vendedor
                ? `${formatarNumero(
                    dados.destaques
                      .vendedor
                      .chapas
                  )} chapas`
                : ""
          },

          {
            titulo:
              "Dia de maior consumo",

            valor:
              formatarData(
                dados.destaques
                  ?.maiorConsumo
                  ?.data
              ),

            subtitulo:
              dados.destaques
                ?.maiorConsumo
                ? `${formatarNumero(
                    dados.destaques
                      .maiorConsumo
                      .chapas
                  )} chapas`
                : ""
          },

          {
            titulo:
              "Serviço mais consumido",

            valor:
              dados.destaques
                ?.servico
                ?.nome ||
              "-",

            subtitulo:
              dados.destaques
                ?.servico
                ? `${formatarNumero(
                    dados.destaques
                      .servico
                      .chapas
                  )} chapas`
                : ""
          }
        ],
        y
      )

    y += 5

    const yRankingVendedores =
      desenharRankingPdf(
        doc,
        {
          titulo:
            "Ranking de Chapas por Vendedor",

          itens:
            dados.rankingVendedores,

          x: 12,

          y,

          largura: 87,

          obterNome:
            (item) =>
              item.nome,

          obterValor:
            (item) =>
              item.chapas,

          limite: 10
        }
      )

    const yRankingDias =
      desenharRankingPdf(
        doc,
        {
          titulo:
            "Ranking de Chapas por Dia",

          itens:
            dados.rankingDias,

          x: 111,

          y,

          largura: 87,

          obterNome:
            (item) =>
              formatarData(
                item.data
              ),

          obterValor:
            (item) =>
              item.chapas,

          limite: 10
        }
      )

    y =
      Math.max(
        yRankingVendedores,
        yRankingDias
      ) + 4

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(9)

    doc.text(
      "Consumo por Tipo de Serviço",
      12,
      y
    )

    autoTable(
      doc,
      {
        startY:
          y + 4,

        margin: {
          left: 12,
          right: 12
        },

        head: [[
          "Serviço",
          "Qtde Serviços",
          "Chapas",
          "Metros"
        ]],

        body:
          (
            dados
              .consumoPorServico ||
            []
          )
            .map(
              (item) => [
                item.nome,

                formatarNumero(
                  item
                    .quantidadeServicos
                ),

                formatarNumero(
                  item.chapas
                ),

                formatarNumero(
                  item.metros,
                  2
                )
              ]
            ),

        styles: {
          fontSize: 7,
          cellPadding: 2
        },

        headStyles: {
          fillColor: [
            243,
            244,
            246
          ],

          textColor: [
            17,
            24,
            39
          ],

          fontStyle:
            "bold"
        },

        theme:
          "grid"
      }
    )


    /*
      =====================================================
      PÁGINA 2 — PRODUTIVIDADE
      =====================================================
    */

    doc.addPage()

    desenharCabecalhoPdf(
      doc,
      dataInicio,
      dataFim
    )

    y = 33

    y =
      tituloSecaoPdf(
        doc,
        "Produtividade",
        y
      )

    y =
      desenharCardsPdf(
        doc,
        [
          {
            titulo:
              "Total Serviços",

            valor:
              formatarNumero(
                dados.produtividade
                  ?.totalServicos
              )
          },

          {
            titulo:
              "Operadores",

            valor:
              formatarNumero(
                dados.produtividade
                  ?.operadores
              )
          },

          {
            titulo:
              "Em Produção",

            valor:
              formatarNumero(
                dados.produtividade
                  ?.emProducao
              )
          },

          {
            titulo:
              "Concluídos",

            valor:
              formatarNumero(
                dados.produtividade
                  ?.concluidos
              )
          },

          {
            titulo:
              "Cancelados",

            valor:
              formatarNumero(
                dados.produtividade
                  ?.cancelados
              )
          },

          {
            titulo:
              "Melhor Operador",

            valor:
              dados.produtividade
                ?.melhorOperador
                ?.nome ||
              "-"
          }
        ],
        y
      )

    y += 5

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(10)

    doc.text(
      "Ranking de Operadores",
      12,
      y
    )

    autoTable(
      doc,
      {
        startY:
          y + 4,

        margin: {
          left: 12,
          right: 12
        },

        head: [[
          "#",
          "Operador",
          "Total",
          "Em Produção",
          "Concluídos",
          "Cancelados",
          "% conclusão"
        ]],

        body:
          (
            dados
              .rankingOperadores ||
            []
          )
            .map(
              (
                item,
                index
              ) => [
                `${index + 1}º`,

                item.nome,

                formatarNumero(
                  item.total
                ),

                formatarNumero(
                  item.emProducao
                ),

                formatarNumero(
                  item.concluidos
                ),

                formatarNumero(
                  item.cancelados
                ),

                `${formatarNumero(
                  item.taxaConclusao,
                  0
                )}%`
              ]
            ),

        styles: {
          fontSize: 7,
          cellPadding: 2
        },

        headStyles: {
          fillColor: [
            243,
            244,
            246
          ],

          textColor: [
            17,
            24,
            39
          ],

          fontStyle:
            "bold"
        },

        theme:
          "grid"
      }
    )

    rodapePdf(doc)

    doc.save(
      `producao-${dataInicio}-${dataFim}.pdf`
    )

  } catch (error) {
    console.error(
      "Erro ao gerar PDF:",
      error
    )

    alert(
      "Não foi possível gerar o PDF."
    )
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

        <div className="report-pdf">

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