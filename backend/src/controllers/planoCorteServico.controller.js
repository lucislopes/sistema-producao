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

function obterUsuarioId(req) {
  return req.user?.id || req.user?.usuarioId || null
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

      const tiposServico = await tx.tipoServico.findMany({
        where: {
          id: {
            in: servicosSelecionados.map((servico) => servico.tipoServicoId)
          }
        }
      })

      const tiposServicoMap = new Map(
        tiposServico.map((tipo) => [tipo.id, tipo.nome])
      )

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

        await tx.historicoPedido.create({
          data: {
            pedidoId,
            usuarioId: obterUsuarioId(req),
            tipo: "PLANO_CRIADO",
            descricao: `Plano ${numero} criado com ${Number(quantidadeChapas)} chapa(s).`
          }
        })

        for (const servico of servicosSelecionados) {
          const servicoCriado = await tx.servicoPlano.create({
            data: {
              planoId: plano.id,
              tipoServicoId: servico.tipoServicoId,
              operadorId: servico.operadorId || null,
              status: servico.operadorId ? "INICIADO" : "ABERTO",
              observacoes: servico.observacoes || null
            }
          })

          const nomeServico =
            tiposServicoMap.get(servico.tipoServicoId) || servico.tipoServicoId

          await tx.historicoPedido.create({
            data: {
              pedidoId,
              usuarioId: obterUsuarioId(req),
              tipo: "SERVICO_CRIADO",
              descricao: `Serviço ${nomeServico} criado no plano ${numero} com status ${servicoCriado.status}.`
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

      await tx.historicoPedido.create({
        data: {
          pedidoId,
          usuarioId: obterUsuarioId(req),
          tipo: "STATUS_PEDIDO_ALTERADO",
          descricao: "Pedido enviado para produção após criação de plano(s) e serviço(s)."
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
      const planoAntes = await tx.planoCorte.findUnique({
        where: { id },
        include: {
          servicos: {
            include: {
              tipoServico: true
            }
          }
        }
      })

      if (!planoAntes) {
        throw new Error("Plano não encontrado")
      }

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

      await tx.historicoPedido.create({
        data: {
          pedidoId: plano.pedidoId,
          usuarioId: obterUsuarioId(req),
          tipo: "PLANO_ATUALIZADO",
          descricao: `Plano ${numeroPlano} atualizado. Chapas: ${Number(quantidadeChapas)}.`
        }
      })

      if (planoAntes.servicos.length > 0) {
        const nomesServicosAntigos = planoAntes.servicos
          .map((servico) => servico.tipoServico?.nome)
          .filter(Boolean)
          .join(", ")

        await tx.historicoPedido.create({
          data: {
            pedidoId: plano.pedidoId,
            usuarioId: obterUsuarioId(req),
            tipo: "SERVICO_ATUALIZADO",
            descricao: `Serviços do plano ${planoAntes.numeroPlano} foram substituídos. Serviços anteriores: ${nomesServicosAntigos || "-"}`
          }
        })
      }

      await tx.servicoPlano.deleteMany({
        where: { planoId: id }
      })

      const tiposServico = await tx.tipoServico.findMany({
        where: {
          id: {
            in: servicosSelecionados.map((servico) => servico.tipoServicoId)
          }
        }
      })

      const tiposServicoMap = new Map(
        tiposServico.map((tipo) => [tipo.id, tipo.nome])
      )

      for (const servico of servicosSelecionados) {
        const servicoCriado = await tx.servicoPlano.create({
          data: {
            planoId: plano.id,
            tipoServicoId: servico.tipoServicoId,
            operadorId: servico.operadorId || null,
            status: servico.status || "ABERTO",
            observacoes: servico.observacoes || null
          }
        })

        const nomeServico =
          tiposServicoMap.get(servico.tipoServicoId) || servico.tipoServicoId

        await tx.historicoPedido.create({
          data: {
            pedidoId: plano.pedidoId,
            usuarioId: obterUsuarioId(req),
            tipo: "SERVICO_CRIADO",
            descricao: `Serviço ${nomeServico} recriado no plano ${numeroPlano} com status ${servicoCriado.status}.`
          }
        })
      }

      return plano
    })

    await recalcularStatusPedido(resultado.pedidoId)

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
        servicos: {
          include: {
            tipoServico: true
          }
        }
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
      const nomesServicos = plano.servicos
        .map((servico) => servico.tipoServico?.nome)
        .filter(Boolean)
        .join(", ")

      await tx.historicoPedido.create({
        data: {
          pedidoId,
          usuarioId: obterUsuarioId(req),
          tipo: "PLANO_EXCLUIDO",
          descricao: `Plano ${plano.numeroPlano} excluído com ${plano.servicos.length} serviço(s). Serviços: ${nomesServicos || "-"}`
        }
      })

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