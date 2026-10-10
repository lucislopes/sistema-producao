# Fluxo comercial e Área do Cliente — testes locais

## Onde usar

- Site: formulário de orçamento registra uma solicitação com protocolo. A lista de corte e os materiais ficam associados ao orçamento. WhatsApp passa a ser uma opção de conversa **depois** da confirmação do registro.
- ADMIN: **Site / Marketing → Atendimento e clientes**, `/site/comercial` no painel.
- Site: **Área do Cliente**, `#area-cliente`; consulta individual continua em `#consultar-pedido`.

## Atendimento

Fila com Novo, Em análise, Enviado, Aprovado e Perdido. Abra a solicitação, selecione responsável, informe proposta, valor e nota interna, depois salve. A primeira atualização registra o tempo até atendimento. Abrir uma proposta no WhatsApp não confirma envio; o operador precisa conversar com o cliente e manter a situação atualizada.

Após salvar como Aprovado, selecione cliente e vendedor existentes, previsão confirmada e forma de recebimento. Se o cadastro não existir, crie em Clientes. Converter cria apenas um pedido por orçamento, respeita limites de produção/fretes e registra histórico. A lista de corte vai nas observações; precisa de revisão pela produção antes de montar planos. Não há cálculo de aproveitamento, baixa de estoque ou plano de corte automático. A data desejada pelo cliente não é promessa de entrega.

Pedidos prontos aparecem na seção de avisos. Prepare a conversa no WhatsApp e use **Confirmar que avisei o cliente** somente após contato. Não há envio automático, provedor WhatsApp, SMTP ou confirmação de leitura conectados. O registro identifica usuário e horário.

Indicadores dos últimos 30 dias: solicitações, pedidos convertidos e tempo médio até primeira atualização. Fila e avisos têm páginas de 20 registros; orçamentos carregam os detalhes somente ao abrir. Avisos pendentes aparecem primeiro.

## Área do Cliente

O ADMIN busca o cliente e gera um convite válido por 24 horas. O cadastro precisa conter CPF/CNPJ completo. Entregue o link **ao contato cadastrado**; não publique o convite. A aplicação não o envia por conta própria. Ele fica no fragmento da URL, não no caminho da requisição, e é removido da barra após abertura.

O próprio cliente confirma seu documento e define uma senha de pelo menos 10 caracteres (máximo de 72 bytes). Convite de uso único; somente o hash é guardado no banco. Novo convite invalida a senha/sessões anteriores até a nova ativação. Recuperação de senha utiliza novo convite emitido pela equipe. Revogar acesso encerra também as sessões existentes.

Login por documento e senha; sessão de uma hora mantida apenas na memória da página. Recarregar exige login novamente. Tokens possuem audiência separada e não dão acesso às APIs administrativas. CPF/CNPJ duplicado em mais de um cadastro bloqueia login; regularize o cadastro.

Listagem paginada (20 por página), pedidos em andamento primeiro, detalhes e histórico. O servidor aplica o vínculo `clienteId` em toda consulta. Recompra traz as peças do orçamento de origem, quando disponível, para revisar no formulário. Pedidos antigos sem orçamento de origem exigem nova descrição. Solicitar novamente cria **novo orçamento**, sujeito à conferência de disponibilidade e valores, e não duplica automaticamente um pedido.

## Banco e operação

Migration aditiva `20261006010000_fluxo_comercial_site`, aplicada somente no banco local depois de backup. Novas tabelas: OrcamentoSite, AcessoClienteSite, AvisoPedidoSite. Não altera pedidos anteriores. Prisma client regenerado; backend local reiniciado.

Rotas novas: públicas `/atendimento-site/*`; administrativas `/comercial-site/*`, exclusivamente ADMIN. Proxy local do site permite os caminhos específicos de atendimento e mantém o limite de 40 KB. Na futura VPS, manter o encaminhamento `/api/`, HTTPS, backup do banco e volume de imagens. Nada foi implantado na VPS.

Validação: builds do site/painel, testes de payload e teste integrado local de protocolo idempotente, conversão única, aviso manual, indicadores, convite de uso único, login, isolamento de cliente, recompra, revogação e rejeição de token de cliente na API ADMIN. Dados temporários removidos ao terminar.

```powershell
cd C:\sistema-producao\backend
$env:RUN_SITE_DB_TESTS='1'
node --test test/orcamentoSite.test.js test/comercialSite.integration.test.js
```
# Acesso preparado a partir do pedido

Administradores veem **Preparar acesso para WhatsApp** no detalhe de qualquer pedido, após criar um pedido no cadastro e após converter um orçamento. A criação do pedido não envia mensagens. Para pedidos com produção, **Continuar para o plano de corte** mantém a etapa de cadastrar os planos.

A preparação usa o telefone do cadastro, exige CPF/CNPJ completo e site ativo. Quem já tem senha e acesso ativo recebe o link normal, preservando senha e sessões. Quem ainda não ativou o acesso recebe convite aleatório válido por 24 horas; preparar outro convite substitui o anterior. O CPF/CNPJ não é enviado na mensagem e não determina a senha.

O administrador confere a mensagem e clica em **Abrir WhatsApp para enviar**. O envio é manual; essa ação não confirma entrega ou leitura e não marca o aviso de pedido pronto. Nenhuma mensagem é enviada automaticamente nem cobrada por uma integração nesta etapa.

Convites novos abrem `ativar-acesso.html#TOKEN`, uma página dedicada ao documento e criação da senha. O token permanece no fragmento e é removido da barra ao abrir. Links anteriores com `#area-cliente&convite=TOKEN` redirecionam para essa página. A mensagem mantém o endereço sozinho no final; no painel também existem abertura direta e cópia somente do endereço. Endereços locais podem não ser reconhecidos pelo WhatsApp como links e não funcionam para o cliente em outro aparelho; o site precisa ser publicado para esse uso.

Endpoint administrativo: `POST /comercial-site/pedidos/:id/acesso`. Em produção, configure `siteUrl` com o endereço público correto; a ausência desse endereço bloqueia a preparação. Em desenvolvimento, o endereço local padrão é `http://127.0.0.1:5180/`.
