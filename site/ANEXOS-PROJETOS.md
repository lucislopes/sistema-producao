# Anexos temporários de projetos

No orçamento público, escolha até 3 arquivos PDF, JPG ou PNG de até 5 MB cada, ou informe um link de Drive/OneDrive. Clique em **Revisar solicitação**, confira materiais, serviços, peças, quantidades e prazo, e então **Confirmar e enviar**. Se o anexo falhar, o orçamento continua registrado: repita apenas os anexos pendentes ou continue sem eles.

Em **Site / Marketing → Comercial**, o administrador acompanha a ocupação e abre o orçamento para baixar arquivos. A data de exclusão aparece junto a cada arquivo. Os arquivos expiram 30 dias após o envio; orçamentos e metadados são preservados. Downloads exigem login de administrador e ficam bloqueados imediatamente após a expiração.

A exclusão do arquivo roda na inicialização do backend e a cada hora, em lotes de até 200 registros. O backend deve estar ativo; depois de uma parada, retoma a limpeza na inicialização. A pasta privada `UPLOAD_DIR/anexos-orcamentos` tem limite de 250 MiB / 500 arquivos, separado da cota de imagens do site. Há alerta de ocupação em 80% e reserva de 256 MiB livres no disco.

Envios exigem autorização vinculada ao orçamento, válida por 30 minutos, sem acesso de download. Um processamento de upload por vez, sem fila ilimitada. A gravação, deduplicação, cota e limpeza compartilham trava PostgreSQL entre processos. Imagens são decodificadas e convertidas para WebP estático, removendo metadados. Outros formatos, incluindo SVG/ZIP, não são aceitos. PDF tem assinatura e final verificados; não há antivírus nem interpretação semântica, e downloads são sempre forçados como attachment, com no-store e nosniff.

Na futura publicação: aplicar a migration `20261006040000_anexos_temporarios_site` após backup, manter essa pasta fora de rotas estáticas/CDN e **excluir os anexos temporários de backups permanentes de uploads**, ou aplicar retenção compatível. A limpeza não apaga cópias externas. Links de Drive/OneDrive não são copiados para o servidor; confira as permissões de acesso da equipe.

Continua somente local. Testes de integração criam dados e diretórios descartáveis próprios; verificam acesso, duplicatas, limites, downloads, expiração e preservação do orçamento.
