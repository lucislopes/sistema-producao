import { prisma } from "../lib/prisma.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

function calcularDataEntregaPorChapas(quantidadeChapas) {
  const data = new Date()
  const qtd = Number(quantidadeChapas)

  if (qtd <= 3) {
    data.setDate(data.getDate() + 3)
  } else if (qtd <= 5) {
    data.setDate(data.getDate() + 5)
  } else if (qtd <= 9) {
    data.setDate(data.getDate() + 6)
  } else {
    data.setDate(data.getDate() + 10)
  }

  return data
}

function validarPlano({
  pedidoId,
  numeroPlano,
  quantidadeChapas
}) {
  if (!pedidoId) {
    return "Pedido é obrigatório"
  }

  if (!numeroPlano || !numeroPlano.trim()) {
    return "Número do plano é obrigatório"
  }

  const qtdChapas = Number(quantidadeChapas)

  if (Number.isNaN(qtdChapas) || qtdChapas <= 0) {
    return "Quantidade de chapas deve ser maior que zero"
  }

  return null
}

export async function listarPlanosPorPedido(req, res) {
  try {
    const { pedidoId } = req.params

    const planos = await prisma.planoCorte.findMany({
      where: {
        pedidoId
      },
      include: {
        servicos: {
          include: {
            tipoServico: true,
            operador: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return res.json(planos)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar planos"
    })
  }
}

export async function criarPlanoCorte(req, res) {
  try {
    const {
      pedidoId,
      numeroPlano,
      quantidadeChapas,
      medidaEncabecamento,
      compraExterna,
      observacoes
    } = req.body

    const erroValidacao = validarPlano({
      pedidoId,
      numeroPlano,
      quantidadeChapas
    })

    if (erroValidacao) {
      return res.status(400).json({
        error: erroValidacao
      })
    }

    const pedido = await prisma.pedido.findUnique({
      where: {
        id: pedidoId
      }
    })

    if (!pedido) {
      return res.status(400).json({
        error: "Pedido informado não existe"
      })
    }

    if (pedido.tipoPedido === "DIRETO_ENTREGA") {
      return res.status(400).json({
        error: "Este pedido é direto para entrega e não permite plano de corte"
      })
    }

    if (["ENTREGUE", "CANCELADO"].includes(pedido.status)) {
      return res.status(400).json({
        error: "Não é possível criar plano para pedido encerrado"
      })
    }

    const numeroPlanoTratado = numeroPlano.trim()
    const qtdChapas = Number(quantidadeChapas)

    const planoExistente = await prisma.planoCorte.findFirst({
      where: {
        pedidoId,
        numeroPlano: {
          equals: numeroPlanoTratado,
          mode: "insensitive"
        }
      }
    })

    if (planoExistente) {
      return res.status(400).json({
        error: "Já existe um plano com este número neste pedido"
      })
    }

    const plano = await prisma.planoCorte.create({
      data: {
        pedidoId,
        numeroPlano: numeroPlanoTratado,
        quantidadeChapas: qtdChapas,
        medidaEncabecamento,
        compraExterna: Boolean(compraExterna),
        observacoes
      }
    })

    const dadosAtualizacaoPedido = {
      status: "EM_SEPARACAO"
    }

    if (!pedido.dataEntrega) {
      dadosAtualizacaoPedido.dataEntrega = calcularDataEntregaPorChapas(qtdChapas)
    }

    await prisma.pedido.update({
      where: {
        id: pedidoId
      },
      data: dadosAtualizacaoPedido
    })

    await registrarHistoricoPedido({
      pedidoId,
      usuarioId: req.user.id,
      tipo: "PLANO_CRIADO",
      descricao: `Plano ${plano.numeroPlano} criado com ${plano.quantidadeChapas} chapas`
    })

    return res.status(201).json(plano)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao criar plano de corte"
    })
  }
}

export async function atualizarPlanoCorte(req, res) {
  try {
    const { id } = req.params

    const {
      numeroPlano,
      quantidadeChapas,
      medidaEncabecamento,
      compraExterna,
      observacoes,
      updatedAt
    } = req.body

    if (!numeroPlano || !numeroPlano.trim()) {
      return res.status(400).json({
        error: "Número do plano é obrigatório"
      })
    }

    const qtdChapas = Number(quantidadeChapas)

    if (Number.isNaN(qtdChapas) || qtdChapas <= 0) {
      return res.status(400).json({
        error: "Quantidade de chapas deve ser maior que zero"
      })
    }

    const planoAnterior = await prisma.planoCorte.findUnique({
      where: {
        id
      }
    })

    if (!planoAnterior) {
      return res.status(404).json({
        error: "Plano de corte não encontrado"
      })
    }

    if (
      updatedAt &&
      new Date(updatedAt).getTime() !==
        new Date(planoAnterior.updatedAt).getTime()
    ) {
      return res.status(409).json({
        error:
          "Este plano foi alterado por outro usuário. Atualize a página antes de salvar."
      })
    }

    const pedido = await prisma.pedido.findUnique({
      where: {
        id: planoAnterior.pedidoId
      }
    })

    if (!pedido) {
      return res.status(400).json({
        error: "Pedido do plano não encontrado"
      })
    }

    if (["ENTREGUE", "CANCELADO"].includes(pedido.status)) {
      return res.status(400).json({
        error: "Não é possível alterar plano de pedido encerrado"
      })
    }

    const numeroPlanoTratado = numeroPlano.trim()

    const planoExistente = await prisma.planoCorte.findFirst({
      where: {
        pedidoId: planoAnterior.pedidoId,
        numeroPlano: {
          equals: numeroPlanoTratado,
          mode: "insensitive"
        },
        id: {
          not: id
        }
      }
    })

    if (planoExistente) {
      return res.status(400).json({
        error: "Já existe outro plano com este número neste pedido"
      })
    }

    const plano = await prisma.planoCorte.update({
      where: {
        id
      },
      data: {
        numeroPlano: numeroPlanoTratado,
        quantidadeChapas: qtdChapas,
        medidaEncabecamento,
        compraExterna: Boolean(compraExterna),
        observacoes
      }
    })

    await registrarHistoricoPedido({
      pedidoId: plano.pedidoId,
      usuarioId: req.user.id,
      tipo: "PLANO_ATUALIZADO",
      descricao: `Plano ${plano.numeroPlano} atualizado`
    })

    return res.json(plano)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar plano de corte"
    })
  }
}

export async function deletarPlanoCorte(req, res) {
  try {
    const { id } = req.params

    const plano = await prisma.planoCorte.findUnique({
      where: {
        id
      },
      include: {
        servicos: true
      }
    })

    if (!plano) {
      return res.status(404).json({
        error: "Plano de corte não encontrado"
      })
    }

    if (plano.servicos.length > 0) {
      return res.status(400).json({
        error: "Não é possível excluir plano com serviços cadastrados"
      })
    }

    await prisma.planoCorte.delete({
      where: {
        id
      }
    })

    await registrarHistoricoPedido({
      pedidoId: plano.pedidoId,
      usuarioId: req.user.id,
      tipo: "PLANO_EXCLUIDO",
      descricao: `Plano ${plano.numeroPlano} excluído`
    })

    return res.json({
      message: "Plano de corte excluído"
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao excluir plano de corte"
    })
  }
}