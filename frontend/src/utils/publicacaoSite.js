const camposArte = ['imagemUrl','titulo','descricao','preco','precoAnterior'];
export function alterarPublicacao(registro, campo, valor) {
  const novo = {...registro, [campo]:valor};
  if (camposArte.includes(campo) && registro[campo] !== valor && registro.arte?.capaSiteUrl) {
    novo.arte = {...registro.arte, capaSiteUrl:null};
  }
  return novo;
}
const ajustesVisuais=['modelo','corPrimaria','corDestaque','logoUrl','chamada','zoomImagem','posicaoX','posicaoY','categoria'];
export function alterarArtePublicacao(registro,campo,valor){
  const arte={...registro.arte,[campo]:valor};
  if(ajustesVisuais.includes(campo)&&registro.arte?.[campo]!==valor)arte.capaSiteUrl=null;
  return {...registro,arte};
}
