export function linkOrcamentoWhatsApp(numero, texto) {
  const digits = String(numero || '').replace(/\D/g, '');
  if (!/^[1-9]\d{9,14}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(texto)}`;
}
