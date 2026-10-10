import {useId,useRef,useState} from 'react'
import {exportarGrafico} from '../utils/graficoEmpresa'
const numero=(v,moeda)=>v.toLocaleString('pt-BR',moeda?{style:'currency',currency:'BRL'}:{});
export function GraficoExecutivo({titulo,items,metrica,moeda,empresa,onSelect,anterior=[]}){
  const svgRef=useRef(),gradientId=useId().replaceAll(':','');
  const [hover,setHover]=useState(null),[tipo,setTipo]=useState('linha'),[tabela,setTabela]=useState(false),[busy,setBusy]=useState(false),[erro,setErro]=useState('');
  const values=items.map(i=>Number(i[metrica]||0)),rawMax=Math.max(1,...values,...anterior.map(i=>Number(i[metrica]||0))),max=moeda?rawMax:Math.max(4,Math.ceil(rawMax/4)*4),step=850/Math.max(1,items.length),x=i=>90+(i+.5)*step,y=v=>260-v/max*210;
  const path=arr=>arr.map((v,i)=>`${i?'L':'M'}${x(i)},${y(v)}`).join(' ');
  const labels=items.map(i=>i.mes.split('-').reverse().join('/'));
  const nota='Mês de criação do pedido; valor exclui cancelados e não representa recebimentos. Serviços pela data de conclusão. Mês atual parcial.';
  return <section className="executive-panel"><div className="panel-heading"><div><span className="executive-eyebrow">EVOLUÇÃO DO NEGÓCIO</span><h3>{titulo}</h3><p>Clique em um mês para explorar os pedidos.</p></div><div className="chart-actions"><button aria-pressed={tipo==='linha'} onClick={()=>setTipo('linha')}>Linha</button><button aria-pressed={tipo==='barras'} onClick={()=>setTipo('barras')}>Barras</button><button disabled={busy} onClick={async()=>{setBusy(true);try{await exportarGrafico({titulo,labels,values,moeda,empresa,nota,svg:svgRef.current,comparacao:anterior.length===items.length?anterior.map(i=>({mes:i.mes,valor:Number(i[metrica]||0)})):[]});setErro('')}catch{setErro('Não foi possível gerar o PDF.')}finally{setBusy(false)}}}>{busy?'Gerando…':'↓ PDF + dados'}</button></div></div>{erro&&<p role="alert">{erro}</p>}
  <div className="interactive-chart"><svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 970 310" role="group" aria-label={titulo}>
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16856b" stopOpacity=".25"/><stop offset="1" stopColor="#16856b" stopOpacity="0"/></linearGradient></defs>
    {[0,1,2,3,4].map(i=><g key={i}><line x1="85" x2="945" y1={y(max*i/4)} y2={y(max*i/4)} stroke="#e5edf0" strokeDasharray="4 5"/><text x="75" y={y(max*i/4)+4} textAnchor="end" fill="#718096" fontSize="12">{(max*i/4).toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:1})}</text></g>)}
    {anterior.length===items.length&&<path d={path(anterior.map(i=>Number(i[metrica]||0)))} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"/>}
    {tipo==='linha'&&items.length>0&&<><path d={`${path(values)} L${x(items.length-1)},260 L${x(0)},260 Z`} fill={`url(#${gradientId})`}/><path d={path(values)} fill="none" stroke="#16856b" strokeWidth="3" strokeLinejoin="round"/></>}
    {items.map((item,i)=><g key={item.mes} role="button" tabIndex="0" aria-label={`${labels[i]}: ${numero(values[i],moeda)}. Explorar pedidos`} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(i)} onBlur={()=>setHover(null)} onClick={()=>onSelect?.(item.mes)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(item.mes)}}} style={{cursor:'pointer'}}>
      <rect x={90+i*step} y="40" width={step} height="225" fill={hover===i?'#16856b12':'transparent'}/>{tipo==='barras'?<rect x={x(i)-step*.28} y={y(values[i])} width={step*.56} height={260-y(values[i])} rx="4" fill={hover===i?'#065f46':'#16856b'}/>:<circle cx={x(i)} cy={y(values[i])} r={hover===i?7:4} fill="#16856b" stroke="white" strokeWidth="2"/>}
      {(items.length<=12||i%2===0||i===items.length-1)&&<text x={x(i)} y="287" textAnchor="middle" fill="#718096" fontSize="12">{labels[i]}</text>}
    </g>)}
  </svg><div className="chart-tooltip" role="status">{hover!==null&&items[hover]?`${labels[hover]} · ${numero(values[hover],moeda)}${anterior.length===items.length?' · Anterior: '+numero(Number(anterior[hover]?.[metrica]||0),moeda):''}`:'Passe o mouse ou use Tab para consultar os valores'} </div></div>
  <div className="chart-foot"><span><i/> Período selecionado {anterior.length===items.length&&<span className="previous-legend">╌ Período anterior de mesma duração</span>}</span><button onClick={()=>setTabela(v=>!v)} aria-expanded={tabela}>{tabela?'Ocultar':'Ver'} tabela de dados</button></div>
  {tabela&&<div className="executive-table"><table><thead><tr><th>Mês</th><th>Selecionado</th><th>Anterior</th></tr></thead><tbody>{items.map((i,j)=><tr key={i.mes}><td><button onClick={()=>onSelect?.(i.mes)}>{labels[j]}</button></td><td>{numero(values[j],moeda)}</td><td>{anterior.length===items.length?numero(Number(anterior[j][metrica]||0),moeda):'Sem período completo'}</td></tr>)}</tbody></table></div>}
  </section>
}
