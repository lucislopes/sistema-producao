import { prisma } from "../lib/prisma.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

function calcularDataEntregaPorChapas(quantidadeChapas) {
  const data = new Date()

  if (quantidadeChapas <= 5) {
    data.setDate(data.getDate() + 2)
  } else if (quantidadeChapas <= 15) {
    data.setDate(data.getDate() + 4)
  } else {
    data.setDate(data.getDate() + 7)
  }

  return data
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

    const qtdChapas = Number(quantidadeChapas || 0)

    const plano = await prisma.planoCorte.create({
      data: {
        pedidoId,
        numeroPlano,
        quantidadeChapas: qtdChapas,
        medidaEncabecamento,
        compraExterna: Boolean(compraExterna),
        observacoes
      }
    })

    const dataSugerida = calcularDataEntregaPorChapas(qtdChapas)

    await prisma.pedido.update({
      where: {
        id: pedidoId
      },
      data: {
        dataEntrega: dataSugerida,
        status: "EM_PRODUCAO"
      }
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
      observacoes
    } = req.body

    const qtdChapas = Number(quantidadeChapas || 0)

    const plano = await prisma.planoCorte.update({
      where: {
        id
      },
      data: {
        numeroPlano,
        quantidadeChapas: qtdChapas,
        medidaEncabecamento,
        compraExterna: Boolean(compraExterna),
        observacoes
      }
    })

    const dataSugerida = calcularDataEntregaPorChapas(qtdChapas)

    await prisma.pedido.update({
      where: {
        id: plano.pedidoId
      },
      data: {
        dataEntrega: dataSugerida
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