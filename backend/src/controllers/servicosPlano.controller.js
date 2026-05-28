import { prisma } from "../lib/prisma.js"
import { recalcularStatusPedido } from "../utils/recalcularStatusPedido.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

const STATUS_SERVICO_PERMITIDOS = [
  "ABERTO",
  "INICIADO",
  "CONCLUIDO",
  "CANCELADO"
]

function validarStatusServico(status) {
  return STATUS_SERVICO_PERMITIDOS.includes(status)
}

export async function listarServicosPorPlano(req, res) {
  try {
    const { planoId } = req.params

    const servicos = await prisma.servicoPlano.findMany({
      where: { planoId },
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
      orderBy: {
        createdAt: "asc"
      }
    })

    return res.json(servicos)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar serviços"
    })
  }
}

export async function criarServicoPlano(req, res) {
  try {
    const {
      planoId,
      tipoServicoId,
      operadorId,
      observacoes
    } = req.body

    if (!planoId) {
      return res.status(400).json({
        error: "Plano é obrigatório"
      })
    }

    if (!tipoServicoId) {
      return res.status(400).json({
        error: "Tipo de serviço é obrigatório"
      })
    }

    const plano = await prisma.planoCorte.findUnique({
      where: { id: planoId },
      include: {
        pedido: true
      }
    })

    if (!plano) {
      return res.status(400).json({
        error: "Plano não encontrado"
      })
    }

    if (["PRONTO_ENTREGA", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(plano.pedido.status)) {
      return res.status(400).json({
        error: "Pedido já está encerrado ou em expedição"
      })
    }

    const tipoServico = await prisma.tipoServico.findUnique({
      where: { id: tipoServicoId }
    })

    if (!tipoServico) {
      return res.status(400).json({
        error: "Tipo de serviço não encontrado"
      })
    }

    if (operadorId) {
      const operador = await prisma.funcionario.findUnique({
        where: { id: operadorId }
      })

      if (!operador) {
        return res.status(400).json({
          error: "Operador não encontrado"
        })
      }

      if (!operador.ativo) {
        return res.status(400).json({
          error: "Operador inativo"
        })
      }
    }

    const servicoDuplicado = await prisma.servicoPlano.findFirst({
      where: {
        planoId,
        tipoServicoId
      }
    })

    if (servicoDuplicado) {
      return res.status(400).json({
        error: "Este serviço já existe neste plano"
      })
    }

    const servico = await prisma.servicoPlano.create({
      data: {
        planoId,
        tipoServicoId,
        operadorId: operadorId || null,
        observacoes,
        status: "ABERTO"
      },
      include: {
        tipoServico: true,
        operador: true,
        plano: true
      }
    })

    await recalcularStatusPedido(servico.plano.pedidoId)

    await registrarHistoricoPedido({
      pedidoId: servico.plano.pedidoId,
      usuarioId: req.user.id,
      tipo: "SERVICO_CRIADO",
      descricao: `Serviço ${servico.tipoServico.nome} criado`
    })

    return res.status(201).json(servico)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao criar serviço"
    })
  }
}

export async function atualizarServicoPlano(req, res) {
  try {
    const { id } = req.params

    const {
      tipoServicoId,
      operadorId,
      status,
      observacoes
    } = req.body

    if (!tipoServicoId) {
      return res.status(400).json({
        error: "Tipo de serviço é obrigatório"
      })
    }

    if (!status || !validarStatusServico(status)) {
      return res.status(400).json({
        error: "Status inválido"
      })
    }

    const servicoAtual = await prisma.servicoPlano.findUnique({
      where: { id },
      include: {
        plano: {
          include: {
            pedido: true
          }
        }
      }
    })

    if (!servicoAtual) {
      return res.status(404).json({
        error: "Serviço não encontrado"
      })
    }

    if (["PRONTO_ENTREGA", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(servicoAtual.plano.pedido.status)) {
      return res.status(400).json({
        error: "Pedido já está encerrado ou em expedição"
      })
    }

    const tipoServico = await prisma.tipoServico.findUnique({
      where: { id: tipoServicoId }
    })

    if (!tipoServico) {
      return res.status(400).json({
        error: "Tipo de serviço não encontrado"
      })
    }

    if (operadorId) {
      const operador = await prisma.funcionario.findUnique({
        where: { id: operadorId }
      })

      if (!operador) {
        return res.status(400).json({
          error: "Operador não encontrado"
        })
      }

      if (!operador.ativo) {
        return res.status(400).json({
          error: "Operador inativo"
        })
      }
    }

    const servicoDuplicado = await prisma.servicoPlano.findFirst({
      where: {
        planoId: servicoAtual.planoId,
        tipoServicoId,
        id: {
          not: id
        }
      }
    })

    if (servicoDuplicado) {
      return res.status(400).json({
        error: "Já existe este serviço no plano"
      })
    }

    const dados = {
      tipoServicoId,
      operadorId: operadorId || null,
      status,
      observacoes
    }

    if (status === "INICIADO" && !servicoAtual.dataInicio) {
      dados.dataInicio = new Date()
    }

    if (status === "CONCLUIDO" && !servicoAtual.dataFim) {
      dados.dataFim = new Date()
    }

    const servico = await prisma.servicoPlano.update({
      where: { id },
      data: dados,
      include: {
        tipoServico: true,
        operador: true,
        plano: true
      }
    })

    await recalcularStatusPedido(servico.plano.pedidoId)

    await registrarHistoricoPedido({
      pedidoId: servico.plano.pedidoId,
      usuarioId: req.user.id,
      tipo: "SERVICO_ATUALIZADO",
      descricao: `Serviço ${servico.tipoServico.nome} atualizado`
    })

    return res.json(servico)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar serviço"
    })
  }
}

export async function deletarServicoPlano(req, res) {
  try {
    const { id } = req.params

    const servico = await prisma.servicoPlano.findUnique({
      where: { id },
      include: {
        tipoServico: true,
        plano: {
          include: {
            pedido: true
          }
        }
      }
    })

    if (!servico) {
      return res.status(404).json({
        error: "Serviço não encontrado"
      })
    }

    if (["PRONTO_ENTREGA", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(servico.plano.pedido.status)) {
      return res.status(400).json({
        error: "Pedido já está encerrado ou em expedição"
      })
    }

    if (servico.status === "CONCLUIDO") {
      return res.status(400).json({
        error: "Não é possível excluir serviço concluído"
      })
    }

    const pedidoId = servico.plano.pedidoId

    await prisma.servicoPlano.delete({
      where: { id }
    })

    await recalcularStatusPedido(pedidoId)

    await registrarHistoricoPedido({
      pedidoId,
      usuarioId: req.user.id,
      tipo: "SERVICO_EXCLUIDO",
      descricao: `Serviço ${servico.tipoServico.nome} excluído`
    })

    return res.json({
      message: "Serviço excluído"
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao excluir serviço"
    })
  }
}

export async function listarServicosDisponiveis(req, res) {
  try {
    const servicos = await prisma.servicoPlano.findMany({
      where: {
        status: "ABERTO",
        operadorId: null,
        plano: {
          pedido: {
            status: {
              notIn: [
                "PRONTO_ENTREGA",
                "SAIU_ENTREGA",
                "ENTREGUE",
                "CANCELADO"
              ]
            }
          }
        }
      },
      include: {
        tipoServico: true,
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
      orderBy: {
        createdAt: "asc"
      }
    })

    return res.json(servicos)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar serviços disponíveis"
    })
  }
}

export async function listarMeusServicos(req, res) {
  try {
    const usuarioId = req.user.id

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        funcionario: true
      }
    })

    if (!usuario || !usuario.funcionario) {
      return res.status(404).json({
        error: "Usuário não encontrado"
      })
    }

    let where = {
      plano: {
        pedido: {
          status: {
            notIn: [
              "PRONTO_ENTREGA",
              "SAIU_ENTREGA",
              "ENTREGUE",
              "CANCELADO"
            ]
          }
        }
      }
    }

    if (usuario.funcionario.funcao === "OPERADOR") {
      where = {
        operadorId: usuario.funcionario.id,
        plano: {
          pedido: {
            status: {
              notIn: [
                "PRONTO_ENTREGA",
                "SAIU_ENTREGA",
                "ENTREGUE",
                "CANCELADO"
              ]
            }
          }
        }
      }
    }

    const servicos = await prisma.servicoPlano.findMany({
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
      orderBy: {
        createdAt: "asc"
      }
    })

    return res.json(servicos)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar meus serviços"
    })
  }
}

export async function assumirServico(req, res) {
  try {
    const { id } = req.params
    const usuarioId = req.user.id

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        funcionario: true
      }
    })

    if (!usuario || !usuario.funcionario) {
      return res.status(404).json({
        error: "Usuário não encontrado"
      })
    }

    if (!usuario.funcionario.ativo) {
      return res.status(400).json({
        error: "Funcionário inativo"
      })
    }

    const servicoAtual = await prisma.servicoPlano.findUnique({
      where: { id },
      include: {
        plano: {
          include: {
            pedido: true
          }
        }
      }
    })

    if (!servicoAtual) {
      return res.status(404).json({
        error: "Serviço não encontrado"
      })
    }

    if (servicoAtual.operadorId) {
      return res.status(400).json({
        error: "Serviço já possui operador"
      })
    }

    if (["PRONTO_ENTREGA", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(servicoAtual.plano.pedido.status)) {
      return res.status(400).json({
        error: "Pedido já está encerrado ou em expedição"
      })
    }

    if (servicoAtual.status !== "ABERTO") {
      return res.status(400).json({
        error: "Somente serviços abertos podem ser assumidos"
      })
    }

    const servico = await prisma.servicoPlano.update({
      where: { id },
      data: {
        operadorId: usuario.funcionario.id,
        status: "INICIADO",
        dataInicio: new Date()
      },
      include: {
        plano: true
      }
    })

    await recalcularStatusPedido(servico.plano.pedidoId)

    await registrarHistoricoPedido({
      pedidoId: servico.plano.pedidoId,
      usuarioId: req.user.id,
      tipo: "SERVICO_ASSUMIDO",
      descricao: "Serviço assumido pelo operador"
    })

    return res.json(servico)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao assumir serviço"
    })
  }
}

export async function alterarStatusServico(req, res) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !validarStatusServico(status)) {
      return res.status(400).json({
        error: "Status inválido"
      })
    }

    const servicoAtual = await prisma.servicoPlano.findUnique({
      where: { id },
      include: {
        tipoServico: true,
        plano: {
          include: {
            pedido: true
          }
        }
      }
    })

    if (!servicoAtual) {
      return res.status(404).json({
        error: "Serviço não encontrado"
      })
    }

    if (["PRONTO_ENTREGA", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(servicoAtual.plano.pedido.status)) {
      return res.status(400).json({
        error: "Pedido já está encerrado ou em expedição"
      })
    }

    const dados = {
      status
    }

    if (status === "INICIADO" && !servicoAtual.dataInicio) {
      dados.dataInicio = new Date()
    }

    if (status === "CONCLUIDO" && !servicoAtual.dataFim) {
      dados.dataFim = new Date()
    }

    const servico = await prisma.servicoPlano.update({
      where: { id },
      data: dados,
      include: {
        tipoServico: true,
        plano: true
      }
    })

    await recalcularStatusPedido(servico.plano.pedidoId)

    await registrarHistoricoPedido({
      pedidoId: servico.plano.pedidoId,
      usuarioId: req.user.id,
      tipo: "STATUS_SERVICO_ALTERADO",
      descricao: `Serviço ${servico.tipoServico.nome}: status alterado de ${servicoAtual.status} para ${servico.status}`
    })

    return res.json(servico)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao alterar status"
    })
  }
}