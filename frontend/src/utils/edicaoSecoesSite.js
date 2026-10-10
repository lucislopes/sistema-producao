export const edicaoSecoesSite={
 banners:{links:[['/empresa/banners','Editar banners']]},
 solucoes:{campos:['chamadaHome','tituloHome','destaqueHome','descricaoHome','botaoHome'],imagens:['imagemHomeUrl']},
 promocoes:{links:[['/empresa/publicacoes','Editar promoções e novidades']]},
 publicos:{campos:['publicoTitulo','publicoTexto']},
 beneficios:{campos:['beneficio1','beneficio2','beneficio3','beneficio4']},
 marcas:{links:[['/empresa/paginas?tipo=MARCA','Editar marcas']]},
 catalogo:{campos:['chamadaCatalogo','tituloCatalogo','descricaoCatalogo'],imagens:['imagemCatalogoUrl'],links:[['/empresa/produtos','Editar produtos'],['/empresa/categorias','Editar categorias']]},
 equipamentos:{campos:['tituloEquipamentos','descricaoEquipamentos'],links:[['/empresa/produtos','Editar máquinas e ferramentas']]},
 servicos:{campos:['tituloServicos','descricaoServicos','servico1Titulo','servico1Texto','servico2Titulo','servico2Texto','servico3Titulo','servico3Texto','servico4Titulo','servico4Texto','servico5Titulo','servico5Texto'],imagens:['imagemServicosUrl'],links:[['/empresa/paginas?tipo=SERVICO','Editar serviços cadastrados']]},
 softwares:{campos:['softwareTitulo','softwareTexto','software1Nome','software2Nome'],imagens:['software1LogoUrl','software2LogoUrl']},
 'preparar-projeto':{campos:['tituloPreparacao','preparacao1Titulo','preparacao1Texto','preparacao2Titulo','preparacao2Texto','preparacao3Titulo','preparacao3Texto']},
 'como-funciona':{campos:['tituloComoFunciona','passo1Titulo','passo1Texto','passo2Titulo','passo2Texto','passo3Titulo','passo3Texto']},
 sobre:{campos:['tituloSobre','textoSobre','textoSobreComplemento'],imagens:['imagemSobreUrl']},
 orcamento:{campos:['tituloProjetoSite','descricaoProjetoSite'],imagens:['imagemAtendimentoUrl']},
 'consultar-pedido':{campos:['tituloConsulta','descricaoConsulta']},
 'area-cliente':{campos:['tituloAreaCliente','descricaoAreaCliente','orientacaoAreaCliente']},
 contato:{campos:['tituloContato','textoContato','enderecoContato','horarioContato','orientacoesRetirada','localizacaoUrl','localizacaoMapa']}
};
export function editorSecao(id,fontes={}){
 const editor=edicaoSecoesSite[id]||{};
 if(id==='sobre'&&fontes.HISTORIA)return {...editor,campos:[],imagens:[],links:[['/empresa/paginas?tipo=HISTORIA','Editar História publicada']]};
 if(id==='contato'&&fontes.CONTATO)return {...editor,campos:(editor.campos||[]).filter(k=>!['tituloContato','textoContato'].includes(k)),links:[['/empresa/paginas?tipo=CONTATO','Editar Contato publicado'],['/empresa/paginas?tipo=LOCALIZACAO','Editar Localização']]};
 return editor;
}
