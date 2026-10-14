import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

// Peças comuns dos entregáveis em A4 (794×1123): moldura com rodapé, capa, imagens, logo do
// cliente, tabelas e linha do tempo. O visual segue o Guia de mensagem (guia.css).

export const LOGO_LASTLAB = "/images/logo.png";

/** O valor, ou um texto de exemplo em cinza quando está vazio. */
export const ou = (v, reserva) => (v ? v : <span className="gm-vazio">{reserva}</span>);

/** A página, com o rodapé de três colunas. */
export function Pag({ tipo = "", classe = "", escala, g, nome, doc, children, estilo }) {
  return (
    <section className={`gm-pag ${tipo} ${classe}`} style={{ ...(escala ? { zoom: escala } : {}), ...estilo }}>
      {children}
      <div className="gm-rodape">
        <p>{doc.nome}<br />{g.marca || nome}</p>
        <p>{doc.rodape[0]}<br />{doc.rodape[1]}</p>
        <p>Last Lab<br />Thomás Pires</p>
        <span className="barras"><i /><i /></span>
      </div>
    </section>
  );
}

export function Titulo({ t, s }) {
  return <div><h2>{t}</h2>{s && <p className="sub">{s}</p>}</div>;
}

/** Capa escura com as barras laranja (mesma arte do Guia de mensagem). */
export function Capa(p) {
  const barras = [];
  let x = 0, w = 150, s = 52;
  for (let i = 0; i < 12; i++) {
    barras.push(<polygon key={i} points={`${x},0 ${x + w},${s} ${x + w},${420 - s} ${x},420`} fill="#ef4b3a" />);
    x += w + 26;
    w = Math.max(22, Math.round(w * 0.82));
    s = Math.max(0, Math.round(s * 0.78));
  }
  return (
    <Pag {...p} tipo="escuro" classe="gm-capa">
      <img className="logo" src={LOGO_LASTLAB} alt="Last Lab" />
      <svg viewBox={`0 0 ${x} 420`} preserveAspectRatio="none" aria-hidden="true">{barras}</svg>
      <div><h1>{p.titulo || p.doc.nome}</h1><p className="marca">{p.g.marca || p.nome}</p></div>
    </Pag>
  );
}

/** Imagem enviada, ou um espaço listrado com o nome do que vai ali. */
export function Img({ src, contain, vazio = "Imagem", estilo }) {
  if (!src) return <div className="dc-img-vazia" style={estilo}>{vazio}</div>;
  return <img crossOrigin="anonymous" src={src} alt="" style={{ width: "100%", height: "100%", objectFit: contain ? "contain" : "cover", display: "block", ...estilo }} />;
}

/** O logo do cliente; sem arquivo, o nome da marca escrito. `negativo` = versão para fundo escuro. */
export function Logo({ g, nome, negativo, altura = 120, estilo }) {
  const src = negativo ? g.logoNegativo || g.logo : g.logo;
  const inverter = negativo && !g.logoNegativo;
  if (src) return <img crossOrigin="anonymous" src={src} alt="" style={{ height: altura, maxWidth: "100%", objectFit: "contain", display: "block", filter: inverter ? "brightness(0) invert(1)" : undefined, ...estilo }} />;
  return <p className="dc-logo-texto" style={{ fontSize: altura * 0.42, color: negativo ? "#fff" : "#0a0a0a", ...estilo }}>{g.marca || nome || "Sua marca"}</p>;
}

/** Tabela simples: colunas [rótulo, chave, largura?] e linhas (objetos). */
export function Tabela({ colunas, linhas, vazio = "—" }) {
  return (
    <table className="dc-tabela">
      <thead><tr>{colunas.map(([r, , w]) => <th key={r} style={w ? { width: w } : undefined}>{r}</th>)}</tr></thead>
      <tbody>
        {linhas.map((l, i) => (
          <tr key={i}>{colunas.map(([r, k], j) => <td key={r} className={j === 0 ? "forte" : ""}>{ou(l[k], vazio)}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

/** Linha do tempo vertical: itens com quando, nome e texto. */
export function Tempo({ itens }) {
  return (
    <div className="dc-tempo">
      {itens.map((e, i) => (
        <div key={i} className="dc-tempo-item">
          <span className="ponto">{i + 1}</span>
          <div>
            <p className="rot">{ou(e.quando, "[Quando]")}</p>
            <h3>{ou(e.nome, `[Etapa ${i + 1}]`)}</h3>
            {e.texto !== undefined && <p className="txt suave" style={{ whiteSpace: "pre-line" }}>{ou(e.texto, "[O que acontece]")}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista com marcadores (✓ ou ×). */
export function Marcas({ itens, nao, reserva = "[Item]" }) {
  const lista = itens.filter(Boolean).length ? itens.filter(Boolean) : [reserva];
  return (
    <ul className={`dc-marcas ${nao ? "nao" : ""}`}>
      {lista.map((x, i) => <li key={i}><span>{nao ? "×" : "✓"}</span>{x === reserva ? ou("", reserva) : x}</li>)}
    </ul>
  );
}

// ---------- cores ----------

export function hexRgb(hex) {
  const h = (hex || "").replace("#", "").trim();
  const c = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(c)) return null;
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
}

export function rgbCmyk([r, g, b]) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const k = 1 - Math.max(R, G, B);
  if (k === 1) return [0, 0, 0, 100];
  return [(1 - R - k) / (1 - k), (1 - G - k) / (1 - k), (1 - B - k) / (1 - k), k].map((x) => Math.round(x * 100));
}

/** Texto claro ou escuro sobre a cor. */
export function tintaSobre(hex) {
  const rgb = hexRgb(hex);
  if (!rgb) return "#0a0a0a";
  const [r, g, b] = rgb.map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6 ? "#0a0a0a" : "#ffffff";
}

// ---------- fontes ----------

/** Carrega fontes do Google Fonts pelo nome (para mostrar a tipografia do cliente). */
export function useFontes(nomes) {
  const chave = nomes.filter(Boolean).join("|");
  useEffect(() => {
    chave.split("|").filter(Boolean).forEach((n) => {
      const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(n.trim()).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap`;
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.crossOrigin = "anonymous";
      l.href = href;
      document.head.appendChild(l);
    });
  }, [chave]);
}

// ---------- prévia ----------

/** A página escalada para a largura disponível. */
export function Palco({ children }) {
  const ref = useRef(null);
  const [escala, setEscala] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    const medir = () => setEscala(el.clientWidth / 794);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="gm-palco">{escala > 0 && React.cloneElement(children, { escala })}</div>;
}
