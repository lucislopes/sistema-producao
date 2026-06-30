import { prisma } from "../lib/prisma.js"

function criarDataLocal(data, fimDoDia = false) {
  if (!data) return null

  const [ano, mes, dia] = data.split("-").map(Number)

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

function converterNumero(valor) {
  const numero = Number(
    String(valor || "0")
      .replace(",", ".")
      .replace(/[^0-9.]/g, "")
  )

  return Number.isNaN(numero) ? 0 : numero
}

function montarPorOperador(servicos) {
  const map = {}

  servicos.forEach((servico) => {
    const operadorId = servico.operadorId || "sem-operador"
    const nome = servico.operador?.nome || "Sem operador"
    const plano = servico.plano
    const nomeServico = servico.tipoServico?.nome || ""

    if (!map[operadorId]) {
      map[operadorId] = {
        operadorId,
        nome,
        quantidadeServicos: 0,
        chapas: 0,
        metrosEncabecamento: 0
      }
    }

    map[operadorId].quantidadeServicos += 1
    map[operadorId].chapas += Number(plano?.quantidadeChapas || 0)

    if (nomeServico.toLowerCase().includes("encabe")) {
      map[operadorId].metrosEncabecamento += converterNumero(
        plano?.medidaEncabecamento
      )
    }
  })

  return Object.values(map).sort((a, b) => b.chapas - a.chapas)
}

function formatarPedidoConsumo(pedido) {
  const chapasProducao = pedido.planos.reduce(
    (total, plano) => total + Number(plano.quantidadeChapas || 0),
    0
  )

  const chapasDiretoEntrega = Number(
    pedido.quantidadeChapasDiretoEntrega || 0
  )

  const totalChapas =
    pedido.tipoPedido === "DIRETO_ENTREGA"
      ? chapasDiretoEntrega
      : chapasProducao

  return {
    id: pedido.id,
    numeroPedido: pedido.numeroPedido,
    numeroPedidoManual: pedido.numeroPedidoManual,
    origemPedido: pedido.origemPedido,
    dataPedido: pedido.dataPedido,
    dataEntrega: pedido.dataEntrega,
    dataReferencia: pedido.dataPedido,
    status: pedido.status,
    tipoPedido: pedido.tipoPedido,
    cliente: pedido.cliente,
    vendedor: pedido.vendedor,
    totalChapas
  }
}

function montarResumoPorTipoServico(servicos) {
  const map = {}

  servicos.forEach((servico) => {
    const plano = servico.plano
    const tipoId = servico.tipoServicoId || "sem-tipo"
    const nome = servico.tipoServico?.nome || "Sem tipo"

    if (!map[tipoId]) {
      map[tipoId] = {
        tipoServicoId: tipoId,
        nome,
        quantidadeServicos: 0,
        chapas: 0,
        metrosEncabecamento: 0
      }
    }

    map[tipoId].quantidadeServicos += 1
    map[tipoId].chapas += Number(plano?.quantidadeChapas || 0)

    if (nome.toLowerCase().includes("encabe")) {
      map[tipoId].metrosEncabecamento += converterNumero(
        plano?.medidaEncabecamento
      )
    }
  })

  return Object.values(map).sort((a, b) => b.chapas - a.chapas)
}

function montarResumoGeral(dados, porTipoServico) {
  const totalChapas = dados.reduce(
    (total, item) => total + Number(item.totalChapas || 0),
    0
  )

  const totalProducao = dados
    .filter((item) => item.tipoPedido === "COM_PRODUCAO")
    .reduce((total, item) => total + Number(item.totalChapas || 0), 0)

  const totalChapaInteira = dados
    .filter((item) => item.tipoPedido === "DIRETO_ENTREGA")
    .reduce((total, item) => total + Number(item.totalChapas || 0), 0)

  const clientesAtendidos = new Set(
    dados.map((item) => item.cliente?.id).filter(Boolean)
  ).size

  const pedidosComChapas = dados.filter(
    (item) => Number(item.totalChapas || 0) > 0
  )

  const mediaPorPedido =
    pedidosComChapas.length > 0
      ? totalChapas / pedidosComChapas.length
      : 0

  const totalServicosConcluidos = porTipoServico.reduce(
    (total, item) => total + Number(item.quantidadeServicos || 0),
    0
  )

  const totalMetrosEncabecamento = porTipoServico.reduce(
    (total, item) => total + Number(item.metrosEncabecamento || 0),
    0
  )

  return {
    totalChapas,
    totalProducao,
    totalChapaInteira,
    totalPedidos: dados.length,
    clientesAtendidos,
    mediaPorPedido,
    totalServicosConcluidos,
    totalMetrosEncabecamento
  }
}

function montarPorVendedor(dados) {
  const map = {}

  dados.forEach((item) => {
    const nome = item.vendedor?.nome || "Sem vendedor"

    if (!map[nome]) {
      map[nome] = 0
    }

    map[nome] += Number(item.totalChapas || 0)
  })

  return Object.entries(map)
    .map(([nome, chapas]) => ({ nome, chapas }))
    .sort((a, b) => b.chapas - a.chapas)
}

function montarPorDia(dados) {
  const map = {}

  dados.forEach((item) => {
    const dataBase = item.dataReferencia || item.dataPedido
    if (!dataBase) return

    const dia = dataBase.toISOString().substring(0, 10)

    if (!map[dia]) {
      map[dia] = 0
    }

    map[dia] += Number(item.totalChapas || 0)
  })

  return Object.entries(map).map(([data, chapas]) => ({
    data,
    chapas
  }))
}

async function gerarPorDataPedido({
  wherePedido,
  includePedido,
  skip,
  limite,
  paginaAtual
}) {
  const [pedidosResumo, pedidosPagina, totalRegistros] = await Promise.all([
    prisma.pedido.findMany({
      where: wherePedido,
      include: includePedido,
      orderBy: {
        dataPedido: "asc"
      }
    }),

    prisma.pedido.findMany({
      where: wherePedido,
      include: includePedido,
      orderBy: {
        dataPedido: "asc"
      },
      skip,
      take: limite
    }),

    prisma.pedido.count({
      where: wherePedido
    })
  ])

  const dadosResumo = pedidosResumo.map(formatarPedidoConsumo)
  const dados = pedidosPagina.map(formatarPedidoConsumo)

  const servicosResumo = []

  pedidosResumo.forEach((pedido) => {
    pedido.planos?.forEach((plano) => {
      plano.servicos?.forEach((servico) => {
        if (servico.status === "CONCLUIDO") {
          servicosResumo.push({
            ...servico,
            plano
          })
        }
      })
    })
  })

  const porTipoServico = montarResumoPorTipoServico(servicosResumo)

  return {
    dados,
    resumo: montarResumoGeral(dadosResumo, porTipoServico),
    porVendedor: montarPorVendedor(dadosResumo),
    porDia: montarPorDia(dadosResumo),
    porTipoServico,
    porOperador: montarPorOperador(servicosResumo),
    paginacao: {
      total: totalRegistros,
      page: paginaAtual,
      limit: limite,
      totalPages: Math.ceil(totalRegistros / limite)
    }
  }
}

async function gerarPorDataProducao({
  dataInicio,
  dataFim,
  vendedorId,
  clienteId,
  tipoPedido,
  skip,
  limite,
  paginaAtual
}) {
  const whereServico = {
    status: "CONCLUIDO",
    dataFim: {},
    plano: {
      pedido: {
        status: {
          not: "CANCELADO"
        }
      }
    }
  }

  if (dataInicio) {
    whereServico.dataFim.gte = criarDataLocal(dataInicio, false)
  }

  if (dataFim) {
    whereServico.dataFim.lte = criarDataLocal(dataFim, true)
  }

  if (!dataInicio && !dataFim) {
    delete whereServico.dataFim
  }

  if (vendedorId) {
    whereServico.plano.pedido.vendedorId = vendedorId
  }

  if (clienteId) {
    whereServico.plano.pedido.clienteId = clienteId
  }

  if (tipoPedido) {
    whereServico.plano.pedido.tipoPedido = tipoPedido
  }

  const includeServico = {
    tipoServico: true,
    operador: true,
    plano: {
      include: {
        pedido: {
          include: {
            cliente: true,
            vendedor: true
          }
        }
      }
    }
  }

  const [servicosResumo, servicosPagina, totalRegistros] = await Promise.all([
    prisma.servicoPlano.findMany({
      where: whereServico,
      include: includeServico,
      orderBy: {
        dataFim: "asc"
      }
    }),

    prisma.servicoPlano.findMany({
      where: whereServico,
      include: includeServico,
      orderBy: {
        dataFim: "asc"
      },
      skip,
      take: limite
    }),

    prisma.servicoPlano.count({
      where: whereServico
    })
  ])

  function formatarServicoConsumo(servico) {
    const pedido = servico.plano.pedido

    return {
      id: servico.id,
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido,
      numeroPedidoManual: pedido.numeroPedidoManual,
      origemPedido: pedido.origemPedido,
      dataPedido: pedido.dataPedido,
      dataEntrega: pedido.dataEntrega,
      dataReferencia: servico.dataFim,
      status: pedido.status,
      tipoPedido: pedido.tipoPedido,
      cliente: pedido.cliente,
      vendedor: pedido.vendedor,
      operador: servico.operador,
      operadorId: servico.operadorId,
      tipoServico: servico.tipoServico,
      numeroPlano: servico.plano.numeroPlano,
      totalChapas: Number(servico.plano.quantidadeChapas || 0)
    }
  }

  const dadosResumo = servicosResumo.map(formatarServicoConsumo)
  const dados = servicosPagina.map(formatarServicoConsumo)

  const porTipoServico = montarResumoPorTipoServico(servicosResumo)
  const porOperador = montarPorOperador(servicosResumo)

  console.log("DEBUG PRODUÇÃO - TOTAL SERVIÇOS:", servicosResumo.length)
  console.log(
    "DEBUG PRODUÇÃO - OPERADORES:",
    servicosResumo.map((s) => ({
      servicoId: s.id,
      operadorId: s.operadorId,
      operador: s.operador?.nome,
      tipoServico: s.tipoServico?.nome,
      dataFim: s.dataFim,
      status: s.status
    }))
  )
  console.log("DEBUG PRODUÇÃO - POR OPERADOR:", porOperador)

  return {
    dados,
    resumo: montarResumoGeral(dadosResumo, porTipoServico),
    porVendedor: montarPorVendedor(dadosResumo),
    porDia: montarPorDia(dadosResumo),
    porTipoServico,
    porOperador,
    paginacao: {
      total: totalRegistros,
      page: paginaAtual,
      limit: limite,
      totalPages: Math.ceil(totalRegistros / limite)
    }
  }
}

export async function relatorioConsumoChapas(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      vendedorId,
      clienteId,
      tipoPedido,
      baseData = "pedido",
      page = 1,
      limit = 50
    } = req.query

    const paginaAtual = Number(page) || 1
    const limite = Number(limit) || 50
    const skip = (paginaAtual - 1) * limite

    const includePedido = {
      cliente: true,
      vendedor: true,
      planos: {
        include: {
          servicos: {
            include: {
              tipoServico: true,
              operador: true
            }
          }
        }
      }
    }

    if (baseData === "producao") {
      const resultado = await gerarPorDataProducao({
        dataInicio,
        dataFim,
        vendedorId,
        clienteId,
        tipoPedido,
        skip,
        limite,
        paginaAtual
      })

      return res.json({
        baseData,
        ...resultado
      })
    }

    const wherePedido = {
      status: {
        not: "CANCELADO"
      }
    }

    if (dataInicio || dataFim) {
      wherePedido.dataPedido = {}

      if (dataInicio) {
        wherePedido.dataPedido.gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        wherePedido.dataPedido.lte = criarDataLocal(dataFim, true)
      }
    }

    if (vendedorId) {
      wherePedido.vendedorId = vendedorId
    }

    if (clienteId) {
      wherePedido.clienteId = clienteId
    }

    if (tipoPedido) {
      wherePedido.tipoPedido = tipoPedido
    }

    const resultado = await gerarPorDataPedido({
      wherePedido,
      includePedido,
      skip,
      limite,
      paginaAtual
    })

    return res.json({
      baseData,
      ...resultado
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de consumo de chapas"
    })
  }
}