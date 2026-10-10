import { useState } from 'react'
import { api } from '../services/api'
import { Button } from './ui/Button'

export function AcessoClientePedido({ pedidoId }) {
 const [mensagem,setMensagem]=useState(null),[erro,setErro]=useState(''),[busy,setBusy]=useState(false),[copiado,setCopiado]=useState(false)
 async function preparar(){setCopiado(false);setBusy(true);setErro('');setMensagem(null);try{const r=await api.post(`/comercial-site/pedidos/${pedidoId}/acesso`);setMensagem(r.data)}catch(e){setErro(e.response?.data?.error||'Não foi possível preparar o acesso.')}finally{setBusy(false)}}
 return <section className="no-print my-4 rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
  <h2 className="font-semibold text-green-900">Acesso do cliente ao pedido</h2>
  <p className="text-sm text-gray-600">Prepare a mensagem para o telefone cadastrado. Quem já tem acesso mantém sua senha; novos clientes recebem um convite válido por 24 horas.</p>
  <Button disabled={busy} onClick={preparar}>{busy?'Preparando…':'Preparar acesso para WhatsApp'}</Button>
  {erro&&<p role="alert" className="text-red-700">{erro}</p>}
  {mensagem&&<div className="space-y-3"><p role="status">{mensagem.novoAcesso?'Convite criado. Um novo convite substitui o anterior ainda não ativado.':'O cliente já tem acesso. A senha foi preservada.'}</p><textarea aria-label="Mensagem para o cliente" readOnly value={mensagem.texto} rows={7} className="w-full border rounded-lg p-3 bg-white"/><a href={mensagem.link} target="_blank" rel="noopener noreferrer" className="block underline text-green-800 break-all">{mensagem.novoAcesso?'Abrir formulário de criar senha':'Abrir Área do Cliente'}</a><Button onClick={async()=>{try{await navigator.clipboard.writeText(mensagem.link);setCopiado(true)}catch{setErro('Não foi possível copiar. Copie o endereço da mensagem acima.')}}}>{copiado?'Link copiado':'Copiar somente o link'}</Button><a href={mensagem.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-800 text-white rounded-lg px-4 py-2">Abrir WhatsApp para enviar</a>{['localhost','127.0.0.1'].includes(new URL(mensagem.link).hostname)&&<p className="text-sm text-amber-800">Este é um link local, para testar neste computador. Para o cliente abrir no celular, precisamos publicar o site.</p>}<p className="text-xs text-gray-600">Confira o destinatário e envie a mensagem no WhatsApp. Abrir o aplicativo não registra envio ou leitura.</p></div>}
 </section>
}
