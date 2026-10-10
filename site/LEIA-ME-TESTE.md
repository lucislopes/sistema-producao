# Ferramad — versão visual modernizada

Esta entrega altera apenas a apresentação do site público: `index.html`, `pagina.html`, `modern.css` e `build.mjs`. Os demais arquivos são cópias da versão enviada.

## Teste local

1. Extraia o ZIP.
2. Entre na pasta `site` extraída (`ferramad_site_moderno`).
3. Execute `npm run build` e `npm run dev`.
4. Acesse o endereço informado no terminal (consulte `CONFIGURACAO-LOCAL.md` para API, portas e ambiente).

Se a API não estiver disponível, catálogo, orçamento, pedidos e campanhas dependentes da API não poderão ser validados completamente.

## Publicação segura

NÃO copie diretamente para produção sem homologação. Faça backup, compare com a versão ativa e valide: menu mobile, catálogo, orçamento, anexos, login, pedidos, anúncios e links. Mantenha a configuração e as variáveis de ambiente da VPS atual. O `modern.css` é uma camada reversível; remover os links dele e restaurar `index.html` / `pagina.html` reverte a apresentação.

Não alteramos endpoints, modelo de dados, autenticação ou serviços do backend.
