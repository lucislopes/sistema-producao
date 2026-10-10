export function filtroPaginasSite(tipo) {
  if(tipo===undefined||tipo==='')return {};
  if(typeof tipo!=='string'||!['SERVICO','MARCA','HISTORIA','CONTATO','LOCALIZACAO'].includes(tipo))throw Object.assign(new Error('Tipo de página inválido.'),{status:400});
  // Ativos e inativos permanecem editáveis na administração.
  return {tipo};
}
