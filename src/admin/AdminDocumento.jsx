import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, FileDown, ImagePlus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { getAdminSession, getDiagnostico, updateDiagnostico, uploadImagemDoc } from "../lib/api";
import { exportarPdf, nomeArquivo } from "./exportarPdf";
import { DOCUMENTOS, dadosDoDocumento, paginasDe, propsDasPaginas, secoesDaPagina, versaoDe, versoesDe } from "./docs";
import { Palco } from "./docs/base";
import { PaginaCtx } from "./docs/ctx";
import "./guia.css";

// Editor dos entregáveis, página a página (/admin/diagnosticos/:id/doc/:docId; os guias também em
// /guia e /guia-marca). À esquerda as páginas, no meio a página em foco e à direita só o que ela
// usa: o conteúdo (seções do documento), os textos fixos (títulos, aberturas e rótulos, trocados por
// página) e o visual (fundo, cor de destaque, tamanho do título e dos textos). Tudo fica em
// diagnosticos.apresentacao[chave]: o conteúdo na raiz, textos em g.textos[página] e visual em
// g.estilo[página]. Salva ao sair de cada campo (ou na hora, ao adicionar, remover ou enviar imagem).

const FONTE = "https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap";
const FONTES_SUGERIDAS = ["Poppins", "Inter", "Montserrat", "DM Sans", "Manrope", "Plus Jakarta Sans", "Space Grotesk", "Playfair Display", "Lora", "Fraunces", "Libre Baskerville", "Work Sans", "Outfit", "Sora", "Raleway"];

/** Lê e grava por caminho ("cliente.quem"). */
const pegar = (g, k) => k.split(".").reduce((o, p) => (o == null ? o : o[p]), g);
const colocar = (g, k, v) => {
  const [p, ...r] = k.split(".");
  return { ...g, [p]: r.length ? colocar(g?.[p] || {}, r.join("."), v) : v };
};

export default function AdminDocumento({ docFixo }) {
  const { id, docId } = useParams();
  const doc = DOCUMENTOS[docFixo || docId];
  const [sessao, setSessao] = useState(undefined);
  const [item, setItem] = useState(null);
  const [g, setG] = useState(null);
  const [erro, setErro] = useState("");
  const [gerando, setGerando] = useState(false);
  const [atual, setAtual] = useState(0);
  const [fixos, setFixos] = useState([]);
  const impressao = useRef(null);
  const registro = useRef(new Set());

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
      const atualizado = await getDiagnostico(id);
      await updateDiagnostico(id, { apresentacao: { ...(atualizado.apresentacao || {}), [doc.chave]: novo } });
      setErro("");
    } catch (e) {
      setErro(e.message || "Não salvou.");
    }
  };

  const versao = g ? versaoDe(doc, g) : "v1";
  const lista = useMemo(() => (g ? propsDasPaginas(paginasDe(doc, g), versaoDe(doc, g)) : []), [g, doc]);
  const foco = Math.min(atual, Math.max(0, lista.length - 1));
  const nomePag = lista[foco]?.nome;

  // os textos fixos usados pela página em foco aparecem no painel: ela os registra ao desenhar
  // (às vezes depois do editor, quando mede a largura), e a lista se atualiza logo em seguida
  registro.current = new Set();
  const pendente = useRef(false);
  const registrar = (t) => {
    registro.current.add(t);
    if (pendente.current) return;
    pendente.current = true;
    setTimeout(() => {
      pendente.current = false;
      const usados = [...registro.current];
      setFixos((f) => (f.join("\u0001") === usados.join("\u0001") ? f : usados));
    }, 0);
  };

  if (!doc) return <div className="p-10 text-sm text-zinc-500">Documento não encontrado.</div>;
  if (sessao === undefined) return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>;
  if (!sessao) return <Navigate to="/admin/login" replace />;
  if (!g) return <div className="p-10 text-sm text-zinc-400">{erro || "Carregando..."}</div>;

  const pagina = (x, props = {}, registrar) => <PaginaComAjustes x={x} g={g} nomeLead={item?.nome} doc={doc} registrar={registrar} {...props} />;
  const ir = (i) => setAtual(Math.max(0, Math.min(lista.length - 1, i)));

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="gm-tela">
        <header className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-6 py-3 flex items-center gap-4">
          <Link to="/admin/entregaveis" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black"><ArrowLeft size={16} /> Entregáveis</Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{doc.nome} · {g.marca || item.nome}</p>
            <p className="text-xs text-zinc-500">{lista.length} {lista.length === 1 ? "página" : "páginas"} · preencha página a página · salva ao sair de cada campo</p>
          </div>
          {erro && <span className="text-xs text-red-600">{erro}</span>}
          {versoesDe(doc).length > 1 && (
            <div className="flex rounded-full bg-zinc-100 p-0.5 text-xs font-semibold" title="Versão do layout">
              {versoesDe(doc).map((v) => (
                <button key={v} onClick={() => { const n = { ...g, versao: v }; setG(n); salvar(n); }} className={`px-3 py-1.5 rounded-full ${versao === v ? "bg-white shadow-sm text-black" : "text-zinc-500 hover:text-black"}`}>{v.toUpperCase()}</button>
              ))}
            </div>
          )}
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

        <div className="grid grid-cols-[132px_minmax(0,1fr)_400px] gap-6 p-6 items-start">
          {/* páginas */}
          <nav className="sticky top-[73px] max-h-[calc(100vh-97px)] overflow-y-auto flex flex-col gap-3 pr-1">
            {lista.map((x, i) => (
              <button key={i} onClick={() => setAtual(i)} className="text-left">
                <div className={`rounded-md overflow-hidden ring-2 ${i === foco ? "ring-black" : "ring-transparent hover:ring-zinc-300"}`}><Palco>{pagina(x)}</Palco></div>
                <p className={`text-[11px] mt-1 truncate ${i === foco ? "font-semibold text-black" : "text-zinc-500"}`}>{i + 1} · {x.nome}</p>
              </button>
            ))}
          </nav>

          {/* página em foco */}
          <div className="flex flex-col items-center gap-3 sticky top-[73px]">
            <div className="w-full max-w-[640px] rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5">
              {lista[foco] && <Palco key={`${versao}-${foco}`}>{pagina(lista[foco], {}, registrar)}</Palco>}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button onClick={() => ir(foco - 1)} disabled={foco === 0} className="p-1.5 rounded-full hover:bg-white disabled:opacity-30"><ChevronLeft size={18} /></button>
              <span className="text-zinc-500">{foco + 1} de {lista.length} · <b className="text-black font-semibold">{nomePag}</b></span>
              <button onClick={() => ir(foco + 1)} disabled={foco === lista.length - 1} className="p-1.5 rounded-full hover:bg-white disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>

          <Painel doc={doc} g={g} setG={setG} salvar={salvar} nomePag={nomePag} unica={lista.length === 1} fixos={fixos} versao={versao} />
        </div>
      </div>
      <div ref={impressao} className="gm-impressao" aria-hidden="true">{lista.map((x, i) => <React.Fragment key={i}>{pagina(x)}</React.Fragment>)}</div>
    </div>
  );
}

/** A página com os ajustes dela (textos e visual). Recebe `escala` do Palco e repassa à página. */
function PaginaComAjustes({ x, g, nomeLead, doc, registrar, ...props }) {
  const { P, extra, nome } = x;
  const valor = { textos: g.textos?.[nome] || {}, estilo: g.estilo?.[nome] || {}, registrar };
  return <PaginaCtx.Provider value={valor}><P g={g} nome={nomeLead} doc={doc} {...extra} {...props} /></PaginaCtx.Provider>;
}

// ---------- painel da página ----------

const CAMPO = "w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm outline-none focus:border-zinc-400";
const ROTULO = "block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5";
const BLOCO = "bg-white rounded-2xl ring-1 ring-black/5 p-5 flex flex-col gap-4 text-sm";

function Painel({ doc, g, setG, salvar, nomePag, unica, fixos, versao }) {
  const gravar = () => salvar(g);
  const mudar = (k, v) => setG((x) => colocar(x, k, v));
  const mudarJa = (k, v) => { const n = colocar(g, k, v); setG(n); salvar(n); };
  const secoes = secoesDaPagina(doc, nomePag, unica);
  const textos = g.textos?.[nomePag] || {};
  const estilo = g.estilo?.[nomePag] || {};
  const mudarTexto = (orig, v) => setG((x) => ({ ...x, textos: { ...(x.textos || {}), [nomePag]: { ...(x.textos?.[nomePag] || {}), [orig]: v } } }));
  const mudarEstilo = (k, v, ja) => {
    const n = { ...g, estilo: { ...(g.estilo || {}), [nomePag]: { ...estilo, [k]: v } } };
    setG(n);
    if (ja) salvar(n);
  };
  const visual = versao === "v2" || versao === "v4";

  return (
    <aside className="sticky top-[73px] max-h-[calc(100vh-97px)] overflow-y-auto flex flex-col gap-4">
      <section className={BLOCO}>
        <div><p className="text-[15px] font-bold">{nomePag}</p><p className="text-[11px] text-zinc-400">Conteúdo desta página. Enter quebra a linha.</p></div>
        {secoes.length === 0 && <p className="text-xs text-zinc-400">Esta página não tem campos próprios: ela se monta com o resto do documento. Os textos dela estão logo abaixo.</p>}
        {secoes.map((s) => (
          <div key={s.titulo} className="flex flex-col gap-2.5">
            {secoes.length > 1 && <p className="text-[12px] font-semibold text-zinc-700">{s.titulo}</p>}
            {s.ajuda && <p className="text-[11px] text-zinc-400 -mt-1.5">{s.ajuda}</p>}
            {s.campos.map((c) => (
              <div key={c.k}>
                {c.rotulo && c.tipo !== "sim" && <label className={ROTULO}>{c.rotulo}</label>}
                <Campo c={c} valor={pegar(g, c.k)} mudar={(v) => mudar(c.k, v)} mudarJa={(v) => mudarJa(c.k, v)} gravar={gravar} />
              </div>
            ))}
          </div>
        ))}
      </section>

      {fixos.length > 0 && (
        <section className={BLOCO}>
          <div><p className="text-[13px] font-bold">Textos da página</p><p className="text-[11px] text-zinc-400">Títulos, aberturas e rótulos. Em branco, fica o texto padrão.</p></div>
          {fixos.map((orig) => (
            <div key={orig} className="flex gap-1.5 items-start">
              <textarea rows={Math.min(4, Math.max(1, Math.ceil(orig.length / 42)))} className={CAMPO} value={textos[orig] || ""} placeholder={orig} onChange={(e) => mudarTexto(orig, e.target.value)} onBlur={gravar} />
              {textos[orig] ? <button onClick={() => { const n = { ...g, textos: { ...(g.textos || {}), [nomePag]: { ...textos, [orig]: "" } } }; setG(n); salvar(n); }} className="p-2 text-zinc-400 hover:text-black" title="Voltar ao padrão"><RotateCcw size={13} /></button> : <span className="w-[29px]" />}
            </div>
          ))}
        </section>
      )}

      {visual && (
        <section className={BLOCO}>
          <div><p className="text-[13px] font-bold">Visual da página</p><p className="text-[11px] text-zinc-400">Só nesta página.</p></div>
          <div>
            <label className={ROTULO}>Fundo</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[["", "Padrão"], ["claro", "Claro"], ["escuro", "Escuro"], ["acento", "Cor"]].map(([v, r]) => (
                <button key={r} onClick={() => mudarEstilo("fundo", v, true)} className={`py-1.5 rounded-lg text-xs font-semibold border ${(estilo.fundo || "") === v ? "border-black bg-black text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={ROTULO}>Cor de destaque</label>
            <div className="flex items-center gap-2">
              <input type="color" value={estilo.acento || "#ef4b3a"} onChange={(e) => mudarEstilo("acento", e.target.value.toUpperCase())} onBlur={gravar} className="w-10 h-9 rounded-lg border border-zinc-200 bg-white p-0.5 cursor-pointer" />
              <span className="text-xs text-zinc-500 flex-1">{estilo.acento || "Padrão do material"}</span>
              {estilo.acento && <button onClick={() => mudarEstilo("acento", "", true)} className="text-xs text-zinc-500 hover:text-black">Padrão</button>}
            </div>
          </div>
          <div>
            <div className="flex justify-between"><label className={ROTULO}>Tamanho do título</label><span className="text-xs text-zinc-500">{estilo.titulo ? `${estilo.titulo}px` : "Padrão"}</span></div>
            <input type="range" min={30} max={130} step={2} value={estilo.titulo || 76} className="w-full accent-[#ef4b3a]" onChange={(e) => mudarEstilo("titulo", Number(e.target.value))} onMouseUp={gravar} onTouchEnd={gravar} onKeyUp={gravar} />
            {estilo.titulo ? <button onClick={() => mudarEstilo("titulo", 0, true)} className="text-xs text-zinc-500 hover:text-black">Voltar ao padrão</button> : null}
          </div>
          <div>
            <div className="flex justify-between"><label className={ROTULO}>Tamanho dos textos</label><span className="text-xs text-zinc-500">{estilo.texto || 100}%</span></div>
            <input type="range" min={70} max={140} step={5} value={estilo.texto || 100} className="w-full accent-[#ef4b3a]" onChange={(e) => mudarEstilo("texto", Number(e.target.value))} onMouseUp={gravar} onTouchEnd={gravar} onKeyUp={gravar} />
          </div>
        </section>
      )}
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
    case "regua":
      return (
        <div>
          <div className="flex justify-between text-xs text-zinc-500"><span>{c.pontas[0]}</span><span>{c.pontas[1]}</span></div>
          <input type="range" min={1} max={5} value={valor || 3} className="w-full accent-[#ef4b3a]" onChange={(e) => mudar(Number(e.target.value))} onMouseUp={gravar} onTouchEnd={gravar} onKeyUp={gravar} />
        </div>
      );
    case "sim":
      return <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!valor} onChange={(e) => mudarJa(e.target.checked)} /> {c.rotulo}</label>;
    default:
      return <textarea rows={1} className={`${CAMPO} resize-y`} value={valor || ""} onChange={(e) => mudar(e.target.value)} onBlur={gravar} placeholder={c.ph} />;
  }
}

function Lista({ c, valor, mudar, mudarJa, gravar }) {
  return (
    <div className="flex flex-col gap-1.5">
      {valor.map((v, i) => (
        <div key={i} className="flex gap-1.5">
          <textarea rows={1} className={`${CAMPO} resize-y`} value={v} onChange={(e) => mudar(valor.map((y, j) => (j === i ? e.target.value : y)))} onBlur={gravar} placeholder={c.ph} />
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
