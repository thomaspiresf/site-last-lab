import React from "react";
import { hexRgb } from "./base";
import "./v2.css";
import { CapaGrafismo, grafismoDe } from "./capa4";
import { useEstilo, useTexto } from "./ctx";

// V2 dos entregáveis: direção de arte editorial (grade suíça). Cabeçalho corrido com o número e o
// nome da seção, numeração de página, filetes no lugar de cartões, coluna de rótulos à esquerda,
// títulos grandes em peso leve, blocos de cor e imagem sempre dentro das margens, e os mockups de
// Instagram e WhatsApp da V3 (base3). As páginas recebem
// n (número), total e indice (nomes das páginas) de quem as monta.

export const LOGO_LASTLAB = "/images/logo.png";
export const nn = (n) => String(n).padStart(2, "0");
export const ou2 = (v, reserva) => (v ? v : <span className="v2-vazio">{reserva}</span>);

/** Cor de destaque válida e legível (senão o laranja da Last Lab). */
export function acentoDe(hex) {
  const rgb = hexRgb(hex);
  if (!rgb) return "#ef4b3a";
  const [r, g, b] = rgb.map((v) => v / 255);
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.82 || l < 0.03 ? "#ef4b3a" : hex;
}

/** A página V2. `fundo`: "claro" | "escuro" | "acento". `sangra`: sem margens (o conteúdo se posiciona). */
export function Pag2({ g, nome, doc, escala, n, total, indice, versao, fundo = "claro", classe = "", children, semCabeca, estilo }) {
  const ajuste = useEstilo();
  const acento = ajuste.acento || (doc.acento ? doc.acento(g) : "#ef4b3a");
  const secao = indice?.[n - 1];
  const f = ajuste.fundo || fundo;
  return (
    <section className={`v2-pag v2-${f} ${versao === "v4" ? "v4" : ""} ${classe}`} style={{ "--ac": acento, "--esc": (ajuste.texto || 100) / 100, ...(ajuste.titulo ? { "--tit": `${ajuste.titulo}px` } : {}), ...(escala ? { zoom: escala } : {}), ...estilo }}>
      {!semCabeca && (
        <header className="v2-cabeca">
          <p><b>{nn(n || 1)}</b>{secao}</p>
          <p>{g.marca || nome} · {doc.nome}</p>
        </header>
      )}
      {children}
      <footer className="v2-pe">
        <p>Last Lab</p>
        <p>{nn(n || 1)} / {nn(total || 1)}</p>
      </footer>
    </section>
  );
}

/** Título de página: número da seção, título grande e um texto de abertura. */
export function Tit({ t, lead, claro, tamanho }) {
  const titulo = useTexto(t);
  const abertura = useTexto(lead);
  return (
    <div className="v2-tit">
      <h2 style={tamanho ? { fontSize: `var(--tit, ${tamanho}px)`, letterSpacing: -tamanho * 0.035 } : undefined}>{titulo}</h2>
      {abertura && <p className={claro ? "claro" : ""}>{abertura}</p>}
    </div>
  );
}

/** Linha da grade: rótulo à esquerda, conteúdo à direita, com filete em cima. */
export function Linha({ r, children, estilo, semFilete }) {
  const rotulo = useTexto(r);
  return (
    <div className={`v2-linha ${semFilete ? "sem" : ""}`} style={estilo}>
      <p className="v2-rot">{rotulo}</p>
      <div>{children}</div>
    </div>
  );
}

export function Rot({ children, estilo }) {
  const t = useTexto(children);
  return <p className="v2-rot" style={estilo}>{t}</p>;
}

/** Imagem até a borda do bloco, ou um bloco neutro com o nome do que vai ali. */
export function Foto({ src, vazio = "Imagem", contain, estilo }) {
  if (!src) return <div className="v2-foto-vazia" style={estilo}><span>{vazio}</span></div>;
  return <img className="v2-img" crossOrigin="anonymous" src={src} alt="" style={{ width: "100%", height: "100%", objectFit: contain ? "contain" : "cover", display: "block", ...estilo }} />;
}

function CapaV4(p) {
  const titulo = useTexto(p.titulo || p.doc.nome);
  const ajuste = useEstilo();
  return <CapaGrafismo titulo={titulo} marca={p.g.marca || p.nome} imagem={grafismoDe(p.doc.id)} n={p.n} total={p.total} escala={p.escala} tamanho={ajuste.titulo} />;
}

/** Capa V2: metadados no topo, o grafismo do material (doc.capa) e o nome do cliente grande na base. */
export function Capa2(p) {
  if (p.versao === "v4") return <CapaV4 {...p} />;
  const hoje = new Date();
  const mes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][hoje.getMonth()];
  return (
    <Pag2 {...p} fundo="escuro" semCabeca classe="v2-capa">
      <div className="meta">
        <div><Rot>Documento</Rot><p>{p.titulo || p.doc.nome}</p></div>
        <div><Rot>Para</Rot><p>{p.g.marca || p.nome}</p></div>
        <div><Rot>Data</Rot><p>{mes[0].toUpperCase() + mes.slice(1)} {hoje.getFullYear()}</p></div>
      </div>
      {p.versao === "v4" ? (
        <div className="nome">
          <p className="tipo">{p.g.marca || p.nome || "Sua Empresa"}</p>
          <h1>{p.titulo || p.doc.nome}</h1>
        </div>
      ) : (
        <div className="nome">
          <p className="tipo">{p.titulo || p.doc.nome}</p>
          <h1>{p.g.marca || p.nome || "Sua Empresa"}</h1>
        </div>
      )}
      {p.doc.capa && <img className="grafismo" src={p.doc.capa} alt="" crossOrigin="anonymous" />}
      <img className="logo" src={LOGO_LASTLAB} alt="Last Lab" />
    </Pag2>
  );
}

/** Sumário automático a partir dos nomes das páginas. */
export function Sumario2(p) {
  const itens = (p.indice || []).map((nome, i) => [nome, i + 1]).filter(([, i]) => i > 2);
  return (
    <Pag2 {...p}>
      <Tit t="Sumário" lead={p.doc.descricao} />
      <div className="v2-sumario">
        {itens.map(([nome, i]) => (
          <div key={i}><span className="n">{nn(i)}</span><span className="t">{nome}</span><span className="p">{nn(i)}</span></div>
        ))}
      </div>
    </Pag2>
  );
}

/** Lista numerada grande (01, 02...) com filetes. */
export function Numerada({ itens, tamanho = 26 }) {
  return (
    <div className="v2-numerada">
      {itens.map((x, i) => (
        <div key={i}><span className="n">{nn(i + 1)}</span><p style={{ fontSize: `calc(${tamanho}px * var(--esc, 1))` }}>{x}</p></div>
      ))}
    </div>
  );
}

/** Balão de conversa (entrada = cliente, saída = marca). */
export const Balao = ({ lado = "sai", children }) => <div className={`v2-balao ${lado}`}>{children}</div>;

/** Lista com ✓ ou ×, com filetes. */
export function Marcas2({ itens, nao, reserva = "[Item]" }) {
  const lista = itens.filter(Boolean);
  return (
    <ul className={`v2-marcas ${nao ? "nao" : ""}`}>
      {(lista.length ? lista : [null]).map((x, i) => <li key={i}><span>{nao ? "×" : "✓"}</span>{x || <span className="v2-vazio" style={{ color: undefined }}>{reserva}</span>}</li>)}
    </ul>
  );
}

/** Tabela: colunas [rótulo, chave, largura?]; a primeira coluna em destaque. */
export function Tabela2({ colunas, linhas }) {
  return (
    <table className="v2-tabela">
      <thead><tr>{colunas.map(([r, , w]) => <th key={r} style={w ? { width: w } : undefined}>{r}</th>)}</tr></thead>
      <tbody>{linhas.map((l, i) => <tr key={i}>{colunas.map(([r, k], j) => <td key={r} className={j === 0 ? "forte" : ""}>{ou2(l[k], "—")}</td>)}</tr>)}</tbody>
    </table>
  );
}
