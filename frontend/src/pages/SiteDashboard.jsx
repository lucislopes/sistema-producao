import {useContext,useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {AuthContext} from '../contexts/AuthContext'
import {api} from '../services/api'

export function SiteDashboard({relatorios=false}) {
  const {usuario}=useContext(AuthContext)
  const permitido=usuario?.funcao==='ADMIN'||usuario?.permissoesSite?.includes('RELATORIOS_EMPRESA')
  const [inicio,setInicio]=useState(()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}).slice(0,4)+'-01-01')
  const [fim,setFim]=useState(()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}))
  const [data,setData]=useState(null),[erro,setErro]=useState('')
  useEffect(()=>{
    if(!permitido)return
    const controller=new AbortController()
    setData(null);setErro('')
    api.get('/site-relatorios/resumo',{params:{inicio,fim},signal:controller.signal}).then(({data})=>setData(data)).catch(e=>{if(e.code!=='ERR_CANCELED')setErro(e.response?.data?.error||'Não foi possível carregar os relatórios do site.')})
    return()=>controller.abort()
  },[permitido,inicio,fim])
  return <div className="space-y-6">
    <header><h2 className="text-2xl font-bold">{relatorios?'Relatórios do site':'Visão geral do site'}</h2><p className="mt-2 text-gray-600">Acompanhe as solicitações de orçamento recebidas pelo site e sua conversão em pedidos.</p></header>
    {!permitido?<p>Escolha uma área autorizada no menu para gerenciar o site.</p>:<>
      <div className="flex flex-wrap gap-4 bg-white border rounded-xl p-4"><label>Início<input className="block border rounded p-2" type="date" value={inicio} max={fim} onChange={e=>{if(e.target.value)setInicio(e.target.value)}}/></label><label>Fim<input className="block border rounded p-2" type="date" min={inicio} value={fim} onChange={e=>{if(e.target.value)setFim(e.target.value)}}/></label></div>
      {erro?<p role="alert">{erro}</p>:!data?<p role="status">Carregando dados do site…</p>:<>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Orçamentos recebidos',data.total],['Convertidos em pedidos',data.convertidos],['Conversão',`${data.conversao.toFixed(1)}%`],['Tempo até primeiro atendimento',data.atendimentoHoras===null?'Sem registros':`${data.atendimentoHoras.toFixed(1)} h`]].map(([titulo,valor])=><article key={titulo} className="bg-white border rounded-xl p-5"><p className="text-gray-600">{titulo}</p><strong className="block mt-2 text-2xl">{valor}</strong></article>)}</div>
        <section className="bg-white border rounded-xl p-5"><h3 className="font-bold text-lg">Situação dos orçamentos do período</h3>{Object.entries(data.status).map(([status,total])=><div className="flex justify-between border-b py-3" key={status}><span>{status.replaceAll('_',' ')}</span><strong>{total}</strong></div>)}{!data.total&&<p className="mt-3">Nenhum orçamento recebido neste período.</p>}</section>
        <p className="text-sm text-gray-600">A conversão considera os orçamentos recebidos no período que já possuem um pedido vinculado. O atendimento considera apenas solicitações com primeiro atendimento registrado.</p>
      </>}
    </>}
    {usuario?.funcao==='ADMIN'&&<Link className="inline-block text-emerald-800 underline" to="/empresa/comercial">Abrir atendimento comercial do site</Link>}
  </div>
}
