// Troca apenas ilustrações de exemplo identificadas; novas fotos cadastradas têm prioridade.
const exemplos={
  "/api/uploads/site/produtos/117f33d8-37ae-45ea-bfcb-39841f1dfe13.webp": {
    "slug": "exemplo-branco",
    "url": "./assets/mdf-branco-ilustrativo-v1.webp"
  },
  "/api/uploads/site/produtos/c5e0a1ea-4266-4e10-bc79-63a61864df0a.webp": {
    "slug": "exemplo-carvalho",
    "url": "./assets/mdf-carvalho-ilustrativo-v1.webp"
  },
  "/api/uploads/site/produtos/5833b3f9-a758-48aa-9451-4e7e9749f3d2.webp": {
    "slug": "exemplo-nogueira",
    "url": "./assets/mdf-nogueira-ilustrativo-v1.webp"
  }
};
export function imagemCatalogo(item){const exemplo=exemplos[item.imagemPrincipalUrl];return exemplo&&item.slug===exemplo.slug&&String(item.nome).endsWith(' — exemplo')?exemplo.url:item.imagemPrincipalUrl;}
