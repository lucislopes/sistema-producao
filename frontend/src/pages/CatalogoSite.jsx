import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { Select } from '../components/ui/Select'
import { UploadImagemSite } from '../components/UploadImagemSite'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'

const labels = {produtos:'Produtos',categorias:'Categorias',banners:'Banners'}
const novo = tipo => ({ajusteImagem:{},nome:'',titulo:'',slug:'',descricao:'',descricaoCurta:'',especificacao:'',subtitulo:'',textoBotao:'',link:'',imagemUrl:'',imagemPrincipalUrl:'',ativo:false,destaque:false,ordem:0,categoriaId:'',tipoVenda:'MATERIAL',preco:'',precoAnterior:'',marca:'',condicao:''})
export function CatalogoSite({tipo}) {
  const {usuario}=useContext(AuthContext)
  const admin=(usuario?.funcao==='ADMIN'||usuario?.permissoesSite?.includes('CONTEUDO'))
  const [lista,setLista]=useState([]),[categorias,setCategorias]=useState([]),[carregando,setCarregando]=useState(true)
  const [registro,setRegistro]=useState(null),[original,setOriginal]=useState(''),[erro,setErro]=useState(''),[salvando,setSalvando]=useState(false),[upload,setUpload]=useState(false)
  const dirty=registro!==null && JSON.stringify(registro)!==original
  const confirmar=useUnsavedChanges(dirty)
  const nomeCampo=tipo==='banners'?'titulo':'nome'
  const imagemCampo=tipo==='produtos'?'imagemPrincipalUrl':'imagemUrl'
  async function carregar() {
    setCarregando(true);setErro('')
    try {
      const [items,cats]=await Promise.all([api.get(`/site/${tipo}`),tipo==='produtos'?api.get('/site/categorias'):Promise.resolve({data:[]})])
      setLista(items.data);setCategorias(cats.data)
    } catch {setErro('Não foi possível carregar. Confira a conexão e a atualização do banco.')}
    finally {setCarregando(false)}
  }
  useEffect(()=>{if(admin)carregar()},[admin,tipo])
  function editar(item) {const next={...novo(tipo),...item,categoriaId:item?.categoriaId || ''};setRegistro(next);setOriginal(JSON.stringify(next));setErro('')}
  function fechar() {if(!salvando&&!upload&&confirmar())setRegistro(null)}
  const alterar=(key,value)=>setRegistro(atual=>({...atual,[key]:value}))
  async function salvar(event) {
    event.preventDefault();setSalvando(true);setErro('')
    try {
      if(registro.id)await api.put(`/site/${tipo}/${registro.id}`,registro);else await api.post(`/site/${tipo}`,registro)
      setRegistro(null);setOriginal('');await carregar();alert('Registro salvo com sucesso. Recarregue o site para visualizar.')
    } catch(error){setErro(error.response?.data?.error || 'Não foi possível salvar.')}
    finally{setSalvando(false)}
  }
  async function retirar(item) {
    setSalvando(true);setErro('')
    try {await api.patch(`/site/${tipo}/${item.id}/desativar`);await carregar()}
    catch(error){setErro(error.response?.data?.error || 'Não foi possível retirar a publicação.')}
    finally{setSalvando(false)}
  }
  if(!admin)return <p>Somente administradores podem editar o site.</p>
  return <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">{labels[tipo]} do site</h1><p className="text-sm text-gray-600 mt-2">Somente registros ativos aparecem no site. A ordem menor aparece primeiro. Para retirar uma publicação, desmarque Ativo.</p></div><Button disabled={carregando} onClick={()=>editar()}>Adicionar {tipo==='categorias'?'categoria':tipo==='banners'?'banner':'produto'}</Button></div>
    {erro && !registro && <p role="alert" className="p-4 bg-red-50 border rounded-xl text-red-800">{erro}<Button className="ml-3" onClick={carregar}>Tentar novamente</Button></p>}
    {carregando ? <p role="status">Carregando...</p> : <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto"><Table label={`${labels[tipo]} do site`}><caption className="sr-only">{labels[tipo]} cadastrados</caption><thead className="bg-gray-50 text-gray-600"><tr><th className="p-4">Publicação</th><th className="p-4">Situação</th><th className="p-4">Ordem</th><th className="p-4">Ações</th></tr></thead><tbody>{lista.map(item=><tr key={item.id} className="border-t border-gray-100"><td className="p-4"><div className="flex items-center gap-3">{item[imagemCampo]&&<img src={item[imagemCampo]} alt="" className="w-14 h-12 rounded object-cover"/>}<div className="font-medium">{item[nomeCampo]}{item.slug&&<p className="text-gray-500 font-normal mt-1">{item.slug}</p>}</div></div></td><td className="p-4">{item.ativo?'Ativo':'Inativo'}</td><td className="p-4">{item.ordem}</td><td className="p-4"><Button variant="secondary" size="sm" onClick={()=>editar(item)} aria-label={`Editar ${item[nomeCampo]}`}>Editar</Button>{item.ativo&&<Button variant="secondary" size="sm" className="ml-2" disabled={salvando} onClick={()=>retirar(item)} aria-label={`Retirar ${item[nomeCampo]} do site`}>Retirar do site</Button>}</td></tr>)}{!lista.length&&<tr><td colSpan={4} className="p-8 text-gray-500 text-center">Nenhum registro cadastrado. Comece adicionando uma publicação.</td></tr>}</tbody></Table></div>}
    <Modal open={!!registro} title={`${registro?.id?'Editar':'Adicionar'} ${tipo==='categorias'?'categoria':tipo==='banners'?'banner':'produto'}`} onClose={fechar}>
      {registro&&<form onSubmit={salvar} className="space-y-4">
        {erro&&<p role="alert" className="text-red-800 bg-red-50 rounded p-3">{erro}</p>}
        <fieldset disabled={salvando} className="space-y-4">
          <label className="block text-sm font-medium">{tipo==='banners'?'Título':'Nome'}<Input required maxLength={150} value={registro[nomeCampo]} onChange={event=>alterar(nomeCampo,event.target.value)}/></label>
          {tipo!=='banners'&&<label className="block text-sm font-medium">URL amigável<Input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={150} value={registro.slug} placeholder="mdf-branco" onChange={event=>alterar('slug',event.target.value)}/><span className="text-xs text-gray-500">Letras minúsculas, números e hífens; sem espaços.</span></label>}
          {tipo==='produtos'&&<><label className="block text-sm font-medium">Vitrine de venda<Select value={registro.tipoVenda} onChange={e=>alterar('tipoVenda',e.target.value)}><option value="MATERIAL">Materiais e acessórios</option><option value="MAQUINA">Máquinas</option><option value="FERRAMENTA">Ferramentas</option></Select></label><div className="grid grid-cols-2 gap-3">{['preco','precoAnterior'].map(k=><label key={k} className="text-sm">{k==='preco'?'Preço (R$) — opcional':'Preço anterior (R$)'}<Input type="number" min="0" step="0.01" value={registro[k]??''} onChange={e=>alterar(k,e.target.value)}/></label>)}</div><p className="text-xs text-gray-500">Sem preço, o site apresenta “Consulte condições”. Preço anterior gera destaque de desconto.</p><div className="grid grid-cols-2 gap-3">{['marca','condicao'].map(k=><label key={k} className="text-sm">{k==='marca'?'Marca':'Condição (novo, usado etc.)'}<Input maxLength={100} value={registro[k]??''} onChange={e=>alterar(k,e.target.value)}/></label>)}</div></>}
          {tipo==='produtos'&&<><label className="block text-sm font-medium">Categoria<Select className="mt-2" value={registro.categoriaId} onChange={event=>alterar('categoriaId',event.target.value)}><option value="">Sem categoria</option>{categorias.map(item=><option key={item.id} value={item.id}>{item.nome}{!item.ativo?' (inativa)':''}</option>)}</Select></label><p className="text-xs text-gray-500">Produtos ligados a uma categoria inativa também ficam ocultos no site.</p></>}
          {(tipo==='produtos'?['descricaoCurta','descricao','especificacao']:tipo==='banners'?['subtitulo']:['descricao']).map(key=><label key={key} className="block text-sm font-medium">{{descricaoCurta:'Descrição curta',descricao:'Descrição',especificacao:'Especificação / espessura',subtitulo:'Subtítulo'}[key]}<textarea rows={key==='descricao'?4:2} maxLength={key==='descricao'?(tipo==='produtos'?5000:1000):key==='especificacao'?200:500} className="w-full border border-gray-300 rounded-lg p-3 mt-2" value={registro[key]} onChange={event=>alterar(key,event.target.value)}/></label>)}
          <UploadImagemSite perfil={tipo==='banners'?'banner':tipo==='produtos'?'produto':'categoria'} ajuste={registro.ajusteImagem} onAjusteChange={v=>alterar('ajusteImagem',v)} value={registro[imagemCampo]} grupo={tipo} onChange={value=>alterar(imagemCampo,value)} onBusy={setUpload} disabled={salvando}/>
          {tipo==='banners'&&<><label className="block text-sm font-medium">Link do botão (opcional)<Input type="url" maxLength={2048} value={registro.link} placeholder="https://..." onChange={event=>alterar('link',event.target.value)}/></label><label className="block text-sm font-medium">Texto do botão<Input maxLength={80} value={registro.textoBotao} onChange={event=>alterar('textoBotao',event.target.value)}/></label></>}
          <label className="block text-sm font-medium">Ordem de exibição<Input type="number" min={0} max={99999} required value={registro.ordem} onChange={event=>alterar('ordem',event.target.value===''?'':Number(event.target.value))}/></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={registro.ativo} onChange={event=>alterar('ativo',event.target.checked)}/>Ativo no site</label>
          {tipo==='produtos'&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={registro.destaque} onChange={event=>alterar('destaque',event.target.checked)}/>Produto em destaque</label>}
        </fieldset>
        <div className="flex flex-wrap gap-3"><Button type="submit" loading={salvando} disabled={upload}>Salvar publicação</Button><Button variant="secondary" onClick={fechar} disabled={salvando||upload}>Cancelar</Button></div>
      </form>}
    </Modal>
  </div>
}
