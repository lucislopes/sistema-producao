import {editorSecao} from '../utils/edicaoSecoesSite'
import { useContext, useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import { Save } from 'lucide-react'

import { AuthContext } from '../contexts/AuthContext'

import { api } from '../services/api'

import { Button } from '../components/ui/Button'

import { UploadImagemSite } from '../components/UploadImagemSite'

import { useUnsavedChanges } from '../hooks/useUnsavedChanges'

import { PreviaSite } from '../components/PreviaSite'
import {secoesSite,ordenarSecoes} from '../../../site/config.js'
import {resolverConteudo} from '../../../site/config.js'



export function ConteudoSite() {

  const { usuario } = useContext(AuthContext)

  const admin = usuario?.funcao === 'ADMIN' || usuario?.permissoesSite?.includes('CONTEUDO')

  const [dados,setDados] = useState(null)
  const [secaoEditada,setSecaoEditada]=useState('solucoes')
  const [paginas,setPaginas] = useState([])

  const [original,setOriginal] = useState('')

  const [erro,setErro] = useState('')
  const [salvoEm,setSalvoEm]=useState('')
  const [mostrarOrdem,setMostrarOrdem]=useState(false)

  const [salvando,setSalvando] = useState(false)

  const [upload,setUpload] = useState(false)

  const alterado=dados!==null&&original!==JSON.stringify(dados)
  useUnsavedChanges(alterado)

  async function carregar() {

    setErro('')

    try { const [{data},previa]=await Promise.all([api.get('/site/conteudo'),api.get('/site/previa')]); setDados(data); setOriginal(JSON.stringify(data));setPaginas(previa.data.paginas) }

    catch {setErro('Não foi possível carregar o conteúdo. Verifique a conexão e a atualização do banco.')}

  }

  useEffect(() => { if(admin) carregar() }, [admin])

  async function salvar(event) {

    event.preventDefault(); if(salvando||upload||!alterado)return;setSalvando(true); setErro('')

    try { const {data}=await api.put('/site/conteudo',dados); setDados(data); setOriginal(JSON.stringify(data)); setSalvoEm(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})) }

    catch(error) {setErro(error.response?.data?.error || 'Erro ao salvar conteúdo.')}

    finally {setSalvando(false)}

  }

  const efetivo=resolverConteudo({conteudo:dados?.conteudo,ajustesImagens:dados?.ajustesImagens},paginas)
  const desativadas=dados?.conteudo?.secoesDesativadas||[]
  const ativarSecao=(id,ativa)=>setDados(atual=>({...atual,conteudo:{...atual.conteudo,secoesDesativadas:ativa?(atual.conteudo.secoesDesativadas||[]).filter(key=>key!==id):[...new Set([...(atual.conteudo.secoesDesativadas||[]),id])]}}))
  const ordem=ordenarSecoes(dados?.conteudo?.ordemSecoes)
  const moverSecao=(id,destino)=>setDados(atual=>{const lista=ordenarSecoes(atual.conteudo.ordemSecoes),indice=lista.indexOf(id);lista.splice(indice,1);lista.splice(destino,0,id);return {...atual,conteudo:{...atual.conteudo,ordemSecoes:lista}}})
  const fontes=efetivo.fontes
  const editor=editorSecao(secaoEditada,fontes)
  const abrirEditor=id=>{setSecaoEditada(id);requestAnimationFrame(()=>document.getElementById('editar-parte-site')?.scrollIntoView({behavior:'smooth',block:'start'}))}
  const controlado=key=>fontes.HISTORIA&&['tituloSobre','textoSobre','textoSobreComplemento','imagemSobreUrl'].includes(key)||fontes.CONTATO&&['tituloContato','textoContato','imagemAtendimentoUrl'].includes(key)||fontes.SERVICO.length>0&&/^servico[1-5](Titulo|Texto)$/.test(key)
  if(!admin) return <p>Você não possui permissão para editar o conteúdo do site.</p>

  return <div className="space-y-6 pb-44 sm:pb-28">

    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5"><h1 className="text-2xl font-bold">Textos e fotos do site</h1><p className="mt-2 text-sm text-gray-600">Escolha a parte que deseja editar. Você pode salvar a qualquer momento pela barra inferior. As alterações são aplicadas juntas ao salvar.</p></div>

    {(fontes.HISTORIA||fontes.CONTATO||fontes.SERVICO.length>0)&&<p className="bg-blue-50 border rounded-xl p-4 text-sm">História, contato e serviços publicados são editados em <Link className="underline font-semibold" to="/empresa/paginas">Páginas e serviços</Link>. Os campos correspondentes abaixo ficam reservados para quando essas páginas não estão publicadas.</p>}
    {dados && !dados.ativo && <div role="status" className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900"><strong>O site está desativado.</strong><p className="mt-1 text-sm">Você pode salvar e conferir os textos na prévia. O público verá as alterações quando o site for ativado.</p><Link className="inline-block mt-2 font-semibold underline" to="/site/configuracao">Abrir configuração para ativar o site</Link></div>}

    {erro && <div role="alert" className="p-4 border rounded-xl bg-red-50 text-red-800">{erro}{!dados && <Button onClick={carregar} className="ml-3">Tentar novamente</Button>}</div>}

    {!dados ? !erro && <p role="status">Carregando...</p> : <form id="form-conteudo-site" onSubmit={salvar} className="space-y-6">

      <section className="bg-white border rounded-2xl p-5 space-y-4"><label className="block font-semibold">Qual parte você quer editar?<select disabled={salvando||upload} className="block mt-2 w-full rounded-lg border p-3 font-normal" value={secaoEditada} onChange={e=>setSecaoEditada(e.target.value)}>{ordem.map(id=><option key={id} value={id}>{secoesSite.find(([key])=>key===id)[1]}{desativadas.includes(id)?' — desativada':''}</option>)}</select></label><button type="button" disabled={salvando||upload} aria-expanded={mostrarOrdem} aria-controls="organizar-partes-site" className="text-blue-700 underline text-sm" onClick={()=>setMostrarOrdem(v=>!v)}>{mostrarOrdem?'Fechar organização das partes':'Organizar, ativar ou desativar partes'}</button></section>
      <div id="organizar-partes-site" hidden={!mostrarOrdem}>
      <fieldset disabled={salvando||upload} className="bg-white border rounded-2xl p-5 space-y-4"><h2 className="font-semibold text-lg">Ordem das partes do site</h2><p className="text-sm text-gray-600">A lista representa a página de cima para baixo, no computador e no celular. Desmarque Ativa para tirar uma parte do site sem apagar o conteúdo ou perder sua posição. Seções sem conteúdo publicado continuam ocultas. Salve para aplicar.</p><ol className="space-y-2">{ordem.map((id,index)=><li key={id} className="flex flex-wrap items-center gap-2 border rounded-lg p-3"><span className="font-medium flex-1">{index+1}. {secoesSite.find(([key])=>key===id)[1]}</span><button type="button" className="text-blue-700 underline text-sm" onClick={()=>abrirEditor(id)}>Editar esta parte</button><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!desativadas.includes(id)} onChange={e=>ativarSecao(id,e.target.checked)} aria-label={`Ativar ${secoesSite.find(([key])=>key===id)[1]}`}/>{desativadas.includes(id)?'Desativada':'Ativa'}</label><label className="text-sm">Posição <select aria-label={`Posição de ${secoesSite.find(([key])=>key===id)[1]}`} className="border rounded p-2" value={index} onChange={e=>moverSecao(id,Number(e.target.value))}>{ordem.map((_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label><button type="button" className="border rounded p-2 disabled:opacity-40" disabled={index===0} onClick={()=>moverSecao(id,index-1)} aria-label={`Mover ${secoesSite.find(([key])=>key===id)[1]} para cima`}>↑ Subir</button><button type="button" className="border rounded p-2 disabled:opacity-40" disabled={index===ordem.length-1} onClick={()=>moverSecao(id,index+1)} aria-label={`Mover ${secoesSite.find(([key])=>key===id)[1]} para baixo`}>↓ Descer</button></li>)}</ol><button type="button" className="text-blue-700 underline" onClick={()=>setDados(a=>({...a,conteudo:{...a.conteudo,ordemSecoes:ordenarSecoes()}}))}>Restaurar ordem padrão</button></fieldset></div>
      <fieldset id="editar-parte-site" disabled={salvando||upload} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 scroll-mt-6"><h2 className="font-semibold text-lg">Editar {secoesSite.find(([id])=>id===secaoEditada)?.[1]}</h2><p className="text-sm text-gray-600">A edição permanece disponível mesmo com esta parte desativada. Trocar de parte mantém suas alterações até salvar.</p>{['promocoes','banners'].includes(secaoEditada)&&<div className="bg-stone-50 border rounded-xl p-4 space-y-3"><h3 className="font-semibold">Onde mostrar as promoções</h3><label className="flex items-center gap-3"><input type="checkbox" checked={!desativadas.includes('promocoes')} onChange={e=>ativarSecao('promocoes',e.target.checked)}/>Mostrar a seção Promoções e novidades na página</label><label className="flex items-center gap-3"><input type="checkbox" checked={dados.conteudo.promocoesNoBanner!==false} onChange={e=>setDados(a=>({...a,conteudo:{...a.conteudo,promocoesNoBanner:e.target.checked}}))}/>Mostrar promoções sobre o banner</label><p className="text-xs text-gray-600">As opções são independentes. O cartão precisa de um banner ativo e de promoções publicadas. Salve para aplicar.</p><Button type="submit" loading={salvando} disabled={upload||!alterado}>Salvar alterações</Button></div>}{(editor.links||[]).map(([to,label])=><Link key={to} className="inline-block mr-4 text-blue-700 underline" to={to}>{label}</Link>)}{(editor.campos||[]).map(key=><label key={key} className="block text-sm font-medium">{dados.campos[key][0]}<textarea disabled={!!controlado(key)} className="mt-2 w-full border rounded-lg p-3" rows={dados.campos[key][1]>500?4:2} maxLength={dados.campos[key][1]} value={(controlado(key)?efetivo.conteudo[key]:dados.conteudo[key])||''} onChange={e=>setDados(a=>({...a,conteudo:{...a.conteudo,[key]:e.target.value}}))}/>{controlado(key)&&<Link to="/empresa/paginas?tipo=SERVICO" className="text-xs text-blue-700 underline">Editar serviço publicado</Link>}</label>)}{(editor.imagens||[]).map(key=><div key={key}><h3 className="font-medium">{key==='imagemHomeUrl'?'Imagem principal':dados.camposImagens[key]}</h3><UploadImagemSite grupo="conteudo" perfil={key==='imagemHomeUrl'?'principal':key.startsWith('software')?'software':'secao'} value={key==='imagemHomeUrl'?dados.imagemHomeUrl:(controlado(key)?efetivo.conteudo[key]:dados.conteudo[key])||''} ajuste={controlado(key)?efetivo.ajustesImagens[key]:dados.ajustesImagens?.[key]} disabled={!!controlado(key)} onBusy={setUpload} onChange={url=>setDados(a=>key==='imagemHomeUrl'?{...a,imagemHomeUrl:url}:{...a,conteudo:{...a.conteudo,[key]:url}})} onAjusteChange={v=>setDados(a=>({...a,ajustesImagens:{...a.ajustesImagens,[key]:v}}))}/>{controlado(key)&&<Link className="text-blue-700 underline" to="/empresa/paginas?tipo=CONTATO">Editar imagem na página Contato publicada</Link>}</div>)}{secaoEditada==='servicos'&&fontes.SERVICO.length>0&&<p className="text-sm text-gray-600">Os textos de cada serviço vêm dos cadastros publicados. Use “Editar serviços cadastrados”.</p>}{((editor.campos||[]).length>0||(editor.imagens||[]).length>0)&&<Button type="submit" loading={salvando} disabled={upload||!alterado}>Salvar todas as alterações</Button>}</fieldset>
      <details className="bg-white border rounded-2xl p-5"><summary className="font-semibold cursor-pointer">Outros textos e configurações gerais</summary><p className="text-sm text-gray-600 my-4">Prefira editar pela parte selecionada acima. Aqui também estão os textos do topo, rodapé e buscadores.</p><fieldset disabled={salvando||upload}><legend className="sr-only">Outros textos</legend><div className="grid grid-cols-1 md:grid-cols-2 gap-5">{Object.entries(dados.campos).filter(([key])=>!(editor.campos||[]).includes(key)).map(([key,[label,max]]) => <label key={key} className="text-sm font-medium text-gray-700">{label}<textarea disabled={!!controlado(key)} rows={max>500?4:2} maxLength={max} value={(controlado(key)?efetivo.conteudo[key]:dados.conteudo[key]) || ''} onChange={event=>setDados(atual=>({...atual,conteudo:{...atual.conteudo,[key]:event.target.value}}))} className="mt-2 w-full rounded-lg border border-gray-300 p-3 bg-white text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Usar texto padrão" /></label>)}</div></fieldset></details>

      <details className="bg-white border rounded-2xl p-5"><summary className="font-semibold cursor-pointer">Imagens das outras partes</summary><fieldset disabled={salvando || upload} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6"><legend className="sr-only">Fotos das seções</legend><h2 className="font-semibold text-lg">Fotos das seções</h2><p className="text-sm text-gray-600">Confira a proporção recomendada junto de cada campo antes de escolher a foto. A foto de Sobre a empresa usa a página História publicada em Páginas e serviços, quando houver; o campo abaixo é usado quando não há página História publicada. Remova uma foto para ocultar esse espaço.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Object.entries(dados.camposImagens || {}).filter(([key])=>!(editor.imagens||[]).includes(key)).map(([key,label]) => <div key={key}><h3 className="font-medium mb-2">{label}</h3><UploadImagemSite value={(controlado(key)?efetivo.conteudo[key]:dados.conteudo[key]) || ''} grupo="conteudo" perfil={key.startsWith('software')?'software':'secao'} ajuste={controlado(key)?efetivo.ajustesImagens[key]:dados.ajustesImagens?.[key]} onAjusteChange={v=>setDados(a=>({...a,ajustesImagens:{...a.ajustesImagens,[key]:v}}))} onBusy={setUpload} onChange={url=>setDados(atual=>({...atual,conteudo:{...atual.conteudo,[key]:url}}))} disabled={salvando || upload || !!controlado(key)}/></div>)}</div></fieldset></details>

      <PreviaSite conteudo={dados.conteudo} imagemHomeUrl={dados.imagemHomeUrl} ajustesImagens={dados.ajustesImagens} />



    </form>}
    {dados&&<div className="fixed bottom-0 inset-x-0 z-40 border-t bg-white shadow-lg px-4 py-3"><div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p role="status" aria-live="polite" className={`font-medium text-sm ${erro?'text-red-700':alterado?'text-amber-800':'text-emerald-800'}`}>{salvando?'Salvando alterações…':upload?'Enviando imagem. Aguarde para salvar.':erro?erro:alterado?'Você tem alterações não salvas':salvoEm?`Alterações salvas às ${salvoEm}`:'Nenhuma alteração pendente'}</p><p className="text-xs text-gray-500 mt-1">O botão salva textos, imagens, ordem e ativação de todas as partes.</p></div><Button type="submit" form="form-conteudo-site" loading={salvando} disabled={upload||!alterado} className="w-full sm:w-auto"><Save size={16}/>Salvar alterações</Button></div></div>}


  </div>

}
