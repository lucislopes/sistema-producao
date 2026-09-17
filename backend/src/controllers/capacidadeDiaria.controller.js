import { prisma } from "../lib/prisma.js"
import { consultarCapacidadeDiaria } from "../utils/capacidadeDiaria.js"

export async function obterCapacidadeDiaria(req, res) {
  try {
    const resultado = await prisma.$transaction(
      tx => consultarCapacidadeDiaria(tx, req.query.data),
      { isolationLevel: "RepeatableRead" }
    )
    res.set("Cache-Control", "no-store")
    return res.json(resultado)
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message })
    console.error(error)
    return res.status(500).json({ error: "Não foi possível consultar a capacidade desta data." })
  }
}
