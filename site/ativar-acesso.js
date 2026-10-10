const form=document.querySelector('#activation-form'),message=document.querySelector('#activation-message');
const convite=location.hash.slice(1);
history.replaceState(null,'',location.pathname);
if(!/^[a-f0-9]{64}$/.test(convite)){
 form.hidden=true;message.textContent='Abra o link completo enviado pela empresa. Se o convite expirou, solicite um novo.';
}else{
 form.elements.documento.focus({preventScroll:true});
 form.addEventListener('submit',async event=>{
  event.preventDefault();message.textContent='';
  if(form.elements.senha.value!==form.elements.confirmacao.value){message.textContent='As senhas precisam ser iguais.';return;}
  const button=form.querySelector('button');button.disabled=true;
  try{
   const response=await fetch('/api/atendimento-site/cliente/ativar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({convite,documento:form.elements.documento.value,senha:form.elements.senha.value}),cache:'no-store',signal:AbortSignal.timeout(20000)});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível ativar o acesso.');
   form.reset();form.hidden=true;message.textContent='Senha criada! Agora entre com seu CPF/CNPJ e sua senha.';document.querySelector('#activation-login').hidden=false;
  }catch(e){message.textContent=e.message==='Failed to fetch'?'Não foi possível conectar. Tente novamente.':e.message;}
  finally{button.disabled=false;}
 });
}
// A identidade não bloqueia a abertura do formulário.
fetch('/api/public/configuracao',{signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(config=>{
 if(!config)return;document.querySelector('#activation-company').textContent=config.nome||'Área do Cliente';
 if(/^#[0-9a-f]{6}$/i.test(config.corPrimaria))document.documentElement.style.setProperty('--primary',config.corPrimaria);
}).catch(()=>{});
