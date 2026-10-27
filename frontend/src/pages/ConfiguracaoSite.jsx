import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Save } from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { UploadImagemSite } from '../components/UploadImagemSite'
import { ArmazenamentoSite } from '../components/ArmazenamentoSite'
import { TamanhosImagensSite } from '../components/TamanhosImagensSite'
import { PreviaSite } from '../components/PreviaSite'

export function ConfiguracaoSite() {
  const { usuario } = useContext(AuthContext)
  const isAdmin = usuario?.funcao === 'ADMIN'
  const podeConfigurar = isAdmin || usuario?.permissoesSite?.includes('CONFIGURACAO_SITE')
  const [dados, setDados] = useState(null)
  const [original, setOriginal] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  useUnsavedChanges(dados !== null && JSON.stringify(dados) !== original)
  async function carregar() {
    setErro('')
    try {
      const { data } = await api.get('/site/configuracao')
      setDados(data); setOriginal(JSON.stringify(data))
    } catch { setErro('Não foi possível carregar. Confira a conexão e se a migration de configuração do site foi aplicada.') }
  }
  useEffect(() => {
    if (podeConfigurar) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeConfigurar])
  const alterar = (campo, valor) => setDados(atual => ({ ...atual, [campo]: valor }))
  async function salvar(event) {
    event.preventDefault(); setSalvando(true); setErro('')
    try {
      const { data } = await api.put('/site/configuracao', dados)
      setDados(data); setOriginal(JSON.stringify(data)); alert('Configuração do site salva com sucesso. Recarregue o site para visualizar.')
    } catch (error) { setErro(error.response?.data?.error || 'Não foi possível salvar a configuração.') }
    finally { setSalvando(false) }
  }
  if (!podeConfigurar) return <p className="p-5 text-gray-700">Você não possui permissão para configurar o site.</p>
  return <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900"><Globe className="text-blue-600" size={22} />Site / Marketing</h1>
      <p className="text-sm text-gray-500 mt-2">Configure a identidade e os contatos apresentados no site público.</p>
    </div>
    {erro && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">{erro}{!dados && <Button className="ml-4" onClick={carregar}>Tentar novamente</Button>}</div>}
    {isAdmin && <ArmazenamentoSite />}
    {!dados ? !erro && <p role="status">Carregando configuração...</p> : <form onSubmit={salvar} className="space-y-6">
      <fieldset disabled={salvando} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-5">
        <legend className="sr-only">Identidade e contatos</legend>
        <h2 className="text-lg font-semibold text-gray-800">Identidade da empresa</h2>
        <p className="text-sm text-gray-600">Nome, logo, telefone e e-mail usam o mesmo cadastro de {isAdmin ? <Link className="text-blue-600 underline" to="/configuracao-empresa">Configurações da empresa</Link> : 'configurações da empresa'}. Alterações também aparecerão nos relatórios e impressões.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['nome', 'Razão social / nome no sistema', 'text', 150], ['nomePublicoSite', 'Nome público do site', 'text', 150], ['telefone', 'Telefone', 'tel', 30],
            ['email', 'E-mail comercial', 'email', 150]
          ].map(([campo, label, tipo, max]) => <label key={campo} className="text-sm font-medium text-gray-700">{label}<Input type={tipo} value={dados[campo]??''} maxLength={max} required={campo === 'nome'} onChange={event => alterar(campo, event.target.value)} placeholder={campo === 'whatsapp' ? '5511999999999' : ''} /></label>)}
        </div>
        <p className="text-sm text-gray-600">O nome público identifica o site. Deixe vazio para usar o nome da empresa. Alterar o nome público não muda relatórios ou documentos do sistema.</p>
        <label className="block text-sm font-medium text-gray-700">WhatsApp — DDD e número
          <div className="flex items-center gap-2 mt-2"><span className="rounded-lg bg-gray-100 px-3 py-3" aria-label="Código do Brasil">+55</span><Input type="tel" autoComplete="tel-national" maxLength={25} value={/^55\d{10,11}$/.test(dados.whatsapp) ? dados.whatsapp.slice(2) : dados.whatsapp} onChange={event => alterar('whatsapp', event.target.value)} placeholder="61 99582-2399" /></div>
          <span className="block text-xs font-normal text-gray-500 mt-2">Informe apenas DDD e número. O código do Brasil é acrescentado automaticamente ao salvar.</span>
        </label>
        <UploadImagemSite value={dados.logoUrl} grupo="configuracao" perfil="logo" ajuste={dados.ajustesImagens?.logoUrl} onAjusteChange={v=>alterar('ajustesImagens',{...dados.ajustesImagens,logoUrl:v})} onChange={valor => alterar('logoUrl',valor)} onBusy={setEnviandoLogo} disabled={salvando} />
      </fieldset>
      <fieldset disabled={salvando} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-5">
        <legend className="sr-only">Aparência e endereços</legend>
        <h2 className="text-lg font-semibold text-gray-800">Aparência e endereços</h2>
        <label className="flex items-center gap-3 text-sm font-medium text-gray-700"><input className="h-5 w-5" type="checkbox" checked={dados.ativo} onChange={event => alterar('ativo', event.target.checked)} />Ativar configuração pública do site</label>
        <p className="text-sm text-gray-600">Desativar bloqueia a configuração pública na API. O sistema interno continua disponível.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['corPrimaria', 'Cor principal'], ['corDestaque', 'Cor de destaque']
          ].map(([campo, label]) => <label key={campo} className="text-sm font-medium text-gray-700">{label}<div className="flex items-center gap-3 mt-2"><input type="color" value={dados[campo]} onChange={event => alterar(campo, event.target.value)} aria-label={`Selecionar ${label.toLowerCase()}`} className="w-14 h-11" /><Input pattern="#[0-9A-Fa-f]{6}" required value={dados[campo]} onChange={event => alterar(campo, event.target.value)} /></div></label>)}
          {[
            ['siteUrl', 'Endereço do site', 'http://127.0.0.1:5180'],
            ['sistemaUrl', 'Endereço de acesso ao sistema', 'http://localhost:5173']
          ].map(([campo, label, placeholder]) => <label key={campo} className="text-sm font-medium text-gray-700">{label}<Input type="url" maxLength={2048} value={dados[campo]} placeholder={placeholder} onChange={event => alterar(campo, event.target.value)} /></label>)}
        </div>
        <p className="text-sm text-gray-600">Para testar, use os endereços locais. Estes campos configuram os links; não alteram DNS, Nginx ou certificados. O endereço atual biomadeira.cooperagestao.com.br pode ser cadastrado quando for publicar.</p>
        <div className="rounded-xl p-5" style={{ backgroundColor: dados.corPrimaria, color: '#fff' }}><p className="font-semibold">{dados.nomePublicoSite || dados.nome || 'Sua empresa'}</p><span className="inline-block rounded-lg px-4 py-2 mt-3 text-gray-900 font-semibold" style={{ backgroundColor: dados.corDestaque }}>Solicitar orçamento</span><p className="text-sm mt-3">Prévia das cores. Verifique a leitura dos textos ao escolher a combinação.</p></div>
      </fieldset>
      <fieldset disabled={salvando} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-5"><legend className="sr-only">Redes sociais</legend><h2 className="text-lg font-semibold text-gray-800">Redes sociais da empresa</h2><p className="text-sm text-gray-600">Cole o endereço completo do perfil. Apenas as redes preenchidas aparecem no topo e no rodapé do site. Deixe em branco para ocultar. Esses links são independentes da conexão para publicar no Instagram.</p><div className="grid md:grid-cols-2 gap-4">{[['instagram','Instagram','instagram.com/suaempresa/'],['facebook','Facebook','facebook.com/suaempresa/'],['youtube','YouTube','youtube.com/@suaempresa'],['linkedin','LinkedIn','linkedin.com/company/suaempresa/'],['tiktok','TikTok','tiktok.com/@suaempresa'],['x','X (Twitter)','x.com/suaempresa'],['pinterest','Pinterest','pinterest.com/suaempresa/'],['telegram','Telegram','t.me/suaempresa'],['threads','Threads','threads.com/@suaempresa']].map(([key,label,placeholder])=><label key={key} className="text-sm font-medium text-gray-700">{label}<Input type="url" maxLength={2048} value={dados.redesSociais?.[key]??(key==='instagram'?dados.instagramUrl:'')??''} placeholder={'https://'+placeholder} onChange={e=>setDados(a=>({...a,redesSociais:{...a.redesSociais,[key]:e.target.value},...(key==='instagram'?{instagramUrl:e.target.value}:{})}))}/></label>)}</div><p className="text-xs text-gray-500">O ícone de WhatsApp usa o número cadastrado em Identidade da empresa. Não é necessário preencher novamente.</p></fieldset>
      <fieldset disabled={salvando}><TamanhosImagensSite value={dados.ajustesImagens?.tamanhosSite} onChange={v=>alterar('ajustesImagens',{...dados.ajustesImagens,tamanhosSite:v})} logoUrl={dados.logoUrl} imagemUrl={dados.imagemHomeUrl||dados.conteudo?.imagemSobreUrl} cor={dados.corPrimaria}/></fieldset>
      <PreviaSite configuracao={{...dados,nome:dados.nomePublicoSite||dados.nome}} />
      <Button type="submit" loading={salvando} disabled={enviandoLogo}><Save size={16} />Salvar configuração do site</Button>
    </form>}
  </div>
}
