export function desenharGrafico(canvas,labels,values,{titulo='',moeda=false}={}){
  canvas.width=1100;canvas.height=350;const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,1100,350);c.fillStyle='#163d2b';c.font='bold 20px Arial';c.fillText(titulo,20,28);
  const max=moeda?Math.max(1,...values):Math.max(4,Math.ceil(Math.max(0,...values)/4)*4),left=90,top=60,w=980,h=225,step=w/Math.max(1,values.length);
  for(let i=0;i<=4;i++){const y=top+h-i*h/4;c.strokeStyle='#e4e9e5';c.beginPath();c.moveTo(left,y);c.lineTo(left+w,y);c.stroke();c.fillStyle='#47564c';c.font='13px Arial';const n=max*i/4;c.fillText(moeda?n.toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:1}):Math.ceil(n).toLocaleString('pt-BR'),8,y+4)}
  values.forEach((v,i)=>{const bh=v/max*h;c.fillStyle='#15764d';c.fillRect(left+i*step+step*.15,top+h-bh,step*.7,bh);c.save();c.translate(left+i*step+step*.5,top+h+12);c.rotate(-Math.PI/4);c.fillStyle='#47564c';c.font='12px Arial';c.textAlign='right';c.fillText(labels[i],0,0);c.restore()});
  return canvas;
}
export async function exportarGrafico({titulo,labels,values,moeda=false,empresa,nota,svg,comparacao=[]}){
  const [{jsPDF},{default:autoTable}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
  const doc=new jsPDF({orientation:'landscape'});doc.setFontSize(18);doc.text(empresa||'Área da Empresa',14,16);doc.setFontSize(10);doc.text('Gerado em '+new Date().toLocaleString('pt-BR'),14,24);
  let canvas;
  if(svg){
    const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
    try{const image=new Image();image.src=url;await image.decode();canvas=document.createElement('canvas');canvas.width=1940;canvas.height=620;const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,1940,620);context.drawImage(image,0,0,1940,620)}finally{URL.revokeObjectURL(url)}
  }else canvas=desenharGrafico(document.createElement('canvas'),labels,values,{titulo,moeda});
  doc.setFontSize(13);doc.text(titulo,14,29);
  doc.addImage(canvas.toDataURL('image/png'),'PNG',14,30,269,85);doc.setFontSize(9);doc.text(doc.splitTextToSize(nota||'',269),14,122);
  autoTable(doc,{startY:140,head:[['Período / situação',moeda?'Valor dos pedidos (R$)':'Quantidade',...(comparacao.length?['Mês comparado','Valor anterior']:[])]],body:labels.map((l,i)=>[l,values[i].toLocaleString('pt-BR',{minimumFractionDigits:moeda?2:0,maximumFractionDigits:2}),...(comparacao.length?[comparacao[i].mes,comparacao[i].valor.toLocaleString('pt-BR',{minimumFractionDigits:moeda?2:0,maximumFractionDigits:2})]:[])]),styles:{fontSize:9},headStyles:{fillColor:[21,118,77]}});doc.save('indicadores-empresa.pdf');
}
