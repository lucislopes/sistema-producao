import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
const mb = bytes => (bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
export function ArmazenamentoSite() {
  const [info, setInfo] = useState(null)
  const [cota, setCota] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [busy, setBusy] = useState(false)
  async function carregar() {
    setErro('')
    try { const { data } = await api.get('/site/armazenamento'); setInfo(data); setCota(String(data.cotaBytes / 1048576)) }
    catch { setErro('Não foi possível consultar o armazenamento.') }
  }
  useEffect(() => { carregar() }, [])
  async function salvar() {
    setBusy(true); setErro(''); setMensagem('')
    try { const { data } = await api.put('/site/armazenamento', { cotaMB: Number(cota) }); setInfo(data); setCota(String(data.cotaBytes / 1048576)); setMensagem('Cota de imagens salva.') }
    catch(e) { setErro(e.response?.data?.error || 'Não foi possível salvar a cota.') }
    finally { setBusy(false) }
  }
  return <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4" aria-label="Armazenamento de imagens">
    <h2 className="text-lg font-semibold text-gray-800">Armazenamento de imagens</h2>
    <p className="text-sm text-gray-600">Novas imagens são otimizadas automaticamente em WebP. Produtos e categorias: até 1.200 pixels; imagem principal, banners e logos: até 1.920 pixels. Transparência preservada.</p>
    {info && <>
      <p className="text-sm font-medium">{mb(info.usadoBytes)} MB de {mb(info.cotaBytes)} MB utilizados · {info.arquivos} arquivos</p>
      <div role="progressbar" aria-label="Espaço utilizado" aria-valuenow={Math.min(100,info.percentual)} aria-valuemin={0} aria-valuemax={100} className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className={info.alerta ? 'h-full bg-amber-500' : 'h-full bg-blue-600'} style={{width:`${Math.min(100,info.percentual)}%`}} /></div>
      {info.alerta && <p role="status" className="text-amber-800">{info.bloqueado ? 'Cota atingida. Novos envios estão bloqueados; as imagens existentes continuam disponíveis.' : 'Atenção: mais de 80% da cota está em uso.'}</p>}
      <label className="block text-sm font-medium text-gray-700">Cota de imagens (MB)<Input type="number" min="1" max="102400" step="1" value={cota} onChange={e => setCota(e.target.value)} disabled={busy} /></label>
      <div className="flex gap-3"><Button type="button" onClick={salvar} loading={busy}>Salvar cota de imagens</Button><Button type="button" onClick={carregar} disabled={busy}>Atualizar uso</Button></div>
    </>}
    {mensagem && <p role="status" className="text-green-700">{mensagem}</p>}
    {erro && <p role="alert" className="text-red-700">{erro}<button type="button" className="ml-2 underline" onClick={carregar}>Tentar novamente</button></p>}
    <p className="text-xs text-gray-500">A cota inclui uploads antigos e arquivos sem referência. Não inclui banco, backups ou outros arquivos da VPS. Ajuste conforme o espaço disponível. Biblioteca e limpeza segura serão adicionadas na próxima etapa.</p>
  </section>
}
