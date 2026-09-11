import { prisma } from "../lib/prisma.js"

function criarDataLocal(dataTexto, fimDoDia = false) {
  if (!dataTexto) return null

  const [ano, mes, dia] = dataTexto.split("-").map(Number)

  return new Date(
    ano,
    mes - 1,
    dia,
    fimDoDia ? 23 : 0,
    fimDoDia ? 59 : 0,
    fimDoDia ? 59 : 0,
    fimDoDia ? 999 : 0
  )
}

/*
  =========================================================
  RELATÓRIO DE PRODUÇÃO ATUAL
  NÃO ALTERAR
  =========================================================
*/

export async function relatorioProducao(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      operadorId,
      tipoServicoId,
      status,
      busca,
      page = 1,
      limit = 50
    } = req.query

    const paginaAtual = Number(page) || 1
    const limite = Number(limit) || 50
    const skip = (paginaAtual - 1) * limite

    const where = {}

    if (status) {
      where.status = status
    }

    if (operadorId) {
      where.operadorId = operadorId
    }

    if (tipoServicoId) {
      where.tipoServicoId = tipoServicoId
    }

    const campoData =
      status === "CONCLUIDO"
        ? "dataFim"
        : status === "INICIADO"
          ? "dataInicio"
          : "createdAt"

    if (dataInicio || dataFim) {
      where[campoData] = {}

      if (dataInicio) {
        where[campoData].gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        where[campoData].lte = criarDataLocal(dataFim, true)
      }
    }

    if (busca) {
      where.OR = [
        {
          plano: {
            pedido: {
              cliente: {
                nome: {
                  contains: busca,
                  mode: "insensitive"
                }
              }
            }
          }
        },
        {
          plano: {
            pedido: {
              numeroPedidoManual: {
                contains: busca,
                mode: "insensitive"
              }
            }
          }
        },
        ...(Number(busca)
          ? [
              {
                plano: {
                  pedido: {
                    numeroPedido: Number(busca)
                  }
                }
              }
            ]
          : [])
      ]
    }

    const orderBy =
      campoData === "dataFim"
        ? [{ dataFim: "desc" }]
        : campoData === "dataInicio"
          ? [{ dataInicio: "desc" }]
          : [{ createdAt: "desc" }]

    const [servicos, total, servicosResumo] = await Promise.all([
      prisma.servicoPlano.findMany({
        where,

        include: {
          tipoServico: true,
          operador: true,
          plano: {
            include: {
              pedido: {
                include: {
                  cliente: true
                }
              }
            }
          }
        },

        orderBy,

        skip,
        take: limite
      }),

      prisma.servicoPlano.count({
        where
      }),

      prisma.servicoPlano.findMany({
        where,
        select: {
          status: true,
          dataInicio: true,
          dataFim: true,
          tipoServico: {
            select: {
              id: true,
              nome: true
            }
          },
          operador: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      })
    ])

    return res.json({
      campoData,
      dados: servicos,
      resumo: montarResumo(servicosResumo),

      paginacao: {
        total,
        page: paginaAtual,
        limit: limite,
        totalPages: Math.max(
          1,
          Math.ceil(total / limite)
        )
      }
    })

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de produção"
    })
  }
}


/*
  =========================================================
  NOVO RELATÓRIO MENSAL
  =========================================================

  Este relatório é NOVO.

  Não modifica a função relatorioProducao acima.

  Nesta primeira versão usamos apenas informações cuja
  estrutura já está confirmada neste controller.

  Consumo de chapas será conectado posteriormente à regra
  real do relatório de consumo de chapas existente.
  =========================================================
*/

export async function relatorioProducaoMensal(req, res) {
  try {
    const {
      dataInicio,
      dataFim
    } = req.query

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        error:
          "Informe a data inicial e a data final."
      })
    }

    const inicio =
      criarDataLocal(dataInicio, false)

    const fim =
      criarDataLocal(dataFim, true)


    /*
      =====================================================
      SERVIÇOS DO PERÍODO
      =====================================================

      Para produtividade mensal, consideramos os serviços
      que tiveram alguma movimentação no período:

      - criação
      - início
      - conclusão

      Isso é separado do relatório antigo.
    */

    const servicos =
      await prisma.servicoPlano.findMany({

        where: {
          OR: [
            {
              createdAt: {
                gte: inicio,
                lte: fim
              }
            },

            {
              dataInicio: {
                gte: inicio,
                lte: fim
              }
            },

            {
              dataFim: {
                gte: inicio,
                lte: fim
              }
            }
          ]
        },

        select: {
          id: true,

          status: true,

          createdAt: true,

          dataInicio: true,

          dataFim: true,

          tipoServico: {
            select: {
              id: true,
              nome: true
            }
          },

          operador: {
            select: {
              id: true,
              nome: true
            }
          },

          plano: {
            select: {
              id: true,

              numeroPlano: true,

              quantidadeChapas: true,

              pedido: {
                select: {
                  id: true,

                  numeroPedido: true,

                  numeroPedidoManual: true,

                  origemPedido: true,

                  cliente: {
                    select: {
                      id: true,
                      nome: true
                    }
                  }
                }
              }
            }
          }
        }
      })


    /*
      =====================================================
      PRODUTIVIDADE
      =====================================================
    */

    const resumo =
      montarResumo(servicos)


    /*
      =====================================================
      RANKING DOS OPERADORES
      =====================================================
    */

    const operadoresMap = new Map()

    servicos.forEach((servico) => {

      if (!servico.operador?.id) {
        return
      }

      const operador =
        operadoresMap.get(
          servico.operador.id
        ) || {

          id: servico.operador.id,

          nome:
            servico.operador.nome,

          total: 0,

          abertos: 0,

          emProducao: 0,

          concluidos: 0,

          cancelados: 0
        }


      operador.total += 1


      if (
        servico.status === "ABERTO"
      ) {
        operador.abertos += 1
      }


      if (
        servico.status === "INICIADO"
      ) {
        operador.emProducao += 1
      }


      if (
        servico.status === "CONCLUIDO"
      ) {
        operador.concluidos += 1
      }


      if (
        servico.status === "CANCELADO"
      ) {
        operador.cancelados += 1
      }


      operadoresMap.set(
        servico.operador.id,
        operador
      )
    })


    const rankingOperadores =
      [...operadoresMap.values()]
        .sort(
          (a, b) =>
            b.concluidos -
              a.concluidos ||
            b.total -
              a.total ||
            a.nome.localeCompare(
              b.nome
            )
        )


    /*
      =====================================================
      PEDIDOS / CLIENTES ENVOLVIDOS

      Aqui só contamos IDs únicos.

      NÃO calculamos ainda consumo de chapas porque precisamos
      usar a mesma regra do relatório de consumo existente,
      evitando duplicar chapas quando um plano possui vários
      serviços.
      =====================================================
    */

    const pedidosMap = new Map()

    const clientesMap = new Map()


    servicos.forEach((servico) => {

      const pedido =
        servico.plano?.pedido

      if (pedido?.id) {
        pedidosMap.set(
          pedido.id,
          pedido
        )
      }


      if (pedido?.cliente?.id) {
        clientesMap.set(
          pedido.cliente.id,
          pedido.cliente
        )
      }
    })


    /*
      =====================================================
      TIPOS DE SERVIÇO
      =====================================================
    */

    const servicosPorTipo =
      resumo.porServico.map(
        (item) => ({

          id: item.id,

          nome: item.nome,

          quantidadeServicos:
            item.total,

          abertos:
            item.abertos,

          emProducao:
            item.producao,

          concluidos:
            item.concluidos,

          cancelados:
            item.cancelados,

          tempoMedio:
            item.tempoMedio
        })
      )


    /*
      =====================================================
      RESPOSTA

      Os campos relacionados a chapas ficam presentes para
      não quebrar o frontend.

      Porém ainda NÃO estamos calculando esses números aqui,
      pois precisamos reaproveitar a regra real do relatório
      Consumo de Chapas.
      =====================================================
    */

    return res.json({

      periodo: {
        dataInicio,
        dataFim
      },


      chapas: {

        /*
          SERÁ PREENCHIDO COM A REGRA REAL
          DO RELATÓRIO DE CONSUMO DE CHAPAS.
        */

        totalChapas: 0,

        producao: 0,

        chapasInteiras: 0,

        pedidos:
          pedidosMap.size,

        clientes:
          clientesMap.size,

        mediaPorPedido: 0
      },


      destaques: {

        /*
          Vendedor depende da estrutura real
          do relatório de consumo.
        */

        vendedor: null,

        maiorConsumo: null,


        /*
          Enquanto isso conseguimos informar
          o serviço mais executado.
        */

        servico:
          resumo.servicoMaisExecutado
            ? {
                id:
                  resumo.servicoMaisExecutado.id,

                nome:
                  resumo.servicoMaisExecutado.nome,

                quantidade:
                  resumo.servicoMaisExecutado.total
              }
            : null
      },


      /*
        Também serão preenchidos posteriormente
        usando o mesmo cálculo do relatório
        de consumo de chapas.
      */

      rankingVendedores: [],

      rankingDias: [],


      /*
        Por enquanto apresentamos os serviços
        pela quantidade executada.

        Depois acrescentaremos chapas e metros
        usando a regra original.
      */

      consumoPorServico:
        servicosPorTipo,


      /*
        ===================================================
        PRODUTIVIDADE
        ===================================================
      */

      produtividade: {

        totalServicos:
          resumo.total,

        operadores:
          resumo.operadoresEnvolvidos,

        abertos:
          resumo.abertos,

        emProducao:
          resumo.iniciados,

        concluidos:
          resumo.concluidos,

        cancelados:
          resumo.cancelados,

        tempoMedio:
          resumo.tempoMedio,

        melhorOperador:
          resumo.operadorDestaque
      },


      rankingOperadores
    })

  } catch (error) {

    console.error(
      "Erro ao gerar relatório mensal de produção:",
      error
    )

    return res.status(500).json({
      error:
        "Erro ao gerar relatório mensal de produção"
    })
  }
}



/*
  =========================================================
  FUNÇÕES AUXILIARES EXISTENTES
  =========================================================
*/

function calcularDuracaoMinutos(inicio, fim) {
  if (!inicio || !fim) return 0

  const diferenca =
    new Date(fim) -
    new Date(inicio)

  return diferenca > 0
    ? Math.round(
        diferenca / 60000
      )
    : 0
}


function montarResumo(servicos) {
  const hoje = new Date()

  hoje.setHours(
    0,
    0,
    0,
    0
  )

  const amanha =
    new Date(hoje)

  amanha.setDate(
    amanha.getDate() + 1
  )


  const porServicoMap =
    new Map()

  const porOperadorMap =
    new Map()

  let tempoTotal = 0

  let concluidosComTempo = 0


  servicos.forEach(
    (servico) => {

      const tipoId =
        servico.tipoServico?.id ||
        "sem-tipo"


      const itemTipo =
        porServicoMap.get(
          tipoId
        ) || {

          id: tipoId,

          nome:
            servico.tipoServico?.nome ||
            "Sem tipo",

          total: 0,

          abertos: 0,

          producao: 0,

          concluidos: 0,

          cancelados: 0,

          tempoTotal: 0,

          concluidosComTempo: 0
        }


      itemTipo.total += 1


      if (
        servico.status ===
        "ABERTO"
      ) {
        itemTipo.abertos += 1
      }


      if (
        servico.status ===
        "INICIADO"
      ) {
        itemTipo.producao += 1
      }


      if (
        servico.status ===
        "CONCLUIDO"
      ) {
        itemTipo.concluidos += 1
      }


      if (
        servico.status ===
        "CANCELADO"
      ) {
        itemTipo.cancelados += 1
      }


      const duracao =
        servico.status ===
        "CONCLUIDO"
          ? calcularDuracaoMinutos(
              servico.dataInicio,
              servico.dataFim
            )
          : 0


      if (duracao > 0) {

        itemTipo.tempoTotal +=
          duracao

        itemTipo.concluidosComTempo +=
          1

        tempoTotal +=
          duracao

        concluidosComTempo +=
          1
      }


      porServicoMap.set(
        tipoId,
        itemTipo
      )


      if (
        servico.operador?.id
      ) {

        const operador =
          porOperadorMap.get(
            servico.operador.id
          ) || {

            id:
              servico.operador.id,

            nome:
              servico.operador.nome,

            concluidos: 0
          }


        if (
          servico.status ===
          "CONCLUIDO"
        ) {
          operador.concluidos +=
            1
        }


        porOperadorMap.set(
          servico.operador.id,
          operador
        )
      }
    }
  )


  const porServico =
    [...porServicoMap.values()]
      .map(
        ({
          tempoTotal:
            totalTempo,

          concluidosComTempo:
            totalComTempo,

          ...item
        }) => ({

          ...item,

          tempoMedio:
            totalComTempo > 0
              ? Math.round(
                  totalTempo /
                    totalComTempo
                )
              : 0
        })
      )
      .sort(
        (a, b) =>
          b.total -
            a.total ||
          a.nome.localeCompare(
            b.nome
          )
      )


  const operadores =
    [...porOperadorMap.values()]


  const operadorDestaque =
    operadores
      .filter(
        (item) =>
          item.concluidos > 0
      )
      .sort(
        (a, b) =>
          b.concluidos -
            a.concluidos ||
          a.nome.localeCompare(
            b.nome
          )
      )[0] || null


  return {

    total:
      servicos.length,

    abertos:
      servicos.filter(
        (item) =>
          item.status ===
          "ABERTO"
      ).length,

    iniciados:
      servicos.filter(
        (item) =>
          item.status ===
          "INICIADO"
      ).length,

    concluidos:
      servicos.filter(
        (item) =>
          item.status ===
          "CONCLUIDO"
      ).length,

    cancelados:
      servicos.filter(
        (item) =>
          item.status ===
          "CANCELADO"
      ).length,

    producaoHoje:
      servicos.filter(
        (item) =>
          item.status ===
            "CONCLUIDO" &&
          item.dataFim >=
            hoje &&
          item.dataFim <
            amanha
      ).length,

    tempoMedio:
      concluidosComTempo > 0
        ? Math.round(
            tempoTotal /
              concluidosComTempo
          )
        : 0,

    operadoresEnvolvidos:
      operadores.length,

    porServico,

    servicoMaisExecutado:
      porServico[0] || null,

    operadorDestaque
  }
}