// Rejeita excesso em vez de manter uma fila ilimitada de trabalho caro em memória.
export function limitarProcessamento(maximo = 2) {
 let ativos = 0;
 return handler => async (req,res,next) => {
  if (ativos >= maximo) { res.setHeader('Retry-After','3'); return res.status(503).json({error:'Serviço ocupado. Tente novamente em alguns segundos.'}); }
  ativos++;
  try { await handler(req,res,next); } finally { ativos--; }
 };
}
