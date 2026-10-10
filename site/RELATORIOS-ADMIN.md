# Relatórios administrativos no site

No rodapé, clique em **Acesso administrativo** (página `admin.html`). Use o e-mail e a senha existentes de um administrador do sistema. Usuários de outras funções não acessam os relatórios.

O período inicial cobre o ano atual até hoje. É possível consultar até 366 dias por vez. Orçamentos usam a data de recebimento; pedidos usam a data do pedido. A situação é a atual, não uma fotografia histórica daquele período.

A conversão considera os orçamentos recebidos no período que já geraram pedidos. O primeiro atendimento mede a média entre recebimento e o primeiro registro de atendimento, excluindo solicitações ainda não atendidas. Não é tempo de resposta do WhatsApp.

Os atrasos mostram pedidos atualmente pendentes com previsão anterior ao dia de hoje, em todos os períodos. O armazenamento e os anexos com vencimento em sete dias também mostram a situação atual geral.

O painel é somente de consulta, com 20 orçamentos por página. Não faz atualização automática em segundo plano. A autenticação fica em memória nesta página; sair, recarregar ou ficar 15 minutos sem interação exige entrar novamente.

## Publicação futura

Ainda em teste local. O build inclui `admin.html`, `admin.js` e `admin.css`. Na VPS, encaminhar `/api/auth/login` para `/auth/login` e `/api/site-relatorios` para `/site-relatorios` no backend, preservando Authorization e o limitador de login. Usar HTTPS e evitar cache dessas respostas. Aplicar a migração do índice de data dos pedidos junto das demais migrações.

## Visão integrada de produção

O filtro Todos/Site/Sistema classifica os pedidos pelo vínculo com OrcamentoSite.pedidoId. Site contém os vinculados; Sistema contém os demais. A lista de pedidos tem paginação independente de 20 registros. Não existe um módulo separado de orçamentos internos nesta versão; o filtro Sistema não inventa orçamentos.

Planos, chapas programadas e serviços usam os pedidos do período selecionado e excluem pedidos cancelados. São situações atuais, não produtividade executada entre as datas. O valor dos pedidos exclui cancelados e não representa faturamento ou pagamentos recebidos.
