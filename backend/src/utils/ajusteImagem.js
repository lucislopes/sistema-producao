export function validarAjusteImagem(valor){
 if(!valor||typeof valor!=='object'||Array.isArray(valor))throw Object.assign(new Error('Enquadramento da imagem inválido.'),{status:400});
 if(Object.keys(valor).length===0)return {};
 const modo=valor.modo??'contain',x=valor.x??50,y=valor.y??50;
 if(!['contain','cover','natural'].includes(modo)||typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>100||y<0||y>100)throw Object.assign(new Error('Escolha um enquadramento válido e posições entre 0 e 100.'),{status:400});
 return {modo,x,y};
}
export function validarAjustesImagens(valor){
 if(!valor||typeof valor!=='object'||Array.isArray(valor))throw Object.assign(new Error('Ajustes das imagens inválidos.'),{status:400});
 const permitidos=['logoUrl','imagemHomeUrl','software1LogoUrl','software2LogoUrl','imagemCatalogoUrl','imagemServicosUrl','imagemSobreUrl','imagemAtendimentoUrl'];
 const out={};for(const key of permitidos)if(valor[key]!==undefined)out[key]=validarAjusteImagem(valor[key]);return out;
}
