CREATE TABLE IF NOT EXISTS "OrigemComercialPedido" (
 "pedidoId" TEXT PRIMARY KEY REFERENCES "Pedido"("id") ON DELETE CASCADE,
 "origem" TEXT NOT NULL DEFAULT 'SISTEMA',
 "contatoRecebidoEm" TIMESTAMP(3),
 "primeiraRespostaEm" TIMESTAMP(3),
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "OrigemComercialPedido_origem_check" CHECK ("origem" IN ('SISTEMA','SITE_WHATSAPP','WHATSAPP','LOJA','INDICACAO','EMAIL','OUTRO')),
 CONSTRAINT "OrigemComercialPedido_resposta_check" CHECK ("primeiraRespostaEm" IS NULL OR ("contatoRecebidoEm" IS NOT NULL AND "primeiraRespostaEm">="contatoRecebidoEm"))
);
CREATE INDEX IF NOT EXISTS "OrigemComercialPedido_origem_idx" ON "OrigemComercialPedido"("origem");
