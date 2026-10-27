const camposArte = ['imagemUrl','titulo','descricao','preco','precoAnterior'];
export function logoDaArte(registro,empresa={}){
  const logo=empresa.logoUrl||empresa.logo;
  if(logo)return logo;
  const alternativa=registro?.arte?.logoUrl;
  return alternativa&&alternativa!==registro?.imagemUrl?alternativa:null;
}
export function alterarPublicacao(registro, campo, valor) {
  const novo = {...registro, [campo]:valor};
  if (camposArte.includes(campo) && registro[campo] !== valor && registro.arte?.capaSiteUrl) {
    novo.arte = {...registro.arte, capaSiteUrl:null};
  }
  return novo;
}
const ajustesVisuais=['modelo','corPrimaria','corDestaque','logoUrl','chamada','zoomImagem','posicaoX','posicaoY','categoria','condicaoPagamento','rodapeEndereco','rodapeTelefone'];
export function alterarArtePublicacao(registro,campo,valor){
  const arte={...registro.arte,[campo]:valor};
  if(ajustesVisuais.includes(campo)&&registro.arte?.[campo]!==valor)arte.capaSiteUrl=null;
  return {...registro,arte};
}
