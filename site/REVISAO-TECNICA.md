# Revisão local de estabilidade e crescimento — 05/10/2026

Escopo: módulos novos do site, CMS, uploads, fila comercial, convites e Área do Cliente; integração com criação e acompanhamento de pedidos. Não substitui auditoria de todas as rotas antigas nem medição da VPS de produção. Nada foi publicado.

## Ajustes realizados nesta revisão

| Ponto | Resultado |
|---|---|
| Fila carregava 500 orçamentos completos | 20 resumos por página, filtro no banco e detalhe sob demanda |
| Avisos de pedidos prontos limitados a uma lista de 500 | Páginas de 20, pendentes primeiro, ordenação determinística |
| Indicadores carregavam registros do mês na memória do Node | Contagens e média calculadas pelo PostgreSQL |
| Login normalizava documento sem índice correspondente | Índice de expressão para CPF/CNPJ normalizado |
| Consultas por cliente/status e fila por data | Índices aditivos, sem alterar registros |
| Processamento caro de senha | Até dois logins/ativações simultâneos por processo; excesso recebe 503 e pode tentar novamente |
| Histórico da consulta individual sem limite | Até 100 eventos recentes; portal também limitado a 100 |
| Histórico do site com descrições internas | Mensagens públicas padronizadas, sem nomes de funcionários ou motivos financeiros |
| Troca rápida de páginas | Ordenação com desempate por ID; proteção contra respostas antigas no painel e cliques simultâneos no portal |
| Limite de tentativas examinava toda a memória em cada requisição | Limpeza geral no máximo uma vez por minuto; expiração da chave consultada conferida em cada requisição |
| Proxy local da consulta não preservava IP | Encaminha IP da conexão local para o limitador |
| Docker sem ambiente de produção explícito | NODE_ENV=production; exige endereço público ao preparar convite |
| Nginx do painel com limite padrão menor que upload | Limite de corpo alinhado às rotas; API continua validando 5 MB para imagem |

Migration nova: `20261006020000_indices_site`, aplicada somente ao PostgreSQL local após backup. Na VPS precisa ser aplicada em janela de manutenção após backup: criar índices em tabelas grandes pode bloquear escritas temporariamente. Não execute a publicação copiando arquivos sem migrations, proxy e volume persistente.

## Evidências

- Suite do backend: 82 testes, 77 aprovados, 5 testes de banco ignorados no comando padrão, nenhuma falha.
- Execução explícita dos três testes de integração novos: configuração, CMS e comercial aprovados.
- Teste comercial cobriu mais de 20 orçamentos, consulta resumida/detalhe, 43 pedidos de um cliente em páginas de 20/20/3, pedidos em andamento primeiro, ausência de repetição de IDs entre páginas, isolamento, convite de uso único, senha preservada ao preparar link de cliente ativo, conversão idempotente, recompra e revogação.
- Builds do site e painel aprovados; schema Prisma válido. Dados temporários removidos/rollback após testes.
- Índices novos confirmados no PostgreSQL local.

Inventário local fora dos testes: 1 cliente, 19 pedidos, 0 solicitações de orçamento, 6 produtos, banco de aproximadamente 11,04 MB e 7 imagens somando aproximadamente 2,26 MB. Cota de uploads: 1.024 MB.

Trinta leituras sequenciais da fila local vazia mediram mediana de 0,44 ms e percentil 95 de 1,17 ms, somente para a consulta Prisma. Esse número não mede HTTP, login, navegador ou carga com grande volume e não prevê o desempenho da VPS. Não foi feito teste de estresse em produção, nem simulação de milhares de clientes simultâneos.

## O que ainda limita crescimento

1. Catálogo/CMS retornam até 500 registros por tipo. As imagens do site usam carregamento tardio, mas uma operação com milhares de produtos exige busca e paginação próprias. Esse limite não representa limite de pedidos no banco.
2. Paginação usa OFFSET, e listas mudando durante navegação podem deslocar itens. Desempate estável evita repetição por datas iguais; navegação muito profunda ou alto volume pode pedir cursores e filtros por período. O parâmetro de página é limitado a 10.000 nesta versão.
3. Não há limite global do tamanho do banco ou retenção automática de orçamentos. Dados históricos crescem no PostgreSQL; backups e logs também consomem disco. Não apagar pedidos comerciais para “liberar memória”.
4. Uploads são comprimidos e têm cota, mas arquivos antigos não são apagados automaticamente. A contagem do espaço percorre os arquivos; dezenas de milhares de arquivos pedem um inventário persistente e limpeza segura. Um processo interrompido durante upload pode deixar a trava de armazenamento, exigindo recuperação técnica após verificar que não há upload ativo.
5. Limitadores de tentativas e de processamento são por processo, em memória; reiniciar zera tentativas e vários processos teriam limites separados. O backend deve ficar atrás do proxy correto para que o IP seja confiável. Escala com múltiplos processos exige coordenação compartilhada/proteção no proxy.
6. A consulta antiga do sistema com cinco primeiros dígitos do documento continua existindo. O novo site exige documento completo na consulta individual e documento + senha na conta. Documento não é um segredo: a conta usa convite seguro e senha; a consulta individual tem acesso mais simples e dados limitados.
7. O aviso de contato é único por pedido; voltar o status e ficar pronto novamente não reinicia automaticamente o aviso.
8. O build ainda avisa sobre um arquivo grande de um relatório antigo. Esse aviso não é falha de build e não significa que o site público carregue esse relatório.

## Conferência antes de publicar na VPS

Verificar a quantidade real de RAM, CPU e disco, versões e processos existentes; medir CPU/memória durante login e upload; medir tempos HTTP e consultas com volume representativo numa cópia do banco. Não foi fixada uma capacidade de usuários simultâneos sem essas medidas.

Servir o site estático pelo Nginx, com HTTPS, compressão e cache dos arquivos/imagens. Não executar Vite ou o servidor local 5180 como servidores públicos de produção. Manter uploads em volume persistente. Conferir domínio do site e do sistema, encaminhamento de /api, IP real e limites de upload. O compose existente expõe portas e contém credenciais de exemplo do PostgreSQL: revisar a topologia e segredos reais antes de reutilizá-lo na VPS; esta revisão não alterou o banco já em produção.

Manter backup do banco e das imagens fora da VPS, com retenção definida e teste de restauração. Acompanhar uso do disco total, memória, CPU e falhas HTTP. A cota de 1 GB de imagens não substitui esse acompanhamento.

Não há trabalho recorrente pesado adicionado: sem varredura periódica de clientes, envio automático de mensagens ou geração automática de planos. O custo adicional ocorre ao abrir páginas, consultar, autenticar ou enviar imagens. A arquitetura reduz a carga com o crescimento, mas não elimina falhas possíveis nem garante capacidade sem medir o ambiente real.

## Anexos de projetos

Retenção de 30 dias, cota separada de 250 MiB / 500 arquivos, 3 arquivos por orçamento, 5 MiB por arquivo, processamento limitado e downloads ADMIN privados. Migration e detalhes operacionais em [Anexos de projetos](ANEXOS-PROJETOS.md).
