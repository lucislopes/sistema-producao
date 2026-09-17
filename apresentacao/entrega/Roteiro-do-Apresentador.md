# Roteiro de apresentação

## Sistema de Gestão de Produção para Madeireiras

Material baseado nas telas reais da versão local em 15/09/2026. Todos os clientes, pessoas, documentos e valores utilizados no exemplo são demonstrativos. A capa contém uma ilustração gerada por IA. As regras novas de capacidade estão na versão local e precisam estar publicadas no ambiente usado em uma apresentação ao vivo.

## Como usar

Para uma reunião inicial, percorra o fluxo de pedidos, capacidade, planos, Kanban, expedição e entregues. Escolha os relatórios conforme a necessidade do público. O conjunto completo funciona como guia de consulta e treinamento. Os textos e as notas no PowerPoint são editáveis. As telas são capturas da aplicação.

## Índice

1. Sistema de Gestão de Produção para Madeireiras
2. As perguntas de uma operação organizada
3. O caminho de cada pedido
4. Um exemplo que atravessa a apresentação
5. Dashboard: a situação do dia
6. Pedidos e capacidade diária
7. Consulta de pedidos
8. Origem e fluxo do pedido
9. Dados principais do pedido
10. Entrega, retirada e frete
11. Disponibilidade antes de salvar
12. Como o bloqueio de chapas funciona
13. Como o bloqueio de fretes funciona
14. Detalhes e histórico do pedido
15. Planos e execução da produção
16. Planos de Corte e Serviços
17. Serviços e operadores de cada plano
18. Revisão dos planos cadastrados
19. Kanban: cada cartão representa um serviço
20. Execução do pedido 2401
21. Conclusão da produção
22. Modo TV
23. Alertas de produção
24. Expedição e entregas concluídas
25. Expedição
26. Relatório de entrega
27. Romaneio de entrega
28. Tudo o que já foi entregue
29. Acompanhamento pelo cliente
30. Relatórios para decisões do dia a dia
31. Qual relatório responde à pergunta?
32. Programação de chapas
33. Consumo de chapas
34. Produção
35. Produtividade por operador
36. Serviços
37. Pendências
38. Pedidos em andamento
39. Comercial por vendedor
40. Pontualidade das entregas
41. Pedidos parados
42. Análise de clientes
43. Carteira de pedidos
44. Auditoria de frete
45. Auditoria de cadastro
46. Produção mensal
47. Dashboard de produção
48. Dashboard de expedição
49. Dashboard comercial
50. Cadastros, acessos e configurações
51. Clientes
52. Funcionários e permissões
53. Rotas de entrega
54. Tipos de serviço
55. Configurações da empresa
56. Limites editáveis pelo administrador
57. Senha e encerramento do acesso
58. Telas complementares e roteiro de demonstração
59. Cadastro separado de planos
60. Cadastro separado de serviços
61. Painel complementar do operador
62. Roteiro para a reunião com a madeireira
63. Preparação da operação
64. A rotina da sua madeireira, visível

## 1. Sistema de Gestão de Produção para Madeireiras

Apresente o sistema como uma ferramenta para organizar a rotina entre o atendimento, a produção e a entrega. Todas as telas são reais da versão local. Os nomes e números são fictícios e coerentes entre si. A imagem de capa é uma ilustração gerada por IA, não uma instalação de um cliente.

Fonte: Versão local em 15/09/2026. Capa gerada com image_gen.. Captura da aplicação local e base fictícia em 15/09/2026.

## 2. As perguntas de uma operação organizada

Abra a conversa perguntando como a madeireira responde hoje a essas perguntas. Mostre que pedidos, capacidade, serviços e entregas têm telas próprias. Não prometa ganhos percentuais, redução de custos ou prazos de implantação que ainda não foram medidos.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 3. O caminho de cada pedido

Explique a diferença entre pedido, plano e serviço. Um pedido pode ter vários planos e cada plano pode ter vários serviços. O fluxo Direto para entrega segue para expedição sem etapas de produção.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 4. Um exemplo que atravessa a apresentação

Use o pedido 2401 durante a explicação de cadastro, planos, serviços, histórico e acompanhamento. Os planos 2401-1 e 2401-2 têm respectivamente 8 e 4 chapas. O cadastro contém 24 pedidos, incluindo um cancelado. Os 57 serviços incluem três cancelados. O exemplo demonstra funcionalidades e não resultados reais de uma madeireira.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 5. Dashboard: a situação do dia

Caminho: Principal > Dashboard. O painel principal resume a carteira por status e oferece atalhos. Na base, há 24 pedidos, incluindo sete entregues e um cancelado. Atrasados são um recorte dos pedidos, por isso não devem ser somados como uma situação independente. Abra um pedido prioritário para investigar a causa.

Fonte: frontend/src/pages/Dashboard.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 6. Pedidos e capacidade diária

A primeira parte mostra como cadastrar e consultar um pedido e como os limites orientam a promessa de entrega.

Fonte: Menu e fluxo do sistema. Captura da aplicação local e base fictícia em 15/09/2026.

## 7. Consulta de pedidos

Caminho: Operação > Pedidos. Digite 2401 no campo de busca para localizar Marcenaria Aurora. A listagem mantém as informações de consulta e as ações do registro. Use Editar pedido para abrir o formulário. Para demonstrar sem alterar registros, apenas navegue e não salve mudanças.

Fonte: frontend/src/pages/Pedidos.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 8. Origem e fluxo do pedido

Caminho: Pedidos > Novo pedido. Primeiro escolha a origem. Pedido de outro sistema exige informar manualmente o número externo, sem implicar integração automática. Em seguida escolha se haverá produção. Pedido com produção terá planos e serviços. Direto para entrega segue o fluxo de expedição.

Fonte: frontend/src/pages/Pedidos.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 9. Dados principais do pedido

Continue o formulário em Dados principais. O exemplo usa Marcenaria Aurora, Ana Martins, 18/09/2026 e R$ 4.140,00. Confira os campos obrigatórios antes de salvar. A data prevista também é a referência usada pela capacidade diária. A quantidade de chapas de produção vem dos planos vinculados.

Fonte: frontend/src/pages/Pedidos.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 10. Entrega, retirada e frete

No bloco Entrega, Empresa entrega habilita responsável pelo frete, rota, valor, recebedor, contato e endereço. Frete da loja e frete do cliente são categorias separadas do responsável pelo frete. Cliente retira é uma opção de recebimento distinta, que não ocupa vaga de frete. O sistema considera um pedido com entrega como um registro de frete, independentemente da quantidade de chapas.

Fonte: frontend/src/pages/Pedidos.jsx; frontend/src/components/CapacidadeDiaria.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 11. Disponibilidade antes de salvar

O painel Capacidade da data de entrega apresenta registros já salvos. Nesta data, há uma vaga de frete da loja, três vagas de frete do cliente e cinco chapas disponíveis. O total já inclui o pedido em edição quando ele pertence à data. Alterações ainda não salvas não entram na indicação. Atualizar disponibilidade busca os números novamente. Ao salvar, o servidor verifica a capacidade de novo.

Fonte: frontend/src/components/CapacidadeDiaria.jsx; backend/src. Captura da aplicação local e base fictícia em 15/09/2026.

## 12. Como o bloqueio de chapas funciona

Os números exemplificam a regra configurada em 90 chapas. A contagem soma os planos dos pedidos com produção na mesma data prevista de entrega e ignora cancelados. Um pedido novo ainda sem plano não reserva uma quantidade de chapas desconhecida. A validação ocorre quando os planos passam a ocupar a capacidade. A mudança de data verifica as chapas já vinculadas. Não é apenas um alerta no relatório. O servidor impede o salvamento que aumenta a ocupação além do limite. Reduzir a ocupação ou editar sem aumentá-la continua permitido.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 13. Como o bloqueio de fretes funciona

O limite usa a data prevista de entrega do pedido e o responsável pelo frete. Há uma contagem para loja e outra para cliente. São cotas independentes. O sistema confere o pedido ao salvar e nas mudanças que aumentam a ocupação, como trocar a data ou o responsável. Pedidos cancelados não contam. Entregues continuam contando na data prevista. Mesmo administradores respeitam o bloqueio, mas podem editar a configuração.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 14. Detalhes e histórico do pedido

Caminho: Pedidos > detalhes. O histórico reúne eventos como criação do pedido, criação de plano e mudanças de situação, com data e usuário. No exemplo, o pedido nasceu em 01/09, recebeu planos em 03/09 e tem registro de mudança para produção em 12/09. Use o histórico para explicar uma alteração e localizar o responsável pelo registro.

Fonte: frontend/src/pages/DetalhePedido.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 15. Planos e execução da produção

Agora acompanhe o pedido 2401 em dois planos de corte e nos serviços associados.

Fonte: Menu e fluxo do sistema. Captura da aplicação local e base fictícia em 15/09/2026.

## 16. Planos de Corte e Serviços

Caminho: Operação > Planos de Corte e Serviços. Selecione 2401 e confira cliente, status, entrega e vendedor. O painel mostra 85 chapas programadas e cinco disponíveis para a data. Cadastre cada plano com número único e sua quantidade. Encabeçamento em metros e compra externa complementam o registro quando aplicáveis. O sistema registra os planos, mas esta tela não demonstra otimização automática de corte.

Fonte: frontend/src/pages/PlanoCorteServico.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 17. Serviços e operadores de cada plano

Na mesma tela, vá a Serviços do Plano. Marque Corte, Fita de borda e Furação quando o plano exigir essas etapas. Cada serviço aceita observação e operador. Ao criar com operador, o serviço inicia como Iniciado. Sem operador, fica Aberto. Confirme a seleção antes de salvar. Um número digitado com barras permanece um único número de plano, não cria vários registros automaticamente.

Fonte: frontend/src/pages/PlanoCorteServico.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 18. Revisão dos planos cadastrados

A seção Planos e Serviços Cadastrados permite conferir o que pertence ao pedido. No exemplo, cada plano tem Corte, Fita de borda e Furação. Evite multiplicar chapas pela quantidade de serviços ao falar do volume físico. O administrador pode editar conforme as regras da tela. Para outros perfis, o cadastro de novos planos tem janela de uma hora a partir do primeiro plano. Pedidos entregues ou cancelados restringem alterações.

Fonte: frontend/src/pages/PlanoCorteServico.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 19. Kanban: cada cartão representa um serviço

Caminho: Produção > Kanban. Explique que um pedido aparece em vários cartões porque possui serviços em diferentes planos. O painel separa aguardando, em produção e finalizados. As ações são botões nos cartões. Não apresente movimentação por arrastar e soltar. O quadro exclui pedidos entregues e cancelados e atualiza periodicamente enquanto está visível.

Fonte: frontend/src/pages/Kanban.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 20. Execução do pedido 2401

Use a busca 2401. O exemplo tem Corte concluído, Fita de borda em produção e Furação aberta nos dois planos. Iniciar e Concluir registram a evolução. Ações de retorno e reabertura permitem corrigir o andamento conforme as permissões. A transferência de operador pelo administrador solicita justificativa. Demonstre qualquer mudança ao vivo apenas em uma base de demonstração.

Fonte: frontend/src/pages/Kanban.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 21. Conclusão da produção

A situação do pedido acompanha o conjunto de seus serviços. Concluir apenas um serviço não significa concluir o pedido inteiro. O fluxo automático considera todos os serviços relacionados. Após a produção, a equipe de expedição ainda precisa registrar as etapas da entrega. Pronto para entrega não significa entregue.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 22. Modo TV

O Modo TV apresenta o acompanhamento da produção em uma visão apropriada para exibição no setor. Use-o como apoio para acompanhar a fila durante o expediente. As ações operacionais continuam nas telas autorizadas aos usuários. A tela usa os mesmos registros, evitando uma lista paralela.

Fonte: frontend/src/pages/ModoTV.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 23. Alertas de produção

Caminho: Relatórios > Alertas de Produção. Leia a situação indicada e abra o pedido correspondente para entender o problema antes de alterar registros. Os avisos apoiam a priorização. A lista depende dos dados e critérios do sistema, não substitui a conferência da equipe no chão de fábrica.

Fonte: frontend/src/pages/Alertas.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 24. Expedição e entregas concluídas

Esta parte responde à necessidade de consultar o que já foi entregue, tanto com frete da loja quanto com frete do cliente.

Fonte: Menu e fluxo do sistema. Captura da aplicação local e base fictícia em 15/09/2026.

## 25. Expedição

Caminho: Operação > Expedição. A equipe consulta os pedidos e executa as ações de expedição conforme a situação atual. Confira se será entrega ou retirada e revise os dados do recebedor. Registre a conclusão somente depois da entrega ou retirada efetiva. A operação alimenta o histórico e os relatórios de pedidos entregues.

Fonte: frontend/src/pages/Expedicao.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 26. Relatório de entrega

Caminho: Relatórios > Entrega. Use a relação para consultar a programação de entregas e seus dados operacionais. A tela de relatório apoia a consulta e impressão. O registro do andamento ocorre na expedição. Confira sempre o escopo e os filtros da tela antes de comparar com outros relatórios.

Fonte: frontend/src/pages/RelatorioExpedicao.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 27. Romaneio de entrega

Caminho: Relatórios > Romaneio de Entrega. Mostre a relação de pedidos para apoiar a preparação da saída. Confira endereço, responsável e contatos antes de imprimir. O romaneio ajuda a equipe a levar as informações de entrega. A impressão por si só não deve ser apresentada como confirmação automática da entrega.

Fonte: frontend/src/pages/RomaneioEntrega.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 28. Tudo o que já foi entregue

Caminho: Relatórios > Pedidos Entregues. Essa é a relação histórica procurada quando a tela operacional mostra apenas pendentes. Combine o filtro de responsável pelo frete com os demais filtros. Consulte separadamente loja e cliente ou mantenha todos. A base ilustrativa contém sete entregues, totalizando R$ 30.870,00. O valor é o total dos pedidos, não apenas o preço do frete.

Fonte: frontend/src/pages/RelatorioPedidosEntregues.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 29. Acompanhamento pelo cliente

A página pública de acompanhamento dispensa login do funcionário. O cliente informa número e cinco primeiros dígitos do CPF ou CNPJ cadastrado. O pedido 2401 com documento demonstrativo mostra previsão para 18/09/2026, forma de recebimento e histórico. O link pode ser acessado a partir do detalhe do pedido. A marca BIOMADEIRA que aparece nesta tela corresponde ao nome presente na instância atual.

Fonte: frontend/src/pages/AcompanharPedido.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 30. Relatórios para decisões do dia a dia

Os próximos slides funcionam também como um catálogo de consulta. Na apresentação comercial, aprofunde os relatórios ligados às perguntas da madeireira.

Fonte: Menu e fluxo do sistema. Captura da aplicação local e base fictícia em 15/09/2026.

## 31. Qual relatório responde à pergunta?

Use este mapa para escolher os relatórios mais importantes para cada público. Antes de comparar números, alinhe período, status e data de referência. Um relatório pode usar data do pedido e outro pode usar execução do serviço ou previsão de entrega.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 32. Programação de chapas

Caminho: Relatórios > Programação de Chapas. O relatório organiza a programação pela data prevista de entrega, a partir do dia atual. Em 18/09/2026, a base tem 85 chapas. A regra do limite usa a mesma ideia de agrupar as chapas dos planos de pedidos com produção por data. Cancelados ficam fora. Entregues permanecem na contagem de sua data prevista. A proteção ao salvar acontece também em pedidos e planos.

Fonte: frontend/src/pages/RelatorioProgramacaoChapas.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 33. Consumo de chapas

Caminho: Relatórios > Consumo de Chapas. A tela oferece bases como data do pedido e datas da produção. No recorte demonstrativo por pedidos, são 240 chapas de produção e 18 inteiras, totalizando 258, excluindo cancelados. A mesma chapa pode passar por Corte, Fita e Furação. Portanto, somar volumes por tipo de serviço duplica o material e não representa o consumo físico total.

Fonte: frontend/src/pages/RelatorioConsumoChapas.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 34. Produção

Caminho: Relatórios > Produção. Os filtros trabalham com serviços. Concluídos usam data de término, iniciados usam início e abertos usam criação conforme a regra da consulta. O tempo decorrido entre início e fim pode incluir noites e outros períodos sem operação. Apresente-o como tempo registrado, não como horas efetivas de máquina.

Fonte: frontend/src/pages/RelatorioProducao.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 35. Produtividade por operador

Caminho: Relatórios > Produtividade. O ranking mostra os serviços atribuídos aos operadores, conclusões e indicadores. Serviços sem operador não compõem uma comparação individual. A quantidade de serviços, sua complexidade e o tempo decorrido precisam de contexto. O tempo registrado não desconta automaticamente pausas ou horas fora do expediente.

Fonte: frontend/src/pages/ProdutividadeOperadores.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 36. Serviços

Caminho: Relatórios > Serviços. A seleção inicial apresenta apenas pendentes. Na base, são 20 serviços pendentes, sendo 13 abertos e sete iniciados. Desmarcar a opção de somente pendentes permite consultar outras situações conforme os filtros. O relatório ajuda a localizar trabalho específico por tipo ou operador.

Fonte: frontend/src/pages/RelatorioServicos.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 37. Pendências

Caminho: Relatórios > Pendências. O relatório reúne pedidos sem plano, planos sem serviço e serviços pendentes. São ocorrências, não necessariamente pedidos distintos. A relação demonstrativa inclui pedidos de entrega direta entre os sem plano. Interprete a ocorrência conforme o fluxo do pedido antes de exigir um plano de produção. Use busca, CSV ou impressão disponíveis na tela.

Fonte: frontend/src/pages/RelatorioPendencias.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 38. Pedidos em andamento

Caminho: Relatórios > Pedidos em Andamento. Esse relatório considera as situações Aberto, Em separação e Em produção. Ele não representa sozinho toda a carteira ainda não entregue, pois prontos para entrega também pertencem à operação. No exemplo, são 11 pedidos nesse recorte. Use Carteira de Pedidos para a visão mais ampla de pedidos ativos.

Fonte: frontend/src/pages/RelatorioPedidos.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 39. Comercial por vendedor

Caminho: Relatórios Novos > Comercial por Vendedor. O recorte ilustrativo tem 23 pedidos não cancelados e R$ 104.250,00 em valores de pedidos. O ticket médio é R$ 4.532,61. Esses números descrevem a base fictícia e não faturamento fiscal ou recebimento financeiro. Cancelados não entram no cálculo deste relatório.

Fonte: frontend/src/pages/relatoriosNovos. Captura da aplicação local e base fictícia em 15/09/2026.

## 40. Pontualidade das entregas

Caminho: Relatórios Novos > Pontualidade das Entregas. Compare a previsão do pedido com o evento de entrega registrado no histórico. A base possui cinco entregas no prazo em sete avaliadas: 5 ÷ 7 = 71,4%. Registros sem informação histórica suficiente não devem ser tratados como pontuais automaticamente. Esse relatório é a referência para a análise de entregas efetivamente concluídas.

Fonte: frontend/src/pages/relatoriosNovos. Captura da aplicação local e base fictícia em 15/09/2026.

## 41. Pedidos parados

Caminho: Relatórios Novos > Pedidos Parados. O critério está relacionado ao tempo sem mudança de status. Um pedido pode ter alguma atividade registrada sem mudar sua situação. Portanto, a lista é um sinal para investigar, e não prova de ausência total de trabalho.

Fonte: frontend/src/pages/relatoriosNovos. Captura da aplicação local e base fictícia em 15/09/2026.

## 42. Análise de clientes

Caminho: Relatórios Novos > Clientes. A visão gerencial reúne pedidos, valores e recorrência. Valores de cancelados não compõem as vendas válidas. A informação de última compra pode considerar o histórico completo do cliente, enquanto os totais seguem o recorte. Use o contexto dos filtros antes de comparar clientes.

Fonte: frontend/src/pages/relatoriosNovos. Captura da aplicação local e base fictícia em 15/09/2026.

## 43. Carteira de pedidos

Caminho: Relatórios Novos > Carteira de Pedidos. A base demonstrativa apresenta 16 ativos, totalizando R$ 73.380,00. A tela ajuda a acompanhar o trabalho ainda aberto e seus prazos. O valor da carteira é o total dos pedidos ativos, não um saldo de contas a receber. Entregues e cancelados ficam fora desse recorte.

Fonte: frontend/src/pages/relatoriosNovos. Captura da aplicação local e base fictícia em 15/09/2026.

## 44. Auditoria de frete

Caminho: Relatórios > Auditoria de Frete, disponível ao administrador. Compara o valor padrão da rota ao valor cobrado nos pedidos marcados como frete alterado. São três alterações de R$ 20,00 no exemplo, somando R$ 60,00. A justificativa registrada explica o ajuste. Esse relatório não substitui a relação de entregues ou a contagem de capacidade.

Fonte: frontend/src/pages/RelatorioAuditoriaFrete.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 45. Auditoria de cadastro

Caminho: Relatórios Novos > Auditoria de Cadastro. Verifica informações como data, valor e dados necessários à entrega, conforme o fluxo do pedido. O exemplo está completo e mostra zero inconsistências. A ausência de ocorrências é um resultado válido. A ferramenta ajuda a conferir qualidade do cadastro antes da execução.

Fonte: frontend/src/pages/relatoriosNovos. Captura da aplicação local e base fictícia em 15/09/2026.

## 46. Produção mensal

Caminho: Relatórios Novos > Produção Mensal. A tela reúne informações de consumo e produtividade para um período e oferece os botões PDF Resumido e PDF Completo. Na captura, o período vai de 01/09 a 15/09/2026. Mantenha o mesmo intervalo ao reconciliar com os relatórios individuais.

Fonte: frontend/src/pages/relatoriosNovos/RelatorioMensalProducao.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 47. Dashboard de produção

Acesso pelos atalhos do Dashboard. A visão mostra indicadores de produção e ranking. O filtro de datas do ranking não deve ser apresentado como filtro universal de todos os indicadores do painel. Siga a explicação mostrada na própria tela e use os relatórios detalhados para investigar.

Fonte: frontend/src/pages/dashboard/DashboardProducao.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 48. Dashboard de expedição

Acesso pelos atalhos do Dashboard. O painel apoia a visão operacional da expedição. Os indicadores usam o escopo da própria tela. Para analisar se entregas já concluídas ocorreram no prazo, utilize Pontualidade das Entregas. Não compare percentuais de painéis com bases diferentes como se medissem a mesma coisa.

Fonte: frontend/src/pages/dashboard/DashboardExpedicao.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 49. Dashboard comercial

Acesso pelos atalhos do Dashboard. O painel comercial mostra o panorama da base. Nesta versão, o total bruto do painel inclui o pedido cancelado e chega a R$ 107.305,00, enquanto Comercial por Vendedor usa R$ 104.250,00 em pedidos válidos. A diferença é de escopo. Para vendas excluindo cancelados, use o relatório Comercial por Vendedor.

Fonte: frontend/src/pages/dashboard/DashboardComercial.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 50. Cadastros, acessos e configurações

Os cadastros mantêm as informações usadas no dia a dia. O administrador também define os limites e os perfis de acesso.

Fonte: Menu e fluxo do sistema. Captura da aplicação local e base fictícia em 15/09/2026.

## 51. Clientes

Caminho: Cadastros > Clientes, para administrador. Cadastre nome, documento e contatos. Esses dados alimentam a seleção no pedido e o acompanhamento público. Confira o CPF ou CNPJ porque a consulta do cliente usa os primeiros dígitos do documento cadastrado. Todos os nomes e documentos mostrados são demonstrativos.

Fonte: frontend/src/pages/Clientes.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 52. Funcionários e permissões

Caminho: Cadastros > Funcionários. As funções disponíveis são ADMIN, VENDEDOR, OPERADOR e VENDEDOR_OPERADOR. O perfil controla os menus e ações autorizadas. O administrador gerencia usuários, situação ativa e redefinição de senha. Distribua acessos conforme a responsabilidade de cada pessoa. Não use a conta administrativa para demonstrar que todos os usuários têm os mesmos menus.

Fonte: frontend/src/pages/Funcionarios.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 53. Rotas de entrega

Caminho: Cadastros > Rotas. Os exemplos são Centro, Zona Norte e Zona Sul, com valores fictícios. O valor padrão serve de referência no pedido e na auditoria quando houver alteração. O cadastro de rotas não deve ser apresentado como cálculo automático de percurso ou otimização de transporte.

Fonte: frontend/src/pages/RotasEntrega.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 54. Tipos de serviço

Caminho: Cadastros > Tipos de Serviço. A base utiliza Corte, Fita de borda, Furação e Usinagem. Os tipos alimentam a seleção ao cadastrar serviços do plano e os filtros da produção. Padronize os nomes para facilitar consultas e comparações.

Fonte: frontend/src/pages/TiposServico.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 55. Configurações da empresa

Caminho: Sistema > Configurações. Os dados da empresa e a logo são usados nos cabeçalhos das impressões contempladas pela tela. A configuração é administrativa. O cadastro não implica que todos os textos fixos de marca da aplicação sejam automaticamente substituídos.

Fonte: frontend/src/pages/ConfiguracaoEmpresa.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 56. Limites editáveis pelo administrador

Caminho: Configurações > Limites diários. Somente administradores editam os três limites. Em branco desativa o limite correspondente. Zero bloqueia novos agendamentos que ocupem aquela capacidade. Reduzir o limite não cancela registros existentes e pode deixar uma data acima do novo teto. O sistema impede aumentos adicionais, mantendo possíveis correções que não aumentem a ocupação. As regras demonstradas pertencem à versão local preparada para apresentação. A publicação dessa versão no ambiente de produção é uma etapa separada.

Fonte: frontend/src/pages/ConfiguracaoEmpresa.jsx; frontend/src/components/CapacidadeDiaria.jsx; backend/src. Captura da aplicação local e base fictícia em 15/09/2026.

## 57. Senha e encerramento do acesso

Caminho: rodapé do menu > Alterar Senha. Cada usuário pode alterar sua senha conforme o formulário. O administrador também dispõe de gestão de senha nos funcionários. Ao demonstrar, não projete credenciais reais nem preencha senhas pessoais. O botão Sair encerra o acesso daquela sessão.

Fonte: frontend/src/pages/MinhaSenha.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 58. Telas complementares e roteiro de demonstração

As próximas telas complementam o cadastro integrado. Os caminhos diretos existem na versão atual, mas não aparecem todos no menu principal.

Fonte: Menu e fluxo do sistema. Captura da aplicação local e base fictícia em 15/09/2026.

## 59. Cadastro separado de planos

Rota complementar: /planos-corte. A tela existe na versão atual e permite trabalhar com os planos separadamente. O menu principal direciona o uso rotineiro para Planos de Corte e Serviços. Use este caminho quando a operação desejar separar a manutenção de planos da seleção de serviços. A validação de capacidade também se aplica aqui.

Fonte: frontend/src/pages/PlanosCorte.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 60. Cadastro separado de serviços

Rota complementar: /servicos-plano. A tela permite consultar e manter os serviços de um plano separadamente. O primeiro passo é selecionar o contexto do pedido e do plano. A imagem mostra o contexto selecionado na base de demonstração. No fluxo apresentado anteriormente, a tela integrada realiza o cadastro de plano e serviços juntos.

Fonte: frontend/src/pages/ServicosPlano.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 61. Painel complementar do operador

Rota complementar: /operador. O painel existe como outra visão operacional dos serviços. Na navegação principal desta versão, o Kanban é o caminho destacado para a produção. Apresente este painel como recurso complementar disponível, sem afirmar que ele possui um atalho visível para todos os perfis.

Fonte: frontend/src/pages/PainelOperador.jsx. Captura da aplicação local e base fictícia em 15/09/2026.

## 62. Roteiro para a reunião com a madeireira

Sugestão de condução: faça a demonstração principal em cerca de 15 a 20 minutos, ajustando ao público. Esse tempo é uma proposta para a reunião, não um prazo de implantação. Use o restante do material para responder a perguntas. Peça exemplos concretos da operação: volume diário, responsáveis, filas de serviço e organização da entrega.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 63. Preparação da operação

Proponha uma validação acompanhada com registros representativos antes do uso amplo. Os limites 4, 4 e 90 são exemplos, não recomendações universais. Cada madeireira deve definir valores compatíveis com sua equipe e logística. Confirme a versão publicada e as configurações antes de demonstrar regras novas em produção.

Fonte: Telas e regras do sistema local. Captura da aplicação local e base fictícia em 15/09/2026.

## 64. A rotina da sua madeireira, visível

Finalize com uma pergunta ligada ao processo do prospect. Retome a tela mais relevante e combine os dados necessários para uma demonstração específica. Todos os números deste material são demonstrativos.

Fonte: Sistema local e necessidades relatadas pelo usuário. Captura da aplicação local e base fictícia em 15/09/2026.

