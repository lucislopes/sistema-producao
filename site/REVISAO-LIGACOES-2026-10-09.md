# Revisão das ligações do site — 9 de outubro de 2026

## Onde editar cada informação

| Informação exibida | Cadastro responsável | Regra |
| --- | --- | --- |
| Nome, logo, telefone, e-mail, WhatsApp, cores e redes | Configuração do site | Identidade e contatos estruturados compartilhados pelo site; nome, logo, telefone e e-mail também são usados no sistema. |
| Título, descrição, chamada e foto da abertura | Textos e imagens | Banners não substituem mais os textos da abertura; remover a foto oculta esse espaço. |
| Destaques no topo | Banners | Somente ativos; imagem, título, subtítulo e botão pertencem ao próprio banner. |
| Nossa trajetória: título, texto e foto | Páginas e serviços → História | Primeira página ativa pela ordem, título e ID. Sem História ativa, usa Textos e imagens. |
| Contato: título, apresentação e foto da equipe | Páginas e serviços → Contato | Mesma prioridade da História. Endereço, horário e contatos estruturados continuam nos cadastros compartilhados. Texto livre de página não é reescrito automaticamente ao alterar telefone/endereço. |
| Cabeçalho e foto geral da Central de Serviços | Textos e imagens | Independentes das fotos de cada serviço. |
| Serviços: cartões e páginas de detalhes | Páginas e serviços → Serviço | Ativos substituem os serviços básicos; títulos, descrições e imagens vêm da mesma página. |
| Marcas | Páginas e serviços → Marca | Cartão leva ao detalhe pelo slug cadastrado. |
| Localização | Páginas e serviços → Localização | Página própria. Mapa compartilhado usa o local no mapa de Textos e imagens. Sem página, usa o endereço cadastrado. |
| Materiais, máquinas e ferramentas | Produtos e equipamentos | Somente ativos, com categoria ativa ou sem categoria. Preço, foto, descrição e especificações vêm do produto. |
| Filtros, foto e descrição da categoria | Categorias | Somente ativas; foto e descrição aparecem ao selecionar a categoria. |
| Promoções | Promoções e anúncios | PUBLICADO e dentro da validade. Capa gerada tem prioridade sobre a fotografia; galeria preserva a ordem. |
| SEO | Textos e imagens | Título e descrição da página inicial; detalhes usam o título da própria página. |
| Relatórios do site | Área da Empresa → Relatórios | Orçamentos, atendimento e conversão; visão executiva fica no sistema. |

Os campos institucionais controlados por páginas ativas ficam bloqueados no editor de Textos e imagens, com indicação do cadastro correto. A prévia usa a mesma composição da home. Selecionar/enviar uma imagem exige salvar o formulário para aplicá-la.

## Correções

- Composição compartilhada de história e contato para eliminar divergências entre home e prévia.
- Preservação dos textos de abertura quando há banners.
- Retirada da capa gerada antiga ao modificar fotos, textos, preços ou aparência da promoção. O editor avisa para gerar outra capa ou usar a fotografia atual.
- Prévia de leitura disponível com CONFIGURACAO_SITE, CONTEUDO ou PROMOCOES, inclusive com site desativado, sem conceder permissão de escrita adicional.
- Upload de conteúdo e logo da arte usam permissões adequadas, separadas da configuração do site.
- Exibição dos dados de categorias ao filtrar o catálogo.
- Filtro por slug nos detalhes de produto e manutenção das ações comerciais.
- Consulta sem cache nas páginas e cadastros; títulos institucionais de detalhe correspondem ao registro publicado.
- Endereço antigo admin.html encaminha para os relatórios específicos da Área da Empresa.

## Validação

As seis APIs públicas e 20 arquivos de imagem locais foram consultados, sem falhas. O cadastro atual tem 9 páginas e 6 produtos publicados. Não há imagens externas nesse conjunto.

Foram verificados no navegador a composição institucional, os destinos das âncoras, o filtro de categoria e a navegação para História. Testes automatizados cobrem publicação, ordenação, remoção de foto, fallback, permissões, upload, catálogo, capas, galerias e ações de orçamento/WhatsApp. As compilações do site e do sistema passaram.

Para repetir a checagem de arquivos e APIs locais:

```powershell
cd C:\sistema-producao\site
node auditarLigacoes.mjs
node --test
```

A revisão é do código e ambiente local. Deploy, dados e configuração do site online ainda precisam ser validados quando essas alterações forem publicadas. Não foram enviados orçamentos, mensagens ou publicações ao Instagram durante a revisão.
