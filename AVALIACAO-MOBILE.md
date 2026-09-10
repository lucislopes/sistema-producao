# Avaliação do uso no celular — 09/09/2026

## Escopo e limites

Revisão estática do frontend local: rotas, layout compartilhado, componentes de interface e padrões das páginas de operação, cadastros, dashboards, relatórios e acompanhamento público. O inventário contém 43 arquivos JSX dentro de pages, incluindo componentes auxiliares; isso não significa 43 telas independentes.

Não foram alterados componentes, regras de negócio, APIs, permissões, banco ou implantação. Este documento é o único arquivo criado nesta avaliação. As alterações de trabalhos anteriores permanecem no projeto.

Não houve acesso ao banco ou navegação na VPS. Não foram executados testes em aparelhos, medição de desempenho em rede móvel ou inspeção visual com dados reais. Os riscos de corte e sobreposição abaixo são identificados pelo código e precisam de reprodução em navegador antes de serem considerados defeitos visuais confirmados. A versão local pode diferir da publicada.

## Diagnóstico

Há uma base responsiva consistente, mas a experiência ainda mistura telas adaptadas ao celular com fluxos pensados para computador. A expedição e o acompanhamento público têm estruturas favoráveis ao celular. A consulta de pedidos, os relatórios, a seleção de serviços e a navegação entre etapas do Kanban ainda exigem esforço adicional em uma tela estreita.

O maior ganho seria melhorar a hierarquia e o acesso às ações, preservando o estilo atual e a versão de computador. Não é necessário alterar o banco para nenhuma das melhorias visuais propostas.

## Pontos positivos

- MainLayout recolhe a navegação abaixo de lg, oferece fundo para fechar o menu, fecha ao trocar de rota e bloqueia a rolagem do corpo enquanto aberto.
- O conteúdo principal usa min-w-0; a busca ocupa uma linha inteira no celular.
- A maioria dos formulários usa uma coluna no celular e aumenta as colunas em telas maiores.
- Table encapsula a rolagem horizontal e avisa que existem outras colunas. Tem nome acessível e foco por teclado.
- Expedição usa cartões com informações e ações que se empilham.
- Pedidos separa consulta e formulário; isso evita exibir todo o cadastro junto da listagem.
- Button tem estado de carregamento, desabilitação e indicação de foco. ConfirmModal empilha os botões no celular.
- Acompanhamento público tem fluxo curto, campos identificados e cartões verticais.
- Busca global e autocomplete atrasam a busca e cancelam requisições anteriores.
- Kanban atualiza em intervalos de 30 segundos e verifica document.hidden antes da atualização automática.
- Há carregamento sob demanda de várias páginas em App.jsx.

## Prioridades

| Prioridade | Local e evidência | Consequência provável | Melhoria proposta |
| --- | --- | --- | --- |
| Alta | Pedidos.jsx:1504 e :1565 — cadastro rápido em sobreposição fixa, sem altura máxima/rolagem interna | Com teclado aberto ou celular na horizontal, campos e ações podem ficar fora da área alcançável | Usar o Modal compartilhado, ajustar altura à área disponível e verificar acesso aos botões com teclado aberto |
| Alta | DetalhePedido.jsx:132 — título e ações lado a lado sem mudança de direção; :286 — descrição e data sem empilhamento, data sem quebra | Cabeçalho e histórico podem ficar comprimidos ou exceder a largura, especialmente com o novo botão de link | Empilhar cabeçalho/ações e data no celular; permitir quebra de textos longos |
| Alta | Pedidos.jsx:1365 — tabela com sete colunas, ações na última | Para abrir ou editar, é necessário procurar a coluna à direita | Cartões apenas na versão móvel, mantendo a tabela de computador e as mesmas permissões |
| Média/alta | Kanban.jsx:343 em diante — colunas viram seções verticais, cada uma com mínimo de 600 px | Para chegar a “Em produção” e “Finalizados”, o operador percorre a fila anterior inteira; colunas vazias também ocupam espaço | Abas por situação no celular com contadores; uma fila visível por vez, preservando as ações atuais |
| Média/alta | PlanoCorteServico.jsx:597 — formulário de serviços dentro de tabela, com colunas de 260 px | Marcar serviço, escrever observação e escolher operador exige deslocamento lateral | Cartão por serviço no celular, com observação e operador abaixo da seleção |
| Média | Pedidos.jsx:1472 e cabeçalhos de RomaneioEntrega, RelatorioExpedicao e ProdutividadeOperadores | Texto, paginação ou ações competem pela largura | Empilhar em telas pequenas; manter ação principal visível |
| Média | Input.jsx e Select.jsx usam text-sm; Button usa min-h-10; links e botões de grupo do menu não têm altura mínima uniforme | Interface densa e alvos de toque inconsistentes | Padronizar texto dos campos em 16 px no celular e alvos principais em aproximadamente 44–48 px; validar o teclado nos aparelhos |
| Média | Clientes, RotasEntrega, TiposServico e cadastros rápidos têm campos identificados principalmente por placeholder | Ao digitar, desaparece a identificação visual; dificulta revisão e acessibilidade | Rótulos persistentes e associados aos campos; teclado apropriado para telefone, e-mail e documento |
| Média | MainLayout.jsx — menu fechado deslocado por transform, sem inert; sem contenção de foco no menu aberto | Links fora da tela continuam potencialmente acessíveis pelo teclado/leitor; o foco pode ir ao conteúdo coberto | Gerenciar foco, conteúdo inativo e retorno ao botão de abertura |
| Média | Modal.jsx — foco inicial e Escape implementados, mas sem contenção de foco ou bloqueio de rolagem do fundo | Interação pode escapar para trás da janela | Completar comportamento do diálogo e testar rolagem/toque, inclusive com teclado |
| Média | Table usa min-w-max e vários relatórios usam truncate sem alternativa de expansão | A tabela cresce com textos longos; dados truncados não têm leitura completa evidente no toque | Detalhe expansível; cartão/resumo móvel nos relatórios de uso diário |
| Baixa | frontend/index.html:2 usa lang="en" para interface em português | Pronúncia e identificação de idioma incorretas em recursos assistivos | Alterar para pt-BR |
| Baixa | Login ocupa min-h-screen, centralizado, sem margem externa responsiva | Acabamento apertado nas laterais e comportamento a conferir com teclado | Respiro externo e altura adequada ao viewport móvel |

As linhas se referem à revisão local desta data e podem mudar. As prioridades expressam impacto de uso, não falhas comprovadas em produção.

## Panorama por área

| Área | Situação pelo código | Direção recomendada |
| --- | --- | --- |
| Login e alteração de senha | Simples; precisam refinar margem, rótulos e interação com teclado | Ajustes pequenos |
| Acompanhamento público | Estrutura favorável ao celular; consulta curta e histórico vertical | Validar telefone real, erro, espera, nomes/números longos e link compartilhado |
| Navegação e busca | Boa adaptação básica; muito conteúdo no menu e foco incompleto | Alvos maiores, hierarquia de atalhos e acessibilidade |
| Dashboard principal e dashboards específicos | Grades adaptativas; alguns indicadores mantêm duas colunas no celular | Conferir títulos/valores longos, reduzir informação secundária quando necessário |
| Pedidos | Formulário responsivo e modos separados; tabela e cadastros rápidos são os gargalos | Cartões móveis, paginação e modais |
| Detalhe do pedido | Grades adaptativas, mas cabeçalho e linha do tempo ainda horizontais | Primeira correção visual sugerida |
| Plano de corte e serviços | Formulário superior adaptativo; edição tabular exige rolagem lateral | Serviços em cartões móveis |
| Kanban | Cartões adequados; distribuição em filas verticais cria rolagem excessiva | Abas por situação no celular |
| Expedição | Uma das estruturas mais adequadas ao celular | Refinar densidade; telefone como ação de ligação, caso desejado |
| Clientes, funcionários, rotas e tipos de serviço | Formulários adaptativos e listagens tabulares | Rótulos permanentes, teclados e ações acessíveis na lista |
| Configuração da empresa | Grade passa para uma coluna; seção de logo separada | Verificar envio de imagem pelo celular e formulários longos |
| Alertas e produtividade | Grades adaptativas; cabeçalho/ações de produtividade precisam atenção | Atraso e ação principal em destaque |
| Relatórios existentes e novos | Filtros geralmente adaptativos, mas saída ainda tabular | Priorizar resumo e detalhe móvel nos relatórios mais usados |
| Romaneio e impressão | Conteúdo naturalmente orientado a documento | Melhorar controles na tela sem alterar layout de impressão |
| PlanosCorte, ServicosPlano e PainelOperador | Rotas presentes; parte dos atalhos está comentada no menu; há grades de duas colunas sem breakpoint nas duas primeiras | Confirmar uso real antes de investir; não excluir nem mudar rotas na revisão visual |
| Modo TV | Projetado para tela grande; linhas com várias colunas e janela de configuração sem limite de altura | Prioridade menor para celular; adaptar configuração/consulta se houver uso real |

## Design e uso cotidiano

O padrão de cartões brancos, fundo cinza, ícones e etiquetas de situação é coerente. Não há motivo para trocar toda a identidade visual. Os ajustes mais úteis são:

1. Evitar repetição de títulos entre o cabeçalho global e a página quando consumir espaço sem ajudar.
2. Mostrar primeiro pedido, cliente, situação, prazo e ação principal; deixar detalhes secundários para expansão.
3. Padronizar espaçamento, botões e cores de situação. O acompanhamento usa verde e a área interna azul; isso é aceitável como separação de áreas, desde que intencional.
4. Evitar depender de hover ou title para revelar informação. O toque precisa de alternativa explícita.
5. Reduzir rolagem antes da lista: filtros recolhíveis, com resumo dos filtros ativos, podem ajudar nas páginas com muitos campos.
6. Preservar a posição da lista ao voltar de um detalhe é uma melhoria a testar nos fluxos reais.

## Conexão móvel e desempenho

Não há medição de desempenho nesta avaliação. Lazy loading, debounce e cancelamento de buscas são pontos positivos. O Kanban evita atualização automática com a página oculta.

Não foi encontrada implementação de service worker/manifest ou indicador global de conexão nos arquivos pesquisados. A interface deve ser tratada como dependente de conexão. Isso não exige transformar o sistema em aplicativo ou permitir alterações offline.

O tratamento de erro da API usa alertas globais. Em rede instável, é preferível revisar quando esses avisos interrompem o usuário e mostrar estado de conexão/última atualização onde fizer sentido. Para operações que gravam, não implementar repetição automática sem avaliar o risco de duplicidade; esse assunto está fora de uma revisão exclusivamente visual.

## Execução segura sugerida

1. Corrigir apenas layout de detalhe, cabeçalhos, paginação e comportamento visual dos modais.
2. Padronizar campos, rótulos, toque e navegação acessível.
3. Criar apresentação móvel de pedidos e serviços, reutilizando dados, ações e permissões existentes.
4. Criar abas móveis no Kanban sem mudar transições de status.
5. Revisar relatórios por frequência de uso. Preservar tabelas e impressão de computador.

Trabalhar localmente e publicar somente após validação. Nenhuma etapa acima precisa de migration ou mudança no banco. Alterações visuais também precisam de teste de regressão: podem esconder ações ou dificultar edição mesmo sem tocar no backend.

## Validação pendente antes de publicar correções

- Larguras 320, 360, 390 e 430 px; tablet 768 px; desktop 1366 px.
- Celular em pé e deitado, teclado aberto, textos ampliados e navegação por teclado.
- Dados simulados com nomes longos, muitos pedidos, histórico extenso e números externos longos.
- Menu aberto/fechado, busca, troca de filtros, paginação, abertura de detalhes e retorno.
- Modais de cliente/rota, confirmação e cancelamento; botões alcançáveis com teclado aberto.
- Estados vazios, carregamento, erro e conexão lenta.
- Perfis administrador, vendedor, operador e vendedor/operador: preservar permissões existentes.
- Impressão e desktop: confirmar ausência de regressões.
- Testes que precisem salvar ou alterar situação devem usar ambiente isolado e dados de teste, nunca produção nesta avaliação.

Conclusão: a base está preparada para receber melhorias graduais. A prioridade é tornar as tarefas frequentes confortáveis no celular, sem redesenhar todo o sistema e sem alterar dados ou regras de produção.
