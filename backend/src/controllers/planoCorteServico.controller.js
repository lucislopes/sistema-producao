import { prisma } from "../lib/prisma.js"
import { recalcularStatusPedido } from "../utils/recalcularStatusPedido.js"

import {
  podeEditarPedido,
} from "../utils/permissoes.js"

function separarPlanos(numeroPlano) {
  return String(numeroPlano)
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function criarPlanosComServicos(req, res) {
  try {
    const {
      pedidoId,
      numeroPlano,
      quantidadeChapas,
      medidaEncabecamento,
      compraExterna,
      observacoes,
      servicos
    } = req.body

    if (!pedidoId) {
      return res.status(400).json({ error: "Pedido é obrigatório" })
    }

    const permitido = await podeEditarPedido(pedidoId, req.user)

    if (!permitido) {
      return res.status(403).json({
        error: "Você não tem permissão para criar plano neste pedido"
      })
    }

    if (!numeroPlano) {
      return res.status(400).json({ error: "Número do plano é obrigatório" })
    }

    if (!quantidadeChapas || Number(quantidadeChapas) <= 0) {
      return res.status(400).json({ error: "Quantidade de chapas inválida" })
    }

    const planosNumeros = separarPlanos(numeroPlano)

    if (planosNumeros.length === 0) {
      return res.status(400).json({ error: "Informe pelo menos um plano" })
    }

    const servicosSelecionados = Array.isArray(servicos)
      ? servicos.filter((servico) => servico.tipoServicoId)
      : []

    const resultado = await prisma.$transaction(async (tx) => {
      const planosCriados = []

      for (const numero of planosNumeros) {
        const planoExistente = await tx.planoCorte.findFirst({
          where: {
            pedidoId,
            numeroPlano: numero
          }
        })

        if (planoExistente) {
          throw new Error(`O plano ${numero} já existe neste pedido`)
        }

        const plano = await tx.planoCorte.create({
          data: {
            pedidoId,
            numeroPlano: numero,
            quantidadeChapas: Number(quantidadeChapas),
            medidaEncabecamento: medidaEncabecamento || null,
            compraExterna: Boolean(compraExterna),
            observacoes: observacoes || null
          }
        })

        for (const servico of servicosSelecionados) {
          await tx.servicoPlano.create({
            data: {
              planoId: plano.id,
              tipoServicoId: servico.tipoServicoId,
              operadorId: servico.operadorId || null,
              status: servico.operadorId ? "INICIADO" : "ABERTO",
              observacoes: servico.observacoes || null
            }
          })
        }

        planosCriados.push(plano)
      }

      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          status: "EM_PRODUCAO"
        }
      })

      return planosCriados
    })

    return res.status(201).json({
      message: "Planos e serviços criados com sucesso",
      planos: resultado
    })
  } catch (error) {
    console.log(error)

    return res.status(400).json({
      error: error.message || "Erro ao criar planos com serviços"
    })
  }
}

export async function listarPlanosComServicosPorPedido(req, res) {
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
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        numeroPlano: "asc"
      }
    })

    return res.json(planos)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar planos com serviços"
    })
  }
}

export async function atualizarPlanoComServicos(req, res) {
  try {
    if (req.user.funcao !== "ADMIN") {
      return res.status(403).json({
        error: "Somente usuários ADMIN podem editar planos e serviços."
      })
    }

    const { id } = req.params

    const {
      numeroPlano,
      quantidadeChapas,
      medidaEncabecamento,
      compraExterna,
      observacoes,
      servicos
    } = req.body

    if (!numeroPlano) {
      return res.status(400).json({ error: "Número do plano é obrigatório" })
    }

    if (!quantidadeChapas || Number(quantidadeChapas) <= 0) {
      return res.status(400).json({ error: "Quantidade de chapas inválida" })
    }

    const servicosSelecionados = Array.isArray(servicos)
      ? servicos.filter((servico) => servico.tipoServicoId)
      : []

    const resultado = await prisma.$transaction(async (tx) => {
      const plano = await tx.planoCorte.update({
        where: { id },
        data: {
          numeroPlano,
          quantidadeChapas: Number(quantidadeChapas),
          medidaEncabecamento: medidaEncabecamento || null,
          compraExterna: Boolean(compraExterna),
          observacoes: observacoes || null
        }
      })

      await tx.servicoPlano.deleteMany({
        where: { planoId: id }
      })

      for (const servico of servicosSelecionados) {
        await tx.servicoPlano.create({
          data: {
            planoId: plano.id,
            tipoServicoId: servico.tipoServicoId,
            operadorId: servico.operadorId || null,
            status: servico.status || "ABERTO",
            observacoes: servico.observacoes || null
          }
        })
      }

      return plano
    })

    return res.json({
      message: "Plano e serviços atualizados com sucesso",
      plano: resultado
    })
  } catch (error) {
    console.log(error)

    return res.status(400).json({
      error: error.message || "Erro ao atualizar plano com serviços"
    })
  }
}

export async function excluirPlanoComServicos(req, res) {
  try {
    if (req.user.funcao !== "ADMIN") {
      return res.status(403).json({
        error: "Somente usuários ADMIN podem excluir planos e serviços."
      })
    }

    const { id } = req.params

    const plano = await prisma.planoCorte.findUnique({
      where: { id },
      include: {
        pedido: true,
        servicos: true
      }
    })

    if (!plano) {
      return res.status(404).json({
        error: "Plano de corte não encontrado"
      })
    }

    if (["SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(plano.pedido.status)) {
      return res.status(400).json({
        error: "Não é possível excluir plano de pedido encerrado."
      })
    }

    const pedidoId = plano.pedidoId
    const pedidoEstavaProntoEntrega = plano.pedido.status === "PRONTO_ENTREGA"

    await prisma.$transaction(async (tx) => {
      await tx.servicoPlano.deleteMany({
        where: { planoId: id }
      })

      await tx.planoCorte.delete({
        where: { id }
      })
    })

    await recalcularStatusPedido(pedidoId, {
      permitirReabrirExpedicao: pedidoEstavaProntoEntrega
    })

    return res.json({
      message: "Plano de corte e serviços excluídos com sucesso"
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao excluir plano de corte"
    })
  }
}