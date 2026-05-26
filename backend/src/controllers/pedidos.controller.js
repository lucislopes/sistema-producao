import { prisma } from "../lib/prisma.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

export async function listarPedidos(req, res) {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: true,
        vendedor: true,
        rota: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return res.json(pedidos)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Erro ao listar pedidos" })
  }
}

export async function criarPedido(req, res) {
  try {

    const {
      clienteId,
      vendedorId,
      dataEntrega,
      tipoEntrega,
      responsavelFrete,
      rotaId,
      valorFrete,
      valorTotal,
      nomeRecebedor,
      contatoRecebedor,
      enderecoEntrega,
      observacoes
    } = req.body

    const pedido = await prisma.pedido.create({
      data: {
        clienteId,
        vendedorId,
        dataEntrega: dataEntrega ? new Date(dataEntrega) : null,
        tipoEntrega,
        responsavelFrete,
        rotaId: rotaId || null,
        valorFrete: valorFrete ? Number(valorFrete) : null,
        valorTotal: valorTotal ? Number(valorTotal) : null,
        nomeRecebedor,
        contatoRecebedor,
        enderecoEntrega,
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
      descricao: `Pedido #${pedido.numeroPedido} criado`
    })

    return res.status(201).json(pedido)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Erro ao criar pedido" })
  }
}

export async function atualizarPedido(req, res) {
  try {
    const { id } = req.params

    const {
      clienteId,
      vendedorId,
      dataEntrega,
      tipoEntrega,
      responsavelFrete,
      rotaId,
      valorFrete,
      valorTotal,
      nomeRecebedor,
      contatoRecebedor,
      enderecoEntrega,
      status,
      observacoes
    } = req.body

    const pedidoAnterior = await prisma.pedido.findUnique({
      where: { id }
    })

    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        clienteId,
        vendedorId,
        dataEntrega: dataEntrega ? new Date(dataEntrega) : null,
        tipoEntrega,
        responsavelFrete,
        rotaId: rotaId || null,
        valorFrete: valorFrete ? Number(valorFrete) : null,
        valorTotal: valorTotal ? Number(valorTotal) : null,
        nomeRecebedor,
        contatoRecebedor,
        enderecoEntrega,
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
        descricao: `Pedido #${pedido.numeroPedido} atualizado`
      })
    }

    return res.json(pedido)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Erro ao atualizar pedido" })
  }
}