import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Link } from 'react-router-dom'
import { resolverConteudo,estiloImagem } from '../../../site/config.js'
import { imagemCatalogo } from '../../../site/imagensCatalogo.js'
import {secoesSite,ordenarSecoes} from '../../../site/config.js'
export function PreviaSite({ configuracao, conteudo, imagemHomeUrl,ajustesImagens }) {
  const [base,setBase]=useState(null),[produtos,setProdutos]=useState([]),[paginas,setPaginas]=useState([]),[erro,setErro]=useState('')
  useEffect(()=>{
    let ativo=true
    api.get('/site/previa').then(({data})=>{if(ativo){setBase(data.configuracao);setProdutos(data.produtos);setPaginas(data.paginas)}}).catch(()=>{if(ativo)setErro('Não foi possível carregar a prévia. Reabra a página para tentar novamente.')})
    return()=>{ativo=false}
  },[])
  const config=base?resolverConteudo({...base,...configuracao,conteudo:conteudo||base.conteudo,...(ajustesImagens?{ajustesImagens}:{}),...(imagemHomeUrl!==undefined?{imagemHomeUrl}:{})},paginas):null, content=config?.conteudo
  const publicados=produtos
  if(erro)return <p role="alert" className="text-red-700">{erro}</p>
  if(!config || !content)return <p>Carregando prévia de publicação...</p>
  const avisos=[]
  if(!config.ativo)avisos.push('Site desativado: o conteúdo salvo ainda não está disponível ao público.')
  if(!config.logoUrl)avisos.push('Logo não cadastrada. O site mostrará o nome da empresa.')
  if(!config.whatsapp)avisos.push('WhatsApp não cadastrado: orçamento ficará na opção de copiar.')
  if(!publicados.length)avisos.push('Catálogo sem produtos publicados.')
  if(publicados.some(p=>p.slug.startsWith('exemplo-')))avisos.push('Há produtos de exemplo ativos. Revise antes de publicar comercialmente.')
  if(!content.enderecoContato || !content.horarioContato)avisos.push('Endereço ou horário de atendimento ainda não preenchidos em Textos e Imagem.')
  return <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
    <h2 className="text-lg font-semibold">Conferência de publicação</h2>
    <details className="border rounded-xl p-4"><summary className="cursor-pointer font-semibold">Conferir sequência das partes</summary><ol className="list-decimal pl-6 mt-3 text-sm space-y-1">{ordenarSecoes(content.ordemSecoes).map(id=><li key={id} className={content.secoesDesativadas?.includes(id)?'text-gray-400':''}>{secoesSite.find(([key])=>key===id)[1]}{content.secoesDesativadas?.includes(id)&&' — desativada'}</li>)}</ol><p className="text-xs text-gray-500 mt-3">Partes sem conteúdo publicado não aparecem no site. A prévia resumida abaixo confere textos e imagens.</p></details>
    <p className="text-sm text-gray-600">Revise antes de salvar. A prévia abaixo acompanha as alterações deste formulário. Salvar aplica o conteúdo imediatamente quando o site está ativo; ainda não há uma etapa separada de rascunho e publicação.</p>
    {avisos.length>0 && <ul className="list-disc pl-6 text-sm text-amber-900 bg-amber-50 rounded-xl p-4 space-y-2">{avisos.map(a=><li key={a}>{a}</li>)}</ul>}
    <details className="border rounded-xl overflow-hidden"><summary className="p-4 cursor-pointer font-semibold">Ver prévia antes de salvar</summary>
      <div className="p-6 space-y-4" style={{background:config.corPrimaria,color:'#fff'}}>
        <div className="flex gap-4 items-center">{config.logoUrl && <img src={config.logoUrl} style={estiloImagem(config.ajustesImagens?.logoUrl)} alt="Logo da empresa" className="max-w-28 max-h-20 object-contain"/>}<strong>{config.nome}</strong></div>
        <h3 className="text-3xl font-bold whitespace-pre-line">{content.tituloHome}<br/><span style={{color:config.corDestaque}}>{content.destaqueHome}</span></h3>
        <p>{content.descricaoHome}</p><span className="inline-block p-3 rounded-lg text-gray-900" style={{background:config.corDestaque}}>{content.botaoHome}</span>
        {config.imagemHomeUrl&&<img src={config.imagemHomeUrl} style={estiloImagem(config.ajustesImagens?.imagemHomeUrl,'cover')} alt="Imagem principal do site" className="w-full max-h-64 object-contain"/>}
      </div>
      <div className="p-5 space-y-3"><h3 className="font-semibold">{content.tituloSobre}</h3>{content.imagemSobreUrl&&<img src={content.imagemSobreUrl} style={estiloImagem(config.ajustesImagens?.imagemSobreUrl,'cover')} alt="Sobre a empresa" className="max-h-64 object-contain"/>}<p className="whitespace-pre-line">{content.textoSobre}</p><p className="whitespace-pre-line">{content.textoSobreComplemento}</p><h3 className="font-semibold">Catálogo: {publicados.length} produtos publicados</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{publicados.slice(0,6).map(p=><div key={p.id} className="border rounded-lg p-3">{imagemCatalogo(p)&&<img src={imagemCatalogo(p)} style={estiloImagem(p.ajusteImagem)} alt={p.nome} className="h-24 w-full object-contain"/>}<p className="text-sm mt-2">{p.nome}</p></div>)}</div><h3 className="font-semibold">{content.tituloContato}</h3><p className="whitespace-pre-line">{content.textoContato}</p>{content.imagemAtendimentoUrl&&<img src={content.imagemAtendimentoUrl} style={estiloImagem(config.ajustesImagens?.imagemAtendimentoUrl,'cover')} alt="Atendimento" className="max-h-64 object-contain"/>}<p className="text-sm whitespace-pre-line">{content.enderecoContato}<br/>{content.horarioContato}<br/>{content.orientacoesRetirada}</p></div>
    </details>
    <Link to="/site/conteudo" className="text-sm text-blue-700 underline">Editar textos e contatos comerciais</Link>
  </section>
}
