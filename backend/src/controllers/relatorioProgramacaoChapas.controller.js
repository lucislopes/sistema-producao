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

function formatarDataKey(data) {
  if (!data) return null

  const dataObj = new Date(data)

  const ano = dataObj.getUTCFullYear()
  const mes = String(dataObj.getUTCMonth() + 1).padStart(2, "0")
  const dia = String(dataObj.getUTCDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function converterNumero(valor) {
  const numero = Number(
    String(valor || "0")
      .replace(",", ".")
      .replace(/[^0-9.]/g, "")
  )

  return Number.isNaN(numero) ? 0 : numero
}

function obterNumeroPedido(pedido) {
  if (pedido.origemPedido === "EXTERNO" && pedido.numeroPedidoManual) {
    return pedido.numeroPedidoManual
  }

  return `#${pedido.numeroPedido}`
}

function calcularResumoPedido(pedido) {
  let totalChapas = 0
  let metrosEncabecamento = 0
  let totalPlanos = 0

  if (pedido.tipoPedido === "DIRETO_ENTREGA") {
    totalChapas = Number(pedido.quantidadeChapasDiretoEntrega || 0)
  } else {
    totalPlanos = pedido.planos?.length || 0

    pedido.planos?.forEach((plano) => {
      totalChapas += Number(plano.quantidadeChapas || 0)
      metrosEncabecamento += converterNumero(plano.medidaEncabecamento)
    })
  }

  return {
    totalChapas,
    totalPlanos,
    metrosEncabecamento
  }
}

export async function relatorioProgramacaoChapas(req, res) {
  try {
    const {
      dataFim,
      vendedorId,
      cliente,
      page = 1,
      limit = 50
    } = req.query

    const paginaAtual = Number(page) || 1
    const limite = Number(limit) || 50
    const skip = (paginaAtual - 1) * limite

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const where = {
      dataEntrega: {
        gte: hoje
      },
      status: {
        in: [
          "ABERTO",
          "EM_SEPARACAO",
          "EM_PRODUCAO",
          "CONCLUIDO",
          "PRONTO_ENTREGA"
        ]
      }
    }

    if (dataFim) {
      where.dataEntrega.lte = criarDataLocal(dataFim, true)
    }

    if (vendedorId) {
      where.vendedorId = vendedorId
    }

    if (cliente) {
      where.cliente = {
        nome: {
          contains: cliente,
          mode: "insensitive"
        }
      }
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: true,
        vendedor: true,
        planos: {
          select: {
            id: true,
            numeroPlano: true,
            quantidadeChapas: true,
            medidaEncabecamento: true
          }
        }
      },
      orderBy: [
        { dataEntrega: "asc" },
        { numeroPedido: "asc" }
      ]
    })

    const pedidosFormatados = pedidos.map((pedido) => {
      const resumo = calcularResumoPedido(pedido)

      return {
        id: pedido.id,
        numeroPedido: pedido.numeroPedido,
        numeroPedidoManual: pedido.numeroPedidoManual,
        origemPedido: pedido.origemPedido,
        numeroPedidoFormatado: obterNumeroPedido(pedido),
        dataPedido: pedido.dataPedido,
        dataEntrega: pedido.dataEntrega,
        status: pedido.status,
        tipoPedido: pedido.tipoPedido,
        cliente: pedido.cliente,
        vendedor: pedido.vendedor,
        totalChapas: resumo.totalChapas,
        totalPlanos: resumo.totalPlanos,
        metrosEncabecamento: resumo.metrosEncabecamento
      }
    })

    const porDiaMap = {}

    pedidosFormatados.forEach((pedido) => {
      const dia = formatarDataKey(pedido.dataEntrega)

      if (!porDiaMap[dia]) {
        porDiaMap[dia] = {
          data: dia,
          pedidos: 0,
          planos: 0,
          chapas: 0,
          metrosEncabecamento: 0,
          itens: []
        }
      }

      porDiaMap[dia].pedidos += 1
      porDiaMap[dia].planos += Number(pedido.totalPlanos || 0)
      porDiaMap[dia].chapas += Number(pedido.totalChapas || 0)
      porDiaMap[dia].metrosEncabecamento += Number(
        pedido.metrosEncabecamento || 0
      )
      porDiaMap[dia].itens.push(pedido)
    })

    const porDiaCompleto = Object.values(porDiaMap).sort((a, b) =>
      a.data.localeCompare(b.data)
    )

    const dados = porDiaCompleto.slice(skip, skip + limite)

    const totalChapas = porDiaCompleto.reduce(
      (total, item) => total + Number(item.chapas || 0),
      0
    )

    const totalPedidos = pedidosFormatados.length

    const totalPlanos = porDiaCompleto.reduce(
      (total, item) => total + Number(item.planos || 0),
      0
    )

    const totalMetrosEncabecamento = porDiaCompleto.reduce(
      (total, item) => total + Number(item.metrosEncabecamento || 0),
      0
    )

    const diasProgramados = porDiaCompleto.length

    const mediaDia =
      diasProgramados > 0
        ? totalChapas / diasProgramados
        : 0

    const porVendedorMap = {}

    pedidosFormatados.forEach((pedido) => {
      const nome = pedido.vendedor?.nome || "Sem vendedor"

      if (!porVendedorMap[nome]) {
        porVendedorMap[nome] = {
          nome,
          pedidos: 0,
          planos: 0,
          chapas: 0,
          metrosEncabecamento: 0
        }
      }

      porVendedorMap[nome].pedidos += 1
      porVendedorMap[nome].planos += Number(pedido.totalPlanos || 0)
      porVendedorMap[nome].chapas += Number(pedido.totalChapas || 0)
      porVendedorMap[nome].metrosEncabecamento += Number(
        pedido.metrosEncabecamento || 0
      )
    })

    const porVendedor = Object.values(porVendedorMap).sort(
      (a, b) => b.chapas - a.chapas
    )

    return res.json({
      dados,
      resumo: {
        totalPedidos,
        totalChapas,
        totalPlanos,
        totalMetrosEncabecamento,
        diasProgramados,
        mediaDia
      },
      porVendedor,
      paginacao: {
        total: porDiaCompleto.length,
        page: paginaAtual,
        limit: limite,
        totalPages: Math.ceil(porDiaCompleto.length / limite)
      }
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de programação de chapas"
    })
  }
}