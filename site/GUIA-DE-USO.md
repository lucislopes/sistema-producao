# Guia do site, atendimento comercial e Área do Cliente

Esta versão está somente no computador local. Nada foi publicado na VPS.

## 1. Endereços e permissões

| Onde | Endereço local | Quem usa |
|---|---|---|
| Site público | http://127.0.0.1:5180/ | Visitantes e clientes |
| Sistema interno | http://localhost:5173/ | Equipe com login |
| Atendimento e clientes | http://localhost:5173/site/comercial | ADMIN |
| Configurações do site | http://localhost:5173/site/configuracao | ADMIN |

Entre no sistema com seu usuário administrador. O menu **Site / Marketing** reúne as telas de gestão. Vendedores e operadores não podem editar o site nem liberar acesso à Área do Cliente.

O site precisa da API local funcionando para registrar orçamentos, consultar pedidos e autenticar clientes. O servidor de prévia do site não é o servidor de produção.

## 2. Configurar a empresa e os links

Em **Site / Marketing → Configurações do Site**, confira identidade, logo, cores, contatos, WhatsApp, endereço do site e endereço do sistema. A identidade é compartilhada com a configuração da empresa no sistema.

Para WhatsApp no Brasil, informe DDD e número; o país 55 é acrescentado automaticamente. Exemplo do contato informado nesta conversa: DDD 61 e número 99582-2399. Confira se o número está realmente habilitado no WhatsApp.

Enquanto estiver testando neste computador, use o site `http://127.0.0.1:5180/` e o sistema `http://localhost:5173/`. Links com localhost ou 127.0.0.1 não funcionarão no telefone de outra pessoa: eles apontam para o próprio aparelho de quem abre. Portanto, não envie convites locais a clientes reais esperando que eles consigam acessar.

Quando for publicar, vamos definir os endereços externos e o encaminhamento do Nginx. O domínio informado é `biomadeira.cooperagestao.com.br`, mas a separação definitiva entre site e sistema ainda deve ser aplicada à VPS. Não troque agora um endereço local pelo domínio supondo que ele já serve esta versão.

Marque o site como ativo e salve para usar os recursos conectados. Confira a prévia antes de salvar. Quando ativo, alterações salvas passam a valer para visitantes após recarregar o site; não existe uma etapa separada de aprovação/publicação.

## 3. Alterar frases, foto e contatos

Abra **Textos e Imagem**. Os campos já trazem os textos de exemplo quando não há personalização salva. Edite título principal, serviços, apresentação da empresa, instruções, rodapé e textos para buscadores.

Preencha endereço, horário e orientações de retirada, se desejar mostrá-los. O link de localização deve começar com http ou https. Escolha a foto principal, confira a prévia e salve. Recarregue o site público para conferir o resultado.

Os textos personalizados antigos são preservados. Se algum campo ainda disser “Minha Empresa”, altere esse campo explicitamente; mudar o nome da empresa não reescreve frases já salvas.

## 4. Montar o catálogo e os banners

Comece por **Categorias**. Use nome e URL amigável, por exemplo `mdf-branco`, com letras minúsculas e hífens. Depois cadastre produtos, escolha a categoria, descrição, especificação/espessura e imagem.

Marque **Ativo no site** para publicar. Produtos em categorias inativas ficam ocultos. A ordem menor aparece primeiro; destaque marca o produto como destaque.

Os seis produtos que dizem “exemplo” são fictícios. Você pode editar esses registros ou usar **Retirar do site** e cadastrar outros independentes. Não é necessário ocupar os mesmos espaços. Retirar desativa a publicação e preserva o registro, sem exclusão definitiva.

Em **Banners**, cadastre título, imagem, subtítulo e, opcionalmente, texto e link do botão. Mantenha poucos banners para facilitar a leitura.

O catálogo e os editores têm limite de 500 registros retornados nesta versão. Não trate esse catálogo como um sistema de milhares de itens sem ampliar busca e paginação primeiro. Os produtos do site são comerciais e não fazem baixa de estoque.

## 5. Controlar as imagens

As imagens enviadas ficam no armazenamento do backend, separado do HTML do site. Na VPS precisarão do volume persistente de uploads. Faça backup tanto do banco quanto das imagens.

Envie JPG, PNG ou WebP estático de até 5 MB. O servidor otimiza para WebP: produtos/categorias até 1.200 pixels; banners, logo e imagem principal até 1.920 pixels. Arquivos inválidos ou acima de 40 megapixels são rejeitados. Há limite de 30 tentativas de upload por administrador em 15 minutos, e um processamento de imagem por vez.

Em **Configurações do Site → Armazenamento de imagens**, consulte o uso, atualize o contador e ajuste a cota se houver espaço real no disco. A cota atual é 1.024 MB. O aviso aparece a partir de 80%; novos uploads são bloqueados ao atingir a cota. As imagens existentes continuam disponíveis.

A cota inclui imagens antigas e sem referência. Substituir ou retirar uma imagem não apaga seu arquivo automaticamente. Ainda não existe biblioteca para limpeza segura. A cota não protege o espaço ocupado por banco, backups, logs ou outros programas. Aumentá-la não aumenta o disco da VPS.

## 6. O cliente solicita um orçamento

No site, o cliente pode selecionar materiais e quantidades. No formulário, informa nome, telefone, documento opcional, observações, data desejada e urgência. Pode adicionar até 50 tipos de peças, com material, medidas em milímetros, quantidade e lados com fita.

Ao clicar em **Enviar solicitação de orçamento**, a API registra a solicitação e devolve um protocolo. Depois disso o cliente pode abrir o WhatsApp com a mensagem preparada. O registro do orçamento já aconteceu; o WhatsApp é uma conversa complementar.

Data desejada e urgência são pedidos do cliente, não uma promessa de entrega. Preços, disponibilidade, medidas e fita precisam ser conferidos pela equipe. Não há cálculo automático de aproveitamento de chapas nesta etapa.

## 7. Atender e transformar em pedido

Abra **Atendimento e clientes**. A fila mostra 20 resumos por página. Use **Anterior**, **Próxima** e o filtro de situação para encontrar solicitações antigas. **Abrir** carrega os detalhes.

Escolha responsável, preencha proposta, valor e nota interna, e clique em **Salvar atendimento**. As situações servem para organizar o trabalho:

| Situação | Uso sugerido |
|---|---|
| Novo | Ainda não analisado |
| Em análise | Equipe conferindo materiais e medidas |
| Enviado | Proposta enviada pela equipe |
| Aprovado | Cliente concordou com a proposta |
| Perdido | Atendimento encerrado sem venda |

O botão de WhatsApp prepara a proposta; você ainda precisa enviar. Depois atualize e salve a situação. A primeira atualização registra o tempo até primeiro atendimento. Não escreva notas internas na proposta que será enviada ao cliente.

Salve como **Aprovado** antes de converter. Selecione o cliente correto, vendedor, previsão confirmada e retirada ou entrega. Para entrega, informe quem paga o frete. Se o cliente não existir, cadastre-o em **Clientes** e volte.

Clique em **Criar pedido**. O orçamento só pode gerar um pedido, mesmo se a operação for repetida. As regras existentes de agenda continuam sendo verificadas. A lista de corte vai nas observações; abra o pedido e cadastre/revise planos e serviços no fluxo normal da produção. Converter não cria planos automaticamente.

## 8. Enviar o acesso ao cliente

Depois de criar um pedido como administrador, ou no detalhe de qualquer pedido, use **Preparar acesso para WhatsApp**. O cadastro do cliente precisa ter telefone com DDD e CPF/CNPJ completo.

Confira a mensagem e clique em **Abrir WhatsApp para enviar**. O envio é manual. O endereço fica sozinho no final da mensagem. Também é possível usar **Copiar somente o link** e enviá-lo em uma mensagem separada. Para testar no computador, use **Abrir formulário de criar senha**.

Para quem ainda não ativou o acesso, o link abre diretamente a página `ativar-acesso.html`, com documento, senha e confirmação. A mensagem traz convite aleatório válido por 24 horas. O cliente informa o documento e define uma senha de pelo menos 10 caracteres, respeitando o limite de 72 bytes. Nenhuma senha é calculada a partir do documento.

Para quem já tem acesso ativo, a mensagem traz o número do pedido e o link normal, preservando a senha. Preparar outro convite antes da ativação substitui o convite anterior.

Em pedidos com produção, **Continuar para o plano de corte** leva à próxima etapa. Também é possível continuar sem enviar acesso naquele momento.

## 9. Como o cliente acompanha vários pedidos

O cliente entra no site em **Área do Cliente**, com CPF/CNPJ completo e senha. Vê somente os pedidos vinculados ao seu cadastro, 20 por página, com os pedidos em andamento primeiro. **Ver detalhes** abre histórico e informações de entrega. Notas financeiras internas e nomes de funcionários não aparecem no histórico do site.

Recarregar a página exige login novamente: a sessão dura até uma hora e fica apenas na memória. CPF/CNPJ duplicado em dois cadastros bloqueia o login; a equipe deve regularizar o cadastro correto.

A consulta individual em **Consultar pedido** continua disponível com número do pedido e documento completo. Ela mostra um pedido, sem abrir a conta com todos os pedidos.

## 10. Recompra, recuperação e bloqueio de acesso

No detalhe do pedido, **Revisar e solicitar novamente** leva ao formulário com peças/materiais do orçamento original, quando disponíveis. O cliente confere medidas, contato e disponibilidade e envia uma nova solicitação. É um novo orçamento, sujeito a novo preço e prazo; o pedido antigo não é alterado. Pedidos antigos sem orçamento vinculado exigem preencher/conferir os dados novamente.

Para recuperação, o administrador busca o cliente na seção **Acesso à Área do Cliente** e usa **Gerar convite**. Essa opção invalida a senha e as sessões anteriores: use quando o cliente precisar ativar ou redefinir o acesso. Entregue o link somente ao contato correto.

**Revogar acesso** bloqueia também as sessões existentes. Um novo convite ou a preparação de acesso pelo pedido pode liberar novamente esse cliente; isso exige ação do administrador.

## 11. Avisar que está pronto

Quando o fluxo normal colocar o pedido em **Pronto para entrega/retirada**, ele aparece em **Pedidos prontos para avisar**. A lista é paginada, com avisos pendentes primeiro.

Use **Preparar WhatsApp**, envie a mensagem e só então clique em **Confirmar que avisei o cliente**. A confirmação grava usuário e horário; não envia mensagem, não comprova leitura e não muda o pedido para Entregue. Continue usando Expedição para controlar retirada/entrega.

Esse registro é único por pedido: se um pedido voltar a uma etapa anterior e ficar pronto novamente, o aviso antigo não é zerado automaticamente. A equipe deve conferir o contato nesse caso.

## 12. Ler os indicadores

Os cartões mostram solicitações recebidas nos últimos 30 dias, quantas dessas foram convertidas em pedido e tempo médio até primeira atualização pela equipe. Não são faturamento ou lucro. Sem atendimento registrado, a média aparece sem dados. Reabra a tela para atualizar informações que chegaram de outra sessão.

## 13. Rotina de conferência

Antes de publicar: revisar identidade e textos, substituir exemplos, verificar contatos e links externos, testar um orçamento, conferir sua conversão e planos, testar ativação com um cadastro controlado e acompanhar os avisos de pedido pronto.

Na VPS: servir o site pelo Nginx, usar HTTPS, manter banco e backend protegidos pelo encaminhamento correto, aplicar migrations após backup e conferir disco, memória, CPU e backups. O servidor local da porta 5180 não deve ser usado como servidor público de produção.

O envio automático por WhatsApp, e-mail automático, limpeza de imagens e otimização automática de planos de corte ainda não fazem parte desta versão.
## Central de Serviços e fotos

Em **Site / Marketing → Conteúdo**, o administrador altera os públicos atendidos, os nomes dos softwares, os cinco serviços e as fotos de estoque, produção, fachada e atendimento. Serviços 4 e 5 sem título ficam ocultos; a seção de softwares aparece quando há um nome preenchido. As fotos das seções podem ser removidas sem deixar espaços vazios.

As fotos reais selecionadas foram aplicadas somente à instalação local da Ferramad. São cinco arquivos WebP, cerca de 982 KB no total, com carregamento sob demanda abaixo da abertura. O catálogo continua editável e seus materiais de exemplo continuam identificados como exemplos. Os nomes dos softwares são conteúdo comercial; não representam uma integração técnica com seus serviços.

## Anexos temporários

Consulte [Anexos de projetos](ANEXOS-PROJETOS.md) para envio, conferência, download administrativo e exclusão automática após 30 dias.
