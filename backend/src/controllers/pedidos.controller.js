import { prisma } from "../lib/prisma.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

function validarPedido({
  clienteId,
  vendedorId,
  dataEntrega,
  tipoEntrega,
  responsavelFrete,
  valorFrete,
  valorTotal
}) {
  if (!clienteId) {
    return "Cliente é obrigatório"
  }

  if (!vendedorId) {
    return "Vendedor é obrigatório"
  }

  if (!tipoEntrega) {
    return "Tipo de entrega é obrigatório"
  }

  if (
    tipoEntrega !== "CLIENTE_RETIRA" &&
    !responsavelFrete
  ) {
    return "Responsável pelo frete é obrigatório"
  }

  if (dataEntrega) {
    const data = new Date(dataEntrega)

    if (Number.isNaN(data.getTime())) {
      return "Data de entrega inválida"
    }
  }

  if (
    valorFrete !== "" &&
    valorFrete !== null &&
    valorFrete !== undefined
  ) {
    const valor = Number(valorFrete)

    if (Number.isNaN(valor) || valor < 0) {
      return "Valor do frete inválido"
    }
  }

  if (
    valorTotal !== "" &&
    valorTotal !== null &&
    valorTotal !== undefined
  ) {
    const valor = Number(valorTotal)

    if (Number.isNaN(valor) || valor < 0) {
      return "Valor total inválido"
    }
  }

  return null
}

function obterNumeroPedidoExibicao(pedido) {
  if (
    pedido.origemPedido === "EXTERNO" &&
    pedido.numeroPedidoManual
  ) {
    return pedido.numeroPedidoManual
  }

  return `#${pedido.numeroPedido}`
}

export async function listarPedidos(req, res) {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 50
    const { status, somenteAtivos } = req.query

    const skip = (page - 1) * limit
    const where = {}

    if (somenteAtivos === "true") {
      where.status = {
        notIn: ["ENTREGUE", "CANCELADO"]
      }
    }

    if (status) {
      where.status = status
    }

    const [total, pedidos] = await Promise.all([
      prisma.pedido.count({
        where
      }),

      prisma.pedido.findMany({
        where,
        skip,
        take: limit,
        include: {
          cliente: true,
          vendedor: true,
          rota: true
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    ])

    return res.json({
      dados: pedidos,
      paginacao: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar pedidos"
    })
  }
}

export async function criarPedido(req, res) {
  try {
    const {
      origemPedido,
      numeroPedidoManual,
      tipoPedido,
      clienteId,
      vendedorId,
      dataEntrega,
      tipoEntrega,
      responsavelFrete,
      rotaId,
      valorFrete,
      valorTotal,
      quantidadeChapasDiretoEntrega,
      nomeRecebedor,
      contatoRecebedor,
      enderecoEntrega,
      observacoes
    } = req.body

    const erroValidacao = validarPedido({
      clienteId,
      vendedorId,
      dataEntrega,
      tipoEntrega,
      responsavelFrete,
      valorFrete,
      valorTotal
    })

    if (erroValidacao) {
      return res.status(400).json({
        error: erroValidacao
      })
    }

    let quantidadeChapasDiretoEntregaTratada = null

    if (tipoPedido === "DIRETO_ENTREGA") {
      quantidadeChapasDiretoEntregaTratada = Number(
        quantidadeChapasDiretoEntrega
      )

      if (
        Number.isNaN(quantidadeChapasDiretoEntregaTratada) ||
        quantidadeChapasDiretoEntregaTratada <= 0
      ) {
        return res.status(400).json({
          error: "Quantidade de chapas é obrigatória para pedido direto para entrega"
        })
      }
    }

    const origemTratada = origemPedido || "INTERNO"
    const numeroManualTratado =
      origemTratada === "EXTERNO"
        ? numeroPedidoManual?.trim() || null
        : null

    if (origemTratada === "EXTERNO" && !numeroManualTratado) {
      return res.status(400).json({
        error: "Número do pedido externo é obrigatório"
      })
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: clienteId
      }
    })

    if (!cliente) {
      return res.status(400).json({
        error: "Cliente informado não existe"
      })
    }

    const vendedor = await prisma.funcionario.findUnique({
      where: {
        id: vendedorId
      }
    })

    if (!vendedor) {
      return res.status(400).json({
        error: "Vendedor informado não existe"
      })
    }

    if (rotaId) {
      const rota = await prisma.rotaEntrega.findUnique({
        where: {
          id: rotaId
        }
      })

      if (!rota) {
        return res.status(400).json({
          error: "Rota informada não existe"
        })
      }
    }

    const pedido = await prisma.pedido.create({
      data: {
        origemPedido: origemTratada,
        numeroPedidoManual: numeroManualTratado,
        tipoPedido: tipoPedido || "COM_PRODUCAO",
        status:
          tipoPedido === "DIRETO_ENTREGA"
            ? "PRONTO_ENTREGA"
            : "ABERTO",
        clienteId,
        vendedorId,
        dataEntrega: dataEntrega ? new Date(dataEntrega) : null,
        tipoEntrega,
        responsavelFrete:
          tipoEntrega === "CLIENTE_RETIRA"
            ? null
            : responsavelFrete,
        rotaId:
          tipoEntrega === "CLIENTE_RETIRA"
            ? null
            : rotaId || null,
        valorFrete:
          tipoEntrega === "CLIENTE_RETIRA"
            ? null
            : (
                valorFrete !== "" &&
                valorFrete !== null &&
                valorFrete !== undefined
              )
                ? Number(valorFrete)
                : null,
        valorTotal:
          valorTotal !== "" &&
          valorTotal !== null &&
          valorTotal !== undefined
            ? Number(valorTotal)
            : null,
        quantidadeChapasDiretoEntrega:
          tipoPedido === "DIRETO_ENTREGA"
            ? Number(quantidadeChapasDiretoEntrega)
            : null,
        nomeRecebedor:
          tipoEntrega === "CLIENTE_RETIRA" ? null : nomeRecebedor,

        contatoRecebedor:
          tipoEntrega === "CLIENTE_RETIRA" ? null : contatoRecebedor,

        enderecoEntrega:
          tipoEntrega === "CLIENTE_RETIRA" ? null : enderecoEntrega,
        observacoes
      },
      include: {
        cliente: true,
        vendedor: true,
        rota: true
      }
    })

    await registrarHistoricoPedido({
      pedidoId: pedido.id,
      usuarioId: req.user.id,
      tipo: "PEDIDO_CRIADO",
      descricao: `Pedido ${obterNumeroPedidoExibicao(pedido)} criado`
    })

    return res.status(201).json(pedido)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao criar pedido"
    })
  }
}

export async function atualizarPedido(req, res) {
  try {
    const { id } = req.params

    const {
      origemPedido,
      numeroPedidoManual,
      tipoPedido,
      clienteId,
      vendedorId,
      dataEntrega,
      tipoEntrega,
      responsavelFrete,
      rotaId,
      valorFrete,
      valorTotal,
      quantidadeChapasDiretoEntrega,
      nomeRecebedor,
      contatoRecebedor,
      enderecoEntrega,
      status,
      observacoes,
      updatedAt
    } = req.body

    const pedidoAnterior = await prisma.pedido.findUnique({
      where: {
        id
      }
    })

    if (!pedidoAnterior) {
      return res.status(404).json({
        error: "Pedido não encontrado"
      })
    }

    if (
      updatedAt &&
      new Date(updatedAt).getTime() !==
        new Date(pedidoAnterior.updatedAt).getTime()
    ) {
      return res.status(409).json({
        error:
          "Este pedido foi alterado por outro usuário. Atualize a página antes de salvar."
      })
    }

    const erroValidacao = validarPedido({
      clienteId,
      vendedorId,
      dataEntrega,
      tipoEntrega,
      responsavelFrete,
      valorFrete,
      valorTotal
    })

    if (erroValidacao) {
      return res.status(400).json({
        error: erroValidacao
      })
    }

    const origemTratada = origemPedido || "INTERNO"
    const numeroManualTratado =
      origemTratada === "EXTERNO"
        ? numeroPedidoManual?.trim() || null
        : null

    if (origemTratada === "EXTERNO" && !numeroManualTratado) {
      return res.status(400).json({
        error: "Número do pedido externo é obrigatório"
      })
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: clienteId
      }
    })

    if (!cliente) {
      return res.status(400).json({
        error: "Cliente informado não existe"
      })
    }

    const vendedor = await prisma.funcionario.findUnique({
      where: {
        id: vendedorId
      }
    })

    if (!vendedor) {
      return res.status(400).json({
        error: "Vendedor informado não existe"
      })
    }

    if (rotaId) {
      const rota = await prisma.rotaEntrega.findUnique({
        where: {
          id: rotaId
        }
      })

      if (!rota) {
        return res.status(400).json({
          error: "Rota informada não existe"
        })
      }
    }

    let quantidadeChapasDiretoEntregaTratada = null

      if (tipoPedido === "DIRETO_ENTREGA") {
      quantidadeChapasDiretoEntregaTratada = Number(
        quantidadeChapasDiretoEntrega
      )

      if (
        Number.isNaN(quantidadeChapasDiretoEntregaTratada) ||
        quantidadeChapasDiretoEntregaTratada <= 0
      ) {
        return res.status(400).json({
          error: "Quantidade de chapas é obrigatória para pedido direto para entrega"
        })
      }
    }         

    const pedido = await prisma.pedido.update({
      where: {
        id
      },
      data: {
        origemPedido: origemTratada,
        numeroPedidoManual: numeroManualTratado,
        tipoPedido: tipoPedido || "COM_PRODUCAO",
        clienteId,
        vendedorId,
        dataEntrega: dataEntrega ? new Date(dataEntrega) : null,
        tipoEntrega,
        responsavelFrete:
          tipoEntrega === "CLIENTE_RETIRA"
            ? null
            : responsavelFrete,
        rotaId:
          tipoEntrega === "CLIENTE_RETIRA"
            ? null
            : rotaId || null,
        valorFrete:
          tipoEntrega === "CLIENTE_RETIRA"
            ? null
            : (
                valorFrete !== "" &&
                valorFrete !== null &&
                valorFrete !== undefined
              )
                ? Number(valorFrete)
                : null, 
        valorTotal:
          valorTotal !== "" &&
          valorTotal !== null &&
          valorTotal !== undefined
            ? Number(valorTotal)
            : null,
        quantidadeChapasDiretoEntrega: quantidadeChapasDiretoEntregaTratada,

        nomeRecebedor:
          tipoEntrega === "CLIENTE_RETIRA" ? null : nomeRecebedor,

        contatoRecebedor:
          tipoEntrega === "CLIENTE_RETIRA" ? null : contatoRecebedor,

        enderecoEntrega:
          tipoEntrega === "CLIENTE_RETIRA" ? null : enderecoEntrega,
        status,
        observacoes
      },
      include: {
        cliente: true,
        vendedor: true,
        rota: true
      }
    })

    if (pedidoAnterior.status !== pedido.status) {
      await registrarHistoricoPedido({
        pedidoId: pedido.id,
        usuarioId: req.user.id,
        tipo: "STATUS_PEDIDO_ALTERADO",
        descricao: `Status alterado de ${pedidoAnterior.status} para ${pedido.status}`
      })
    } else {
      await registrarHistoricoPedido({
        pedidoId: pedido.id,
        usuarioId: req.user.id,
        tipo: "PEDIDO_ATUALIZADO",
        descricao: `Pedido ${obterNumeroPedidoExibicao(pedido)} atualizado`
      })
    }

    return res.json(pedido)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar pedido"
    })
  }
}