import { normalizarLimites, bloquearAgenda } from "../utils/limitesDiarios.js"
import { prisma } from "../lib/prisma.js"

export async function obterConfiguracaoEmpresa(req, res) {
  try {
    const configuracao = await prisma.$transaction(async tx => {
      await bloquearAgenda(tx)
      return await tx.configuracaoEmpresa.findFirst() || tx.configuracaoEmpresa.create({
        data: { nome: "Minha Empresa" }
      })
    }, { isolationLevel: "ReadCommitted" })

    return res.json(configuracao)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar configuração da empresa"
    })
  }
}

export async function salvarConfiguracaoEmpresa(req, res) {
  try {
    const {
      nome,
      telefone,
      email,
      endereco,
      cidade,
      estado,
      cnpj,
      logoUrl
    } = req.body

    let limites
    try { limites = normalizarLimites(req.body) } catch (error) {
      return res.status(400).json({ error: error.message })
    }
    const configuracao = await prisma.$transaction(async tx => {
      await bloquearAgenda(tx)
      const atual = await tx.configuracaoEmpresa.findFirst()
      const data = { nome, telefone, email, endereco, cidade, estado, cnpj, logoUrl, ...limites }
      return atual
        ? tx.configuracaoEmpresa.update({ where: { id: atual.id }, data })
        : tx.configuracaoEmpresa.create({ data })
    }, { isolationLevel: "ReadCommitted" })

    return res.json(configuracao)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao salvar configuração da empresa"
    })
  }
}
