import {useState} from 'react'
import logoTone from '../../../site/assets/logo-tone.svg?url'
import {tamanhosSiteCampos} from '../../../site/config.js'

export function TamanhosImagensSite({value={},onChange,logoUrl,imagemUrl,cor='#084f2b'}){
 const [modo,setModo]=useState('Desktop')
 const tamanho=key=>value[key]??tamanhosSiteCampos.find(([id])=>id===key)[4]
 const celular=modo==='Mobile',escala=celular ? .75 : .45
 return <section className="rounded-2xl border bg-white p-5 space-y-5">
  <div><h2 className="text-lg font-semibold">Tamanho das imagens no site</h2><p className="text-sm text-gray-600 mt-1">Ajuste computador e celular separadamente. Os valores estão em pixels e só vão para o site ao salvar.</p></div>
  <div className="grid md:grid-cols-2 gap-5">{tamanhosSiteCampos.map(([key,label,min,max,padrao])=><label key={key} className="block text-sm font-medium">{label}<span className="float-right text-gray-500">{value[key]??padrao} px</span><input className="block w-full mt-3 accent-emerald-700" type="range" min={min} max={max} step={10} value={value[key]??padrao} onChange={e=>onChange({...value,[key]:Number(e.target.value)})}/><button type="button" className="text-xs text-emerald-800 underline mt-1" onClick={()=>{const next={...value};delete next[key];onChange(next)}}>Restaurar padrão</button></label>)}</div>
  <div className="border-t pt-4 space-y-3"><h3 className="font-semibold">Prévia de proporções</h3><div className="flex gap-2">{[['Desktop','Computador'],['Mobile','Celular']].map(([key,label])=><button type="button" key={key} aria-pressed={modo===key} className={`rounded-lg border px-4 py-2 text-sm ${modo===key?'bg-emerald-800 text-white':'bg-white text-gray-700'}`} onClick={()=>setModo(key)}>{label}</button>)}</div><p className="text-xs text-gray-500">Simulação reduzida para comparar tamanhos. Os textos, menus e recortes reais podem variar. “Mostrar inteira” preserva toda a foto; “Preencher” pode recortar.</p>
   <div className="overflow-auto bg-slate-100 rounded-xl p-3"><div className="mx-auto bg-white border rounded-lg overflow-hidden" style={{width:celular?293:'100%',maxWidth:650}}>
    <div className="flex items-center justify-between gap-3 p-3 border-b">{logoUrl?<img src={logoUrl} alt="Prévia do tamanho da logo" style={{width:tamanho('logo'+modo)*escala,height:'auto',filter:`url("${logoTone}#amarelo")`}}/>:<strong>Logo</strong>}<span className="text-xs text-gray-500">{celular?'☰':'Serviços · Materiais · Contato'}</span></div>
    <div className="relative flex items-center p-5 text-white overflow-hidden" style={{height:tamanho('banner'+modo)*escala,background:cor}}>{imagemUrl&&<img src={imagemUrl} alt="Prévia do banner" className="absolute inset-0 w-full h-full object-cover opacity-30"/>}<strong className="relative">Banner principal</strong></div>
    <div className="p-4"><div className="rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center text-sm text-gray-600" style={{height:tamanho('fotos'+modo)*escala}}>{imagemUrl?<img src={imagemUrl} alt="Prévia da foto da seção" className="w-full h-full object-contain"/>:'Foto da seção'}</div></div>
   </div></div>
  </div>
 </section>
}
