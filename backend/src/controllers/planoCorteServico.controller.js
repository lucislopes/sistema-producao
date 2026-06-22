import { prisma } from "../lib/prisma.js"

import {
  podeEditarPedido,
  podeEditarPlano
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
    const { id } = req.params

    console.log("USUARIO LOGADO:", req.user)
    console.log("PLANO EDITANDO:", id)

    const permitido = await podeEditarPlano(id, req.user)

    if (!permitido) {
      return res.status(403).json({
        error: "Você não tem permissão para alterar este plano"
      })
    }

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
            status: servico.operadorId ? "INICIADO" : "ABERTO",
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