function resumir(limite, utilizado) {
  return {
    limite: limite ?? null,
    utilizado,
    disponivel: limite == null ? null : Math.max(0, limite - utilizado),
    excedente: limite == null ? 0 : Math.max(0, utilizado - limite)
  }
}

export async function consultarCapacidadeDiaria(db, data) {
  const inicio = new Date(`${data}T00:00:00.000Z`)
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !Number.isFinite(inicio.getTime()) || inicio.toISOString().slice(0, 10) !== data) {
    throw Object.assign(new Error("Informe uma data válida no formato AAAA-MM-DD."), { statusCode: 400 })
  }
  // Mesmo agrupamento UTC e critérios usados na validação de limites e programação.
  const where = {
    status: { not: "CANCELADO" },
    dataEntrega: { gte: inicio, lt: new Date(inicio.getTime() + 86400000) }
  }
  const [config, empresa, cliente, chapas] = await Promise.all([
    db.configuracaoEmpresa.findFirst({ select: { limiteFretesEmpresaDia: true, limiteFretesClienteDia: true, limiteChapasDia: true } }),
    db.pedido.count({ where: { ...where, tipoEntrega: "ENTREGA_EMPRESA", responsavelFrete: "EMPRESA" } }),
    db.pedido.count({ where: { ...where, tipoEntrega: "ENTREGA_EMPRESA", responsavelFrete: "CLIENTE" } }),
    db.planoCorte.aggregate({ where: { pedido: { ...where, tipoPedido: "COM_PRODUCAO" } }, _sum: { quantidadeChapas: true } })
  ])
  return {
    data,
    freteEmpresa: resumir(config?.limiteFretesEmpresaDia, empresa),
    freteCliente: resumir(config?.limiteFretesClienteDia, cliente),
    chapas: resumir(config?.limiteChapasDia, Number(chapas._sum.quantidadeChapas || 0))
  }
}
