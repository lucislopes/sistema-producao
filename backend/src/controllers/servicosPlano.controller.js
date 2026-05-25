import { prisma } from "../lib/prisma.js"
import { recalcularStatusPedido } from "../utils/recalcularStatusPedido.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

export async function listarServicosPorPlano(req, res) {
  try {
    const { planoId } = req.params

    const servicos = await prisma.servicoPlano.findMany({
      where: {
        planoId
      },
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

    const dados = {
      tipoServicoId,
      operadorId: operadorId || null,
      status,
      observacoes
    }

    if (status === "INICIADO") {
      dados.dataInicio = new Date()
    }

    if (status === "CONCLUIDO") {
      dados.dataFim = new Date()
    }

    const servico = await prisma.servicoPlano.update({
      where: {
        id
      },
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
      where: {
        id
      },
      include: {
        plano: true
      }
    })

    if (!servico) {
      return res.status(404).json({
        error: "Serviço não encontrado"
      })
    }

    const pedidoId = servico.plano.pedidoId

    await prisma.servicoPlano.delete({
      where: {
        id
      }
    })

    await recalcularStatusPedido(pedidoId)


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
              notIn: ["ENTREGUE", "CANCELADO"]
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
      where: {
        id: usuarioId
      },
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
            notIn: ["ENTREGUE", "CANCELADO"]
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
              notIn: ["ENTREGUE", "CANCELADO"]
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
      where: {
        id: usuarioId
      },
      include: {
        funcionario: true
      }
    })

    if (!usuario || !usuario.funcionario) {
      return res.status(404).json({
        error: "Usuário não encontrado"
      })
    }

    const servicoAtual = await prisma.servicoPlano.findUnique({
      where: {
        id
      },
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

    if (["ENTREGUE", "CANCELADO"].includes(servicoAtual.plano.pedido.status)) {
      return res.status(400).json({
        error: "Pedido já encerrado"
      })
    }

    const servico = await prisma.servicoPlano.update({
      where: {
        id
      },
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
      descricao: `Serviço assumido pelo operador`
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

    const dados = {
      status
    }

    if (status === "INICIADO") {
      dados.dataInicio = new Date()
    }

    if (status === "CONCLUIDO") {
      dados.dataFim = new Date()
    }

    const servicoAtual = await prisma.servicoPlano.findUnique({
      where: {
        id
      },
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

    if (["ENTREGUE", "CANCELADO"].includes(servicoAtual.plano.pedido.status)) {
      return res.status(400).json({
        error: "Pedido já encerrado"
      })
    }

    const servico = await prisma.servicoPlano.update({
      where: {
        id
      },
      data: dados,
      include: {
        plano: true
      }
    })

    await recalcularStatusPedido(servico.plano.pedidoId)

    await registrarHistoricoPedido({
      pedidoId: servico.plano.pedidoId,
      usuarioId: req.user.id,
      tipo: "STATUS_SERVICO_ALTERADO",
      descricao: `Status do serviço alterado para ${status}`
    })

    return res.json(servico)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao alterar status"
    })
  }
}