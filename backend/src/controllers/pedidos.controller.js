import { prisma } from "../lib/prisma.js"
import { podeEditarPedido } from "../utils/permissoes.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

function valorNumericoOuNull(valor) {
  if (valor === "" || valor === null || valor === undefined) {
    return null
  }

  return Number(valor)
}

function criarDataEntrega(dataEntrega) {
  if (!dataEntrega) return null

  const dataTexto = String(dataEntrega).trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataTexto)) {
    throw new Error("Data de entrega inválida")
  }

  const [ano, mes, dia] = dataTexto.split("-").map(Number)

  if (ano < 2000 || ano > 2100) {
    throw new Error("Ano da data de entrega inválido")
  }

  return new Date(ano, mes - 1, dia, 0, 0, 0, 0)
}

function validarDataEntregaPassada(dataEntrega) {
  if (!dataEntrega) return null

  const dataInformada = criarDataEntrega(dataEntrega)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  if (dataInformada < hoje) {
    return "Data prevista para entrega não pode ser anterior à data atual"
  }

  return null
}

function validarPedido({
  clienteId,
  vendedorId,
  dataEntrega,
  tipoEntrega,
  responsavelFrete,
  valorFrete,
  valorTotal
}) {
  if (!clienteId) return "Cliente é obrigatório"
  if (!vendedorId) return "Vendedor é obrigatório"
  if (!tipoEntrega) return "Tipo de entrega é obrigatório"

  if (tipoEntrega !== "CLIENTE_RETIRA" && !responsavelFrete) {
    return "Responsável pelo frete é obrigatório"
  }

  if (dataEntrega) {
    const data = criarDataEntrega(dataEntrega)
    if (Number.isNaN(data.getTime())) return "Data de entrega inválida"
  }

  if (valorFrete !== "" && valorFrete !== null && valorFrete !== undefined) {
    const valor = Number(valorFrete)
    if (Number.isNaN(valor) || valor < 0) return "Valor do frete inválido"
  }

  if (valorTotal !== "" && valorTotal !== null && valorTotal !== undefined) {
    const valor = Number(valorTotal)
    if (Number.isNaN(valor) || valor < 0) return "Valor total inválido"
  }

  return null
}

function obterNumeroPedidoExibicao(pedido) {
  if (pedido.origemPedido === "EXTERNO" && pedido.numeroPedidoManual) {
    return pedido.numeroPedidoManual
  }

  return `#${pedido.numeroPedido}`
}

function montarDadosFrete({
  tipoEntrega,
  valorFrete,
  valorFretePadrao,
  valorFreteCobrado,
  freteAlterado,
  motivoAlteracaoFrete
}) {
  if (tipoEntrega === "CLIENTE_RETIRA") {
    return {
      valorFrete: null,
      valorFretePadrao: null,
      valorFreteCobrado: null,
      freteAlterado: false,
      motivoAlteracaoFrete: null
    }
  }

  const valorCobradoTratado =
    valorNumericoOuNull(valorFreteCobrado) ??
    valorNumericoOuNull(valorFrete)

  return {
    valorFrete: valorCobradoTratado,
    valorFretePadrao: valorNumericoOuNull(valorFretePadrao),
    valorFreteCobrado: valorCobradoTratado,
    freteAlterado: Boolean(freteAlterado),
    motivoAlteracaoFrete: freteAlterado
      ? motivoAlteracaoFrete?.trim()
      : null
  }
}

async function validarNumeroPedidoDuplicado({
  origemTratada,
  numeroManualTratado,
  pedidoIdIgnorar = null
}) {
  if (origemTratada !== "EXTERNO") return null
  if (!numeroManualTratado) return null

  const pedidoExistente = await prisma.pedido.findFirst({
    where: {
      origemPedido: "EXTERNO",
      numeroPedidoManual: numeroManualTratado,
      ...(pedidoIdIgnorar
        ? {
            id: {
              not: pedidoIdIgnorar
            }
          }
        : {})
    }
  })

  if (pedidoExistente) {
    return "Já existe um pedido com este número externo"
  }

  return null
}

export async function listarPedidos(req, res) {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 50
    const { status, somenteAtivos, frete } = req.query

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

    if (frete === "ALTERADO") {
      where.freteAlterado = true
    }

    if (frete === "CORRETO") {
      where.freteAlterado = false
    }

    const [total, pedidos] = await Promise.all([
      prisma.pedido.count({ where }),

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

    return res.status(400).json({
      error: error.message || "Erro ao criar pedido"
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
      valorFretePadrao,
      valorFreteCobrado,
      freteAlterado,
      motivoAlteracaoFrete,
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
      return res.status(400).json({ error: erroValidacao })
    }

    const erroDataPassada = validarDataEntregaPassada(dataEntrega)

    if (erroDataPassada) {
      return res.status(400).json({
        error: erroDataPassada
      })
    }

    if (freteAlterado && !motivoAlteracaoFrete?.trim()) {
      return res.status(400).json({
        error: "Informe o motivo da alteração do frete"
      })
    }

    let quantidadeChapasDiretoEntregaTratada = null

    if (tipoPedido === "DIRETO_ENTREGA") {
      if (!dataEntrega) {
        return res.status(400).json({
          error: "Data prevista para entrega é obrigatória para pedido direto para entrega"
        })
      }

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
        ? numeroPedidoManual?.replace(/\s/g, "") || null
        : null

    if (origemTratada === "EXTERNO" && !numeroManualTratado) {
      return res.status(400).json({
        error: "Número do pedido externo é obrigatório"
      })
    }

    const erroPedidoDuplicado = await validarNumeroPedidoDuplicado({
      origemTratada,
      numeroManualTratado
    })

    if (erroPedidoDuplicado) {
      return res.status(400).json({
        error: erroPedidoDuplicado
      })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!cliente) {
      return res.status(400).json({
        error: "Cliente informado não existe"
      })
    }

    const vendedor = await prisma.funcionario.findUnique({
      where: { id: vendedorId }
    })

    if (!vendedor) {
      return res.status(400).json({
        error: "Vendedor informado não existe"
      })
    }

    if (rotaId) {
      const rota = await prisma.rotaEntrega.findUnique({
        where: { id: rotaId }
      })

      if (!rota) {
        return res.status(400).json({
          error: "Rota informada não existe"
        })
      }
    }

    const dadosFrete = montarDadosFrete({
      tipoEntrega,
      valorFrete,
      valorFretePadrao,
      valorFreteCobrado,
      freteAlterado,
      motivoAlteracaoFrete
    })


      console.log("====================================")
  console.log("dataEntrega recebida:", dataEntrega)
  console.log("tipo:", typeof dataEntrega)

  const dataConvertida = criarDataEntrega(dataEntrega)

  console.log("Date:", dataConvertida)
  console.log("ISO:", dataConvertida?.toISOString())

  console.log("====================================")



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
        dataEntrega: criarDataEntrega(dataEntrega),
        tipoEntrega,

        responsavelFrete:
          tipoEntrega === "CLIENTE_RETIRA" ? null : responsavelFrete,

        rotaId:
          tipoEntrega === "CLIENTE_RETIRA" ? null : rotaId || null,

        ...dadosFrete,

        valorTotal: valorNumericoOuNull(valorTotal),

        

        quantidadeChapasDiretoEntrega:
          tipoPedido === "DIRETO_ENTREGA"
            ? quantidadeChapasDiretoEntregaTratada
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

    if (pedido.freteAlterado) {
      await registrarHistoricoPedido({
        pedidoId: pedido.id,
        usuarioId: req.user.id,
        tipo: "FRETE_ALTERADO",
        descricao:
          `Pedido criado com frete diferente da rota. ` +
          `Padrão: R$ ${Number(pedido.valorFretePadrao || 0).toFixed(2)}. ` +
          `Cobrado: R$ ${Number(pedido.valorFreteCobrado || 0).toFixed(2)}. ` +
          `Motivo: ${pedido.motivoAlteracaoFrete || "Não informado"}`
      })
    }

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
      valorFretePadrao,
      valorFreteCobrado,
      freteAlterado,
      motivoAlteracaoFrete,
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
      where: { id }
    })

    if (!pedidoAnterior) {
      return res.status(404).json({
        error: "Pedido não encontrado"
      })
    }

    const permitido = await podeEditarPedido(id, req.user)

    if (!permitido) {
      return res.status(403).json({
        error: "Você não tem permissão para alterar este pedido. Somente o vendedor responsável ou um administrador pode editar."
      })
    }

    if (
      req.user.funcao !== "ADMIN" &&
      vendedorId !== pedidoAnterior.vendedorId
    ) {
      return res.status(403).json({
        error: "Somente um administrador pode alterar o vendedor do pedido."
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
      return res.status(400).json({ error: erroValidacao })
    }

    const erroDataPassada = validarDataEntregaPassada(dataEntrega)

    if (erroDataPassada) {
      return res.status(400).json({
        error: erroDataPassada
      })
    }

    if (freteAlterado && !motivoAlteracaoFrete?.trim()) {
      return res.status(400).json({
        error: "Informe o motivo da alteração do frete"
      })
    }

    const origemTratada = origemPedido || "INTERNO"
    const numeroManualTratado =
      origemTratada === "EXTERNO"
        ? numeroPedidoManual?.replace(/\s/g, "") || null
        : null

      if (origemTratada === "EXTERNO" && !numeroManualTratado) {
        return res.status(400).json({
          error: "Número do pedido externo é obrigatório"
        })
      }

      const erroPedidoDuplicado = await validarNumeroPedidoDuplicado({
        origemTratada,
        numeroManualTratado,
        pedidoIdIgnorar: id
      })

      if (erroPedidoDuplicado) {
        return res.status(400).json({
          error: erroPedidoDuplicado
        })
      }

      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId }
      })

      if (!cliente) {
        return res.status(400).json({
          error: "Cliente informado não existe"
        })
      }

      const vendedor = await prisma.funcionario.findUnique({
        where: { id: vendedorId }
      })

      if (!vendedor) {
        return res.status(400).json({
          error: "Vendedor informado não existe"
        })
      }

    if (rotaId) {
      const rota = await prisma.rotaEntrega.findUnique({
        where: { id: rotaId }
      })

      if (!rota) {
        return res.status(400).json({
          error: "Rota informada não existe"
        })
      }
    }

    let quantidadeChapasDiretoEntregaTratada = null

    if (tipoPedido === "DIRETO_ENTREGA") {
      if (!dataEntrega) {
        return res.status(400).json({
          error: "Data prevista para entrega é obrigatória para pedido direto para entrega"
        })
      }

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

    const dadosFrete = montarDadosFrete({
      tipoEntrega,
      valorFrete,
      valorFretePadrao,
      valorFreteCobrado,
      freteAlterado,
      motivoAlteracaoFrete
    })

    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        origemPedido: origemTratada,
        numeroPedidoManual: numeroManualTratado,
        tipoPedido: tipoPedido || "COM_PRODUCAO",

        clienteId,
        vendedorId,
        dataEntrega: criarDataEntrega(dataEntrega),
        tipoEntrega,

        responsavelFrete:
          tipoEntrega === "CLIENTE_RETIRA" ? null : responsavelFrete,

        rotaId:
          tipoEntrega === "CLIENTE_RETIRA" ? null : rotaId || null,

        ...dadosFrete,

        valorTotal: valorNumericoOuNull(valorTotal),
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

    const freteAnterior = Number(
      pedidoAnterior.valorFreteCobrado ??
        pedidoAnterior.valorFrete ??
        0
    )

    const freteAtual = Number(
      pedido.valorFreteCobrado ??
        pedido.valorFrete ??
        0
    )

    if (freteAnterior !== freteAtual) {
      await registrarHistoricoPedido({
        pedidoId: pedido.id,
        usuarioId: req.user.id,
        tipo: "FRETE_ALTERADO",
        descricao:
          `Frete alterado de R$ ${freteAnterior.toFixed(2)} ` +
          `para R$ ${freteAtual.toFixed(2)}. ` +
          `Motivo: ${pedido.motivoAlteracaoFrete || "Não informado"}`
      })
    }

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