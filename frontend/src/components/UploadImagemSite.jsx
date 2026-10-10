import { useState } from 'react'
import { api } from '../services/api'
import { Button } from './ui/Button'
import {perfisImagem,estiloImagem} from '../../../site/config.js'

export function UploadImagemSite({ value, onChange, grupo, onBusy = () => {}, disabled = false,ajuste={},onAjusteChange,perfil='secao' }) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [dimensoes,setDimensoes]=useState(null)
  const ideal=perfisImagem[perfil]||perfisImagem.secao,modo=ajuste?.modo||ideal.modo;
  async function enviar(event) {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return
    setErro('')
    if (!['image/png','image/jpeg','image/webp'].includes(arquivo.type) || arquivo.size > 5*1024*1024) { setErro('Escolha PNG, JPG ou WebP de até 5 MB.'); return }
    setEnviando(true); onBusy(true)
    try {
      // O browser também decodifica a imagem antes de enviá-la.
      const bitmap = await createImageBitmap(arquivo); setDimensoes({largura:bitmap.width,altura:bitmap.height});bitmap.close()
      const { data } = await api.post(`/site/imagens/${grupo}`, arquivo, { headers: { 'Content-Type': arquivo.type } })
      onChange(data.url)
    } catch(error) { setErro(error.response?.data?.error || 'Não foi possível enviar. Confira se o arquivo é uma imagem válida.') }
    finally { setEnviando(false); onBusy(false); event.target.value='' }
  }
  return <div className="space-y-3">
    {value && <div className="rounded-xl border bg-gray-100 overflow-hidden max-w-md" style={{aspectRatio:`${ideal.largura}/${ideal.altura}`}}><img src={value} alt="Prévia da imagem selecionada" className="h-full w-full" style={estiloImagem(ajuste,ideal.modo)} onLoad={e=>setDimensoes({largura:e.currentTarget.naturalWidth,altura:e.currentTarget.naturalHeight})}/></div>}
    <label className="block text-sm font-medium text-gray-700">Selecionar imagem
      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || enviando} onChange={enviar} className="block w-full border border-gray-300 rounded-lg p-3 mt-2 text-sm" />
    </label>
    <p className="text-xs text-gray-500">PNG, JPG ou WebP estático, até 5 MB. Otimização automática em WebP. A imagem será aplicada ao salvar o formulário.</p>
    <p className="text-sm text-gray-700"><strong>Recomendado: {ideal.largura} × {ideal.altura} px</strong>. {ideal.nota}</p>
    {value&&dimensoes&&<p className="text-xs text-gray-600">Imagem atual: {dimensoes.largura} × {dimensoes.altura} px.{(dimensoes.largura<ideal.largura||dimensoes.altura<ideal.altura)&&' Abaixo do tamanho recomendado; ampliar pode reduzir a nitidez.'}</p>}
    {onAjusteChange&&<div className="space-y-3"><label className="block text-sm font-medium">Como mostrar a imagem<select className="block w-full border rounded-lg p-2 mt-1" value={modo} disabled={disabled||enviando} onChange={e=>onAjusteChange({...ajuste,modo:e.target.value,x:ajuste?.x??50,y:ajuste?.y??50})}><option value="contain">Mostrar inteira (pode deixar margens)</option><option value="cover">Preencher o espaço (recorta as bordas)</option><option value="natural">Não ampliar (reduz se necessário)</option></select></label>{modo==='cover'&&<>{[['x','Posição horizontal'],['y','Posição vertical']].map(([key,label])=><label className="block text-sm" key={key}>{label}<input className="block w-full" type="range" min="0" max="100" value={ajuste?.[key]??50} disabled={disabled||enviando} onChange={e=>onAjusteChange({...ajuste,modo,x:ajuste?.x??50,y:ajuste?.y??50,[key]:Number(e.target.value)})}/></label>)}</>}<p className="text-xs text-gray-500">A proporção do espaço pode variar no celular. Os modos preservam a proporção da foto, sem deformar.</p></div>}
    {enviando && <p role="status" className="text-sm text-blue-700">Enviando imagem...</p>}
    {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    {value && <Button disabled={disabled || enviando} variant="dangersoft" onClick={() => onChange('')}>Remover da publicação</Button>}
  </div>
}
