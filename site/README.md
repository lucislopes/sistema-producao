# Site público — prévia estática

Interface pública separada do frontend interno, com CMS, recebimento de orçamentos e Área do Cliente conectados à API. Veja [Guia de uso](GUIA-DE-USO.md), [Revisão técnica](REVISAO-TECNICA.md) e [Fluxo comercial](FLUXO-COMERCIAL.md). Os produtos marcados como exemplos são fictícios.

## Prévia local

```powershell
cd C:\sistema-producao\site
npm run dev
```

Abra http://127.0.0.1:5180. Não há dependências para instalar.

## Build

```powershell
npm run build
```

O resultado em `site/dist/` pode ser servido pelo Nginx sem processo Node. O servidor Node fornecido é somente para prévia local. A configuração de produção existente não foi alterada.

## Conteúdo e limites

- `config.js`: identidade e catálogo ilustrativos de fallback da prévia local. Identidade, textos, catálogo e banners cadastrados vêm de `/api/public/`.
- `styles.css`: tokens de cores e apresentação responsiva.
- `assets/logo.webp`: logo fornecida pelo usuário.
- `assets/marcenaria.png`: imagem ilustrativa gerada, não é uma foto real da Ferramad. Os recortes e tratamentos das cards não representam padrões reais de MDF.
- Catálogo, serviços e textos devem ser confirmados com a empresa antes de publicar. Não foram inventados preços, endereço, telefone, promoções ou prazos.
- Filtros, seleção e quantidades funcionam no navegador. Com site ativo, o formulário registra o orçamento na API, confirma protocolo e oferece a conversa no WhatsApp. O envio de mensagens permanece manual.
- Fonte Google Fonts com fallback local; sem analytics e sem cookies.
- O painel interno ADMIN tem configuração, textos/imagem, produtos, categorias e banners. Novos uploads vão para filesystem persistente. O site carrega os dados ao abrir/recarregar.
- Área do Cliente com convite, documento e senha, pedidos paginados, histórico público e solicitação de recompra. Gestão no painel ADMIN.
- Não foi feito deploy na VPS. Antes da publicação, confirmar contatos, catálogo, serviços, domínio e topologia real de Nginx.

## Próxima etapa

Antes da publicação, conferir proxy, HTTPS, contatos e armazenamento, aplicar as migrations novas após backup e medir a VPS real. Biblioteca/limpeza segura de imagens e envio automático de mensagens permanecem para uma próxima etapa.
