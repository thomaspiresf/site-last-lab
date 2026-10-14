import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, FileDown, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { getAdminSession, getDiagnostico, updateDiagnostico, uploadImagemDoc } from "../lib/api";
import { exportarPdf, nomeArquivo } from "./exportarPdf";
import { DOCUMENTOS, dadosDoDocumento } from "./docs";
import { Palco } from "./docs/base";
import "./guia.css";

// Editor genérico dos entregáveis (/admin/diagnosticos/:id/doc/:docId): o painel sai das seções
// do documento (docs/*.jsx) e as páginas aparecem ao lado. Salva em diagnosticos.apresentacao[chave]
// ao sair de cada campo (ou na hora, ao adicionar, remover ou enviar imagem).

const FONTE = "https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap";
const FONTES_SUGERIDAS = ["Poppins", "Inter", "Montserrat", "DM Sans", "Manrope", "Plus Jakarta Sans", "Space Grotesk", "Playfair Display", "Lora", "Fraunces", "Libre Baskerville", "Work Sans", "Outfit", "Sora", "Raleway"];

export default function AdminDocumento() {
  const { id, docId } = useParams();
  const doc = DOCUMENTOS[docId];
  const [sessao, setSessao] = useState(undefined);
  const [item, setItem] = useState(null);
  const [g, setG] = useState(null);
  const [erro, setErro] = useState("");
  const [gerando, setGerando] = useState(false);
  const impressao = useRef(null);

  useEffect(() => { getAdminSession().then(setSessao); }, []);
  useEffect(() => {
    if (!document.querySelector(`link[href="${FONTE}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.crossOrigin = "anonymous";
      l.href = FONTE;
      document.head.appendChild(l);
    }
  }, []);
  useEffect(() => {
    if (!sessao || !doc) return;
    getDiagnostico(id).then((d) => { setItem(d); setG(dadosDoDocumento(doc, d.apresentacao)); })
      .catch((e) => setErro(e.message || "Não consegui carregar o lead."));
  }, [sessao, id, doc]);

  // grava em cima da versão mais recente (apresentação, roteiro e guias usam o mesmo campo)
  const salvar = async (novo) => {
    try {
      const atual = await getDiagnostico(id);
      await updateDiagnostico(id, { apresentacao: { ...(atual.apresentacao || {}), [doc.chave]: novo } });
      setErro("");
    } catch (e) {
      setErro(e.message || "Não salvou.");
    }
  };

  const paginas = useMemo(() => (g ? doc.paginas(g).map(([P]) => (props) => <P g={g} nome={item?.nome} doc={doc} {...props} />) : []), [g, item, doc]);

  if (!doc) return <div className="p-10 text-sm text-zinc-500">Documento não encontrado.</div>;
  if (sessao === undefined) return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>;
  if (!sessao) return <Navigate to="/admin/login" replace />;
  if (!g) return <div className="p-10 text-sm text-zinc-400">{erro || "Carregando..."}</div>;

  const nomes = doc.paginas(g).map(([, n]) => n);
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="gm-tela">
        <header className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-6 py-3 flex items-center gap-4">
          <Link to="/admin/entregaveis" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black"><ArrowLeft size={16} /> Entregáveis</Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{doc.nome} · {g.marca || item.nome}</p>
            <p className="text-xs text-zinc-500">{nomes.length} {nomes.length === 1 ? "página" : "páginas"} · salva ao sair de cada campo</p>
          </div>
          {erro && <span className="text-xs text-red-600">{erro}</span>}
          <button disabled={gerando} onClick={async () => {
            setGerando(true);
            try {
              await exportarPdf([...impressao.current.children], { largura: 794, altura: 1123, nitidez: 2, nome: nomeArquivo(doc.nome, g.marca || item.nome) });
            } catch (e) {
              setErro(`Não gerou o PDF: ${e.message || e}`);
            } finally {
              setGerando(false);
            }
          }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"><FileDown size={15} /> {gerando ? "Gerando PDF..." : "Exportar PDF"}</button>
        </header>
        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 p-6 items-start">
          <Painel doc={doc} g={g} setG={setG} salvar={salvar} />
          <div className={`grid gap-5 ${paginas.length === 1 ? "grid-cols-1 max-w-2xl" : "grid-cols-2"}`}>
            {paginas.map((P, i) => (
              <div key={i}>
                <div className="rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5"><Palco><P /></Palco></div>
                <p className="text-xs text-zinc-500 mt-1.5">{i + 1} · {nomes[i]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div ref={impressao} className="gm-impressao" aria-hidden="true">{paginas.map((P, i) => <P key={i} />)}</div>
    </div>
  );
}

// ---------- painel ----------

const CAMPO = "w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm outline-none focus:border-zinc-400";
const ROTULO = "block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5";

function Painel({ doc, g, setG, salvar }) {
  const gravar = () => salvar(g);
  const mudar = (k, v) => setG((x) => ({ ...x, [k]: v }));
  const mudarJa = (k, v) => { const n = { ...g, [k]: v }; setG(n); salvar(n); };

  return (
    <aside className="xl:sticky xl:top-[73px] xl:max-h-[calc(100vh-97px)] xl:overflow-y-auto bg-white rounded-2xl ring-1 ring-black/5 p-5 flex flex-col gap-6 text-sm">
      {doc.secoes.map((s) => (
        <section key={s.titulo} className="flex flex-col gap-2.5">
          <div>
            <p className="text-[13px] font-bold">{s.titulo}</p>
            {s.ajuda && <p className="text-[11px] text-zinc-400">{s.ajuda}</p>}
          </div>
          {s.campos.map((c) => (
            <div key={c.k}>
              {c.rotulo && <label className={ROTULO}>{c.rotulo}</label>}
              <Campo c={c} valor={g[c.k]} mudar={(v) => mudar(c.k, v)} mudarJa={(v) => mudarJa(c.k, v)} gravar={gravar} />
            </div>
          ))}
        </section>
      ))}
    </aside>
  );
}

/** Um campo do painel, pelo tipo. `mudar` só altera; `mudarJa` altera e salva. */
function Campo({ c, valor, mudar, mudarJa, gravar }) {
  switch (c.tipo) {
    case "area":
      return <textarea rows={c.rows || 2} className={CAMPO} value={valor || ""} onChange={(e) => mudar(e.target.value)} onBlur={gravar} placeholder={c.ph} />;
    case "fonte":
      return (
        <>
          <input list="fontes-sugeridas" className={CAMPO} value={valor || ""} onChange={(e) => mudar(e.target.value)} onBlur={gravar} placeholder="Nome no Google Fonts" />
          <datalist id="fontes-sugeridas">{FONTES_SUGERIDAS.map((f) => <option key={f} value={f} />)}</datalist>
        </>
      );
    case "numero":
      return <input type="number" className={CAMPO} value={valor ?? ""} onChange={(e) => mudar(e.target.value === "" ? "" : Number(e.target.value))} onBlur={gravar} placeholder={c.ph} />;
    case "nota":
      return (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 w-16">{c.ph}</span>
          <input type="range" min={1} max={5} value={valor || 3} className="flex-1 accent-[#ef4b3a]" onChange={(e) => mudar(Number(e.target.value))} onMouseUp={gravar} onTouchEnd={gravar} onKeyUp={gravar} />
          <span className="text-xs w-14 text-right text-zinc-500">{["", "Frustrado", "Inseguro", "Neutro", "Satisfeito", "Encantado"][valor || 3]}</span>
        </div>
      );
    case "cor":
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(valor || "") ? valor : "#cccccc"} onChange={(e) => mudar(e.target.value.toUpperCase())} onBlur={gravar} className="w-10 h-9 rounded-lg border border-zinc-200 bg-white p-0.5 cursor-pointer" />
          <input className={CAMPO} value={valor || ""} onChange={(e) => mudar(e.target.value)} onBlur={gravar} placeholder="#000000" />
        </div>
      );
    case "imagem":
      return <EnviarImagem valor={valor} mudarJa={mudarJa} />;
    case "imagens":
      return (
        <div className="grid grid-cols-2 gap-2">
          {(valor || []).map((v, i) => <EnviarImagem key={i} valor={v} mudarJa={(x) => mudarJa(valor.map((y, j) => (j === i ? x : y)))} />)}
        </div>
      );
    case "lista":
      return <Lista c={c} valor={valor || []} mudar={mudar} mudarJa={mudarJa} gravar={gravar} />;
    case "itens":
      return <Itens c={c} valor={valor || []} mudar={mudar} mudarJa={mudarJa} gravar={gravar} />;
    default:
      return <input className={CAMPO} value={valor || ""} onChange={(e) => mudar(e.target.value)} onBlur={gravar} placeholder={c.ph} />;
  }
}

function Lista({ c, valor, mudar, mudarJa, gravar }) {
  return (
    <div className="flex flex-col gap-1.5">
      {valor.map((v, i) => (
        <div key={i} className="flex gap-1.5">
          <input className={CAMPO} value={v} onChange={(e) => mudar(valor.map((y, j) => (j === i ? e.target.value : y)))} onBlur={gravar} placeholder={c.ph} />
          <button onClick={() => mudarJa(valor.filter((_, j) => j !== i))} className="p-2 text-zinc-400 hover:text-black" title="Remover"><X size={14} /></button>
        </div>
      ))}
      {valor.length < (c.max || 10) && <button onClick={() => mudarJa([...valor, ""])} className="self-start inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><Plus size={13} /> Adicionar</button>}
    </div>
  );
}

function Itens({ c, valor, mudar, mudarJa, gravar }) {
  const mudarItem = (i, k, v) => mudar(valor.map((y, j) => (j === i ? { ...y, [k]: v } : y)));
  const mudarItemJa = (i, k, v) => mudarJa(valor.map((y, j) => (j === i ? { ...y, [k]: v } : y)));
  return (
    <div className="flex flex-col gap-2">
      {valor.map((it, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 p-2.5 flex flex-col gap-1.5 relative">
          <button onClick={() => mudarJa(valor.filter((_, j) => j !== i))} className="absolute top-1.5 right-1.5 p-1 text-zinc-300 hover:text-black" title="Remover"><Trash2 size={13} /></button>
          <span className="text-[10px] font-semibold text-zinc-400">{i + 1}</span>
          {c.campos.map((s) => (
            <Campo key={s.k} c={s} valor={it[s.k]} mudar={(v) => mudarItem(i, s.k, v)} mudarJa={(v) => mudarItemJa(i, s.k, v)} gravar={gravar} />
          ))}
        </div>
      ))}
      {valor.length < (c.max || 10) && <button onClick={() => mudarJa([...valor, { ...c.novo }])} className="self-start inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><Plus size={13} /> Adicionar</button>}
    </div>
  );
}

function EnviarImagem({ valor, mudarJa }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const input = useRef(null);
  const enviar = async (f) => {
    if (!f) return;
    setEnviando(true);
    setErro("");
    try {
      mudarJa(await uploadImagemDoc(f));
    } catch (e) {
      setErro(e.message || "Não enviou.");
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => enviar(e.target.files?.[0])} />
      {valor ? (
        <div className="relative rounded-lg bg-zinc-50 border border-zinc-200 h-24 flex items-center justify-center overflow-hidden">
          <img src={valor} alt="" className="max-h-full max-w-full object-contain" />
          <div className="absolute top-1 right-1 flex gap-1">
            <button onClick={() => input.current.click()} className="p-1 rounded-md bg-white/90 text-zinc-600 hover:text-black" title="Trocar"><ImagePlus size={13} /></button>
            <button onClick={() => mudarJa("")} className="p-1 rounded-md bg-white/90 text-zinc-600 hover:text-black" title="Remover"><X size={13} /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => input.current.click()} disabled={enviando} className="w-full h-16 rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 hover:border-black hover:text-black inline-flex items-center justify-center gap-1.5">
          <ImagePlus size={14} /> {enviando ? "Enviando..." : "Enviar imagem"}
        </button>
      )}
      {erro && <p className="text-[11px] text-red-600 mt-1">{erro}</p>}
    </div>
  );
}
