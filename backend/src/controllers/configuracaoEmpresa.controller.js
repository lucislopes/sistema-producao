import { prisma } from "../lib/prisma.js"

export async function obterConfiguracaoEmpresa(req, res) {
  try {
    let configuracao = await prisma.configuracaoEmpresa.findFirst()

    if (!configuracao) {
      configuracao = await prisma.configuracaoEmpresa.create({
        data: {
          nome: "Minha Empresa"
        }
      })
    }

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
      cnpj
    } = req.body

    let configuracao = await prisma.configuracaoEmpresa.findFirst()

    if (!configuracao) {
      configuracao = await prisma.configuracaoEmpresa.create({
        data: {
          nome,
          telefone,
          email,
          endereco,
          cidade,
          estado,
          cnpj
        }
      })

      return res.status(201).json(configuracao)
    }

    configuracao = await prisma.configuracaoEmpresa.update({
      where: {
        id: configuracao.id
      },
      data: {
        nome,
        telefone,
        email,
        endereco,
        cidade,
        estado,
        cnpj
      }
    })

    return res.json(configuracao)

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao salvar configuração da empresa"
    })
  }
}