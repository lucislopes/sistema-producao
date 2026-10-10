// Textos iniciais do tema, compartilhados pelo editor e pela API pública.
export function textosPadrao(nome = 'Sua empresa') {
  return {
    tituloProjetoSite:'Seu projeto começa no Cortecloud.',descricaoProjetoSite:'Peça o link de acesso à nossa equipe, monte seu projeto e receba o orçamento após a conferência.',
    beneficio1: "Materiais para o seu projeto",
    beneficio2: "Corte nas suas medidas",
    beneficio3: "Acabamento nos detalhes",
    beneficio4: "Mais foco na montagem",
    tituloEquipamentos: "Máquinas e ferramentas.\nMais força para produzir.",
    descricaoEquipamentos: "Encontre equipamentos para sua rotina. Consulte especificações, disponibilidade e condições com nossa equipe.",
    tituloPreparacao: "Uma lista clara. Um projeto bem preparado.",
    preparacao1Titulo: "Medidas em milímetros",
    preparacao1Texto: "Informe comprimento, largura, quantidade, padrão e espessura de cada peça. Identifique as peças pelo nome ou número.",
    preparacao2Titulo: "Bordas e sentido do padrão",
    preparacao2Texto: "Marque quais lados recebem fita de borda e indique o sentido do veio nos padrões amadeirados.",
    preparacao3Titulo: "Furação e conferência",
    preparacao3Texto: "Informe ferragens, posições dos furos e anexos de referência. Confira os dados antes de enviar; a equipe validará a execução e o prazo.",
    tituloConsulta: "Como está\no seu pedido?",
    descricaoConsulta: "Da preparação das peças à entrega, acompanhe cada atualização do seu projeto em um só lugar.",
    tituloAreaCliente: "Seus pedidos.\nSuas próximas ideias.",
    descricaoAreaCliente: "Acompanhe seu histórico e solicite novamente com os ajustes do próximo projeto.",
    orientacaoAreaCliente: "Primeiro acesso? Solicite um convite à equipe. Se esqueceu a senha, peça um novo convite.",

    publicoTitulo: '', publicoTexto: '', softwareTitulo: '', softwareTexto: '', software1Nome: '', software2Nome: '', software1LogoUrl: '', software2LogoUrl: '',
    servico4Titulo: '', servico4Texto: '', servico5Titulo: '', servico5Texto: '',
    imagemCatalogoUrl: '', imagemServicosUrl: '', imagemSobreUrl: '', imagemAtendimentoUrl: '',
    tituloContato: 'Contato e localização', textoContato: 'Para dúvidas e informações, fale com nossa equipe.',
    enderecoContato: '', horarioContato: '', orientacoesRetirada: '', localizacaoUrl: '', localizacaoMapa: '',
    chamadaTopo: 'PARA QUEM TRANSFORMA MADEIRA EM POSSIBILIDADES.',
    chamadaHome: 'A PARCERIA POR TRÁS DO SEU MÓVEL',
    tituloHome: 'Você imagina.\nA gente corta.', destaqueHome: 'Seu projeto ganha forma.',
    descricaoHome: 'MDF, corte sob medida e acabamento para você chegar à oficina com tudo pronto para produzir.',
    botaoHome: 'Vamos tirar seu projeto do papel',
    chamadaCatalogo: 'A MATÉRIA-PRIMA DAS SUAS IDEIAS',
    tituloCatalogo: 'Escolha o começo\ndo seu próximo projeto.',
    descricaoCatalogo: 'Do branco que combina com tudo ao amadeirado que muda o ambiente. Encontre seu ponto de partida.',
    tituloServicos: 'Menos etapas.\nMais tempo para\nfazer bem feito.',
    descricaoServicos: `Você cuida do projeto e da montagem. Conte com ${nome} para preparar os materiais da sua próxima entrega.`,
    servico1Titulo: 'Corte sob medida', servico1Texto: 'Envie as medidas das peças e solicite o corte dos painéis conforme a necessidade do projeto.',
    servico2Titulo: 'Acabamento de bordas', servico2Texto: 'Inclua as bordas na sua solicitação e consulte os padrões e opções de acabamento.',
    servico3Titulo: 'Materiais para marcenaria', servico3Texto: 'Combine painéis e acabamentos em um orçamento pensado para as peças que você precisa produzir.',
    tituloSobre: 'Por trás de um bom móvel,\nexiste uma boa parceria.',
    textoSobre: `Quem trabalha com marcenaria sabe: cada medida importa. ${nome} conecta materiais e preparação de peças à rotina de quem transforma projetos em móveis.`,
    textoSobreComplemento: 'Nosso foco é ajudar você a avançar do painel à montagem, com uma solicitação clara e um atendimento próximo das necessidades da sua oficina.',
    tituloComoFunciona: 'Seu projeto. Nosso próximo corte.',
    passo1Titulo: 'Conte o que você precisa', passo1Texto: 'Escolha os materiais e informe as medidas, quantidades e detalhes do projeto.',
    passo2Titulo: 'Combine os detalhes', passo2Texto: 'Confirme padrões, serviços, valores e prazo com a equipe antes de aprovar.',
    passo3Titulo: 'Leve para sua oficina', passo3Texto: 'Combine a retirada ou entrega e siga para a produção dos seus móveis.',
    tituloOrcamento: 'O seu próximo\nprojeto merece\num bom começo.',
    descricaoOrcamento: 'Escolha os materiais, conte o que precisa e solicite seu orçamento pelo WhatsApp.',
    textoRodape: 'Materiais e preparação de peças\npara quem vive de marcenaria.',
    seoTitulo: `${nome} — Seu projeto começa com o corte certo`,
    seoDescricao: `MDF, corte sob medida e acabamentos para marceneiros. Conheça ${nome} e prepare sua solicitação de orçamento.`
  };
}
export function conteudoEfetivo(conteudo, nome) {
  const defaults = textosPadrao(nome);
  return {...Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key,
    typeof conteudo?.[key] === 'string' && conteudo[key].trim() ? conteudo[key] : value
  ])), promocoesNoBanner:conteudo?.promocoesNoBanner!==false, ...(Array.isArray(conteudo?.ordemSecoes)?{ordemSecoes:conteudo.ordemSecoes}:{}), ...(Array.isArray(conteudo?.secoesDesativadas)?{secoesDesativadas:conteudo.secoesDesativadas}:{})};
}
