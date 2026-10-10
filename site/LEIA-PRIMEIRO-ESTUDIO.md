# Ferramad — atualização visual e Estúdio de Marketing (teste)

## Entrega

- `index.html` e `modernizacao.css`: acabamento visual adicional da Home, carrossel, cards de ofertas e serviços.
- `estudio.html`, `estudio.css`, `estudio.js`: editor de campanhas que roda no navegador sem backend. Três modelos: Impacto, Premium e Moderno. Permite editar dados, enviar uma foto, selecionar Feed/Stories/quadrado, visualizar e baixar PNG e copiar legenda.
- `build.mjs`: copia esses arquivos para `dist/` ao executar `npm run build`.
- Todo o restante do site original permanece no pacote.

## Como testar sem arriscar o sistema de produção

1. Guarde um backup da versão do site que está no ar.
2. Extraia este ZIP para uma pasta **separada** do seu projeto em produção.
3. Abra um terminal nessa pasta (`site/`) e execute `npm run build`.
4. Sirva o diretório gerado `dist/` com um servidor HTTP estático em ambiente de teste; por exemplo, se tiver Python, `python -m http.server 8080 --directory dist`.
5. Acesse `http://localhost:8080/estudio.html` para editar as artes e `http://localhost:8080/` para conferir a Home. As informações que dependem da API real podem aparecer vazias no teste isolado.

## Limitações importantes

**Esta é uma versão demonstrativa funcional do editor**, não a integração administrativa final. O ZIP disponibilizado contém o frontend do site, sem o backend completo do Sistema de Produção. Por esse motivo:

- O editor não faz login nem publica no site ou Instagram.
- Não guarda campanhas no banco, não implementa aprovação/agendamento e não altera promoções existentes.
- O arquivo `estudio.html` não deve ser disponibilizado como área administrativa da produção; nesta versão qualquer pessoa que tenha a URL poderia abrir o editor local, embora não tenha recursos para enviar dados ao servidor.
- Para concluir a integração, é necessário aplicar alterações seguras no backend (autenticação, permissões, modelos Prisma, APIs e upload seguro).
- A imagem sem upload é uma ilustração geométrica gerada pelo próprio editor. Para campanha real, carregue uma foto real do produto ou serviço.

## Implantação

Apenas depois de homologação, atualize o frontend usando o fluxo normal de build/deploy do seu projeto e mantendo um backup. Não substitua o backend, banco de dados ou configuração nginx automaticamente com este ZIP.
