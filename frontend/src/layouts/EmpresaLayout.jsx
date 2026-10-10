import {useContext,useEffect,useState} from 'react'
import {NavLink,Outlet,useNavigate} from 'react-router-dom'
import {AuthContext} from '../contexts/AuthContext'
import {api} from '../services/api'
export function EmpresaLayout(){
  const {usuario,logout}=useContext(AuthContext),navigate=useNavigate(),[empresa,setEmpresa]=useState({});
  useEffect(()=>{api.get('/public/configuracao').then(({data})=>setEmpresa(data)).catch(()=>{})},[]);
  useEffect(()=>{const anterior=document.title;document.title=(empresa.nome||'Empresa')+' · Área da Empresa';return()=>{document.title=anterior}},[empresa.nome]);
  const pode=p=>usuario?.funcao==='ADMIN'||usuario?.permissoesSite?.includes(p);
  const links=[['','Visão geral',null],['publicacoes','Promoções e anúncios','PROMOCOES'],['paginas','Páginas e serviços','CONTEUDO'],['conteudo','Textos e imagens','CONTEUDO'],['produtos','Produtos e equipamentos','CONTEUDO'],['categorias','Categorias','CONTEUDO'],['banners','Banners','CONTEUDO'],['configuracao','Configuração do site','CONFIGURACAO_SITE'],['comercial','Atendimento comercial','ADMINISTRAR'],['permissoes','Usuários e permissões','ADMINISTRAR']];
  return <div className="min-h-screen bg-stone-50"><header className="bg-emerald-950 text-white px-6 py-5 flex flex-wrap justify-between gap-4"><div className="flex items-center gap-4">{empresa.logoUrl&&<img src={empresa.logoUrl} alt="" className="h-14 w-24 object-contain bg-white rounded-lg"/>}<div><h1 className="text-xl font-bold">{empresa.nome||'Empresa'} · Área da Empresa</h1><p className="text-sm text-emerald-100">{usuario?.nome} · {usuario?.funcao}</p></div></div><div className="flex gap-5 items-center"><a href={empresa.siteUrl||(import.meta.env.DEV?'http://127.0.0.1:5180/':'/')}>Ver site</a>{!usuario?.somenteSite&&<a href={empresa.sistemaUrl||'/dashboard'}>Sistema operacional</a>}<button onClick={()=>{logout();navigate('/empresa/login')}}>Sair</button></div></header><nav aria-label="Área da Empresa" className="bg-white border-b flex flex-wrap gap-2 px-6 py-3">{links.filter(([, ,p])=>!p||pode(p)).map(([path,label])=><NavLink key={path} to={'/empresa'+(path?'/'+path:'')} end className={({isActive})=>`rounded-lg px-4 py-2 text-sm ${isActive?'bg-emerald-800 text-white':'text-gray-700 hover:bg-stone-100'}`}>{label}</NavLink>)}</nav><main className="max-w-7xl mx-auto p-4 md:p-8"><Outlet/></main></div>
}
