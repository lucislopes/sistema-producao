-- Índices aditivos para consultas do portal e fila comercial.
CREATE INDEX "Cliente_documento_normalizado_idx" ON "Cliente" (regexp_replace(COALESCE("documento", ''), '[^0-9]', '', 'g'));
CREATE INDEX "OrcamentoSite_createdAt_id_idx" ON "OrcamentoSite"("createdAt", "id");
CREATE INDEX "Pedido_clienteId_status_updatedAt_idx" ON "Pedido"("clienteId", "status", "updatedAt");
