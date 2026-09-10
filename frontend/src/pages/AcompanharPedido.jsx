import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import axios from "axios"

const apiPublica = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", timeout: 20000 })
const campo = "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"

function classeEvento(tipo = "") {
  if (tipo.includes("EXCLUIDO")) return "border-red-300 bg-red-50 text-red-700"
  if (tipo.includes("STATUS")) return "border-yellow-300 bg-yellow-50 text-yellow-800"
  if (tipo.includes("CRIADO")) return "border-blue-300 bg-blue-50 text-blue-700"
  return "border-purple-300 bg-purple-50 text-purple-700"
}

function dataFormatada(data, hora = false) {
  if (!data) return "Ainda não informada"
  return new Date(data).toLocaleString("pt-BR", hora
    ? { dateStyle: "short", timeStyle: "short" }
    : { dateStyle: "short" })
}

export function AcompanharPedido() {
  const [params] = useSearchParams()
  const pedidoId = params.get("pedido") || ""
  const [numero, setNumero] = useState("")
  const [documento, setDocumento] = useState("")
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function consultar(event) {
    event.preventDefault()
    setResultado(null)
    setErro("")
    setCarregando(true)
    try {
      const { data } = await apiPublica.post("/acompanhamento/consultar", {
        ...(pedidoId ? { pedidoId } : { numero: numero.trim() }), documento
      })
      setResultado(data)
      setDocumento("")
    } catch (error) {
      setErro(error.response?.data?.error || "Não foi possível conectar. Tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-700">Biomadeira</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Acompanhe seu pedido</h1>
          <p className="mt-3 text-gray-600">Consulte o andamento da produção e da entrega.</p>
        </header>
        <form onSubmit={consultar} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" aria-busy={carregando}>
          <fieldset disabled={carregando} className="space-y-5">
            {pedidoId ? (
              <p className="rounded-xl bg-emerald-50 p-4 text-emerald-900">Você recebeu um link de acompanhamento. Confirme abaixo os primeiros dígitos do documento do cliente.</p>
            ) : (
              <label className="block font-medium">Número do pedido
                <input className={campo} value={numero} onChange={(e) => { setNumero(e.target.value); setResultado(null) }} required maxLength={80} placeholder="Informe o número do seu pedido" />
              </label>
            )}
            <label className="block font-medium">Cinco primeiros dígitos do CPF ou CNPJ
              <input className={campo} value={documento} onChange={(e) => { setDocumento(e.target.value.replace(/\D/g, "").slice(0, 5)); setResultado(null) }} inputMode="numeric" pattern="[0-9]{5}" minLength={5} maxLength={5} autoComplete="off" type="password" required aria-describedby="documento-ajuda" />
            </label>
            <p id="documento-ajuda" className="text-sm text-gray-500">Use o documento cadastrado no pedido, sem pontos ou traços.</p>
            <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{carregando ? "Consultando..." : "Consultar pedido"}</button>
          </fieldset>
          {erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{erro}</p>}
          {pedidoId && <Link to="/acompanhar" onClick={() => { setResultado(null); setErro(""); setDocumento("") }} className="mt-5 block text-center text-sm text-emerald-700 underline">Consultar outro pedido</Link>}
        </form>

        <section aria-live="polite">
          {resultado && (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold">Pedido {resultado.numero}</h2>
                <p className="mt-3 inline-block rounded-full bg-emerald-100 px-4 py-2 font-semibold text-emerald-900">{resultado.status}</p>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-sm text-gray-500">Previsão de entrega / retirada</dt><dd className="mt-1 font-medium">{dataFormatada(resultado.dataEntrega)}</dd></div>
                  <div><dt className="text-sm text-gray-500">Recebimento</dt><dd className="mt-1 font-medium">{resultado.tipoEntrega}</dd></div>
                </dl>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold">Histórico do pedido</h2>
                <ol className="ml-2 space-y-5 border-l-2 border-emerald-200 pl-6">
                  {resultado.historico.map((item, index) => (
                    <li key={`${item.data}-${index}`} className="relative rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <span className="absolute -left-[33px] top-5 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                      {item.tipo && <span className={`mb-3 inline-block max-w-full break-all rounded-full border px-3 py-1 text-xs font-semibold ${classeEvento(item.tipo)}`}>{item.tipo}</span>}
                      <p className="whitespace-pre-wrap break-words font-semibold">{item.descricao}</p>
                      <time dateTime={item.data} className="mt-2 block text-sm text-gray-500">{dataFormatada(item.data, true)}</time>
                      <p className="mt-2 break-words text-sm text-gray-600">Usuário: {item.usuario || "-"}</p>
                    </li>
                  ))}
                </ol>
                {resultado.historico.length === 0 && <p className="text-gray-600">Ainda não há atualizações disponíveis no histórico.</p>}
                <p className="mt-6 text-sm text-gray-500">Para atualizar o andamento, confirme o documento e consulte novamente.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
