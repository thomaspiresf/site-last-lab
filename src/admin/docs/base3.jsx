import React from "react";
import "./v3.css";

// V3 dos entregáveis: editorial contemporâneo, só em Poppins. O contraste vem do peso (títulos
// enormes em ExtraLight com a palavra de destaque em SemiBold), do tamanho e das margens generosas
// de 80; nada sangra a não ser a capa; cartões arredondados com sombra macia e mockups realistas
// (Instagram, WhatsApp, e-mail). As páginas recebem n, total e indice de quem as monta.

export const LOGO_LASTLAB = "/images/logo.png";
export const nn = (n) => String(n).padStart(2, "0");
export const ou3 = (v, reserva) => (v ? v : <span className="v3-vazio">{reserva}</span>);

/** "Manual de *identidade*" → texto com o trecho entre asteriscos em destaque (SemiBold). */
export function realce(texto) {
  const t = String(texto || "");
  // título inteiro em destaque (uma palavra só) fica leve: o contraste vem do tamanho
  if (/^\*[^*]+\*$/.test(t)) return t.slice(1, -1);
  return String(texto || "").split("*").map((t, i) => (i % 2 ? <em key={i}>{t}</em> : <React.Fragment key={i}>{t}</React.Fragment>));
}

/** A página V3. fundo: "papel" | "branco" | "escuro" | "acento". */
export function Pag3({ g, nome, doc, escala, n, fundo = "papel", classe = "", children, semCabeca, estilo }) {
  const acento = doc.acento ? doc.acento(g) : "#ef4b3a";
  return (
    <section className={`v3-pag v3-${fundo} ${classe}`} style={{ "--ac": acento, ...(escala ? { zoom: escala } : {}), ...estilo }}>
      {!semCabeca && (
        <header className="v3-cabeca"><span>{doc.nome}</span><span>{g.marca || nome}</span><span>{nn(n || 1)}</span></header>
      )}
      {children}
    </section>
  );
}

/** Título: chapéu com o número da página, título grande em ExtraLight (com *destaque* em SemiBold) e um texto curto. */
export function Cab({ p, t, lead, tamanho = 92, estilo }) {
  return (
    <div className="v3-cab" style={estilo}>
      <p className="v3-rot">{nn(p.n || 1)} — {p.indice?.[(p.n || 1) - 1]}</p>
      <h2 className="v3-display" style={{ fontSize: Math.round(tamanho * 0.8) }}>{realce(t)}</h2>
      {lead && <p className="v3-lead">{lead}</p>}
    </div>
  );
}

export const Rot = ({ children, estilo }) => <p className="v3-rot" style={estilo}>{children}</p>;

/** Imagem com cantos arredondados, ou um bloco neutro com o nome do que vai ali. */
export function Foto({ src, vazio = "Imagem", contain, raio = 18, estilo }) {
  const base = { width: "100%", height: "100%", borderRadius: raio, overflow: "hidden", ...estilo };
  if (!src) return <div className="v3-foto-vazia" style={base}><span>{vazio}</span></div>;
  return <div style={base}><img crossOrigin="anonymous" src={src} alt="" style={{ width: "100%", height: "100%", objectFit: contain ? "contain" : "cover", display: "block" }} /></div>;
}

export const handle = (marca) => (marca || "suamarca").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "").toLowerCase() || "suamarca";

// ---------- capa e índice ----------

/** Capa V3: escura, título enorme com a palavra de destaque na cor, cliente e data discretos. */
export function Capa3(p) {
  const hoje = new Date();
  const mes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][hoje.getMonth()];
  return (
    <Pag3 {...p} fundo="escuro" semCabeca classe="v3-capa">
      <div className="topo">
        <img src={LOGO_LASTLAB} alt="Last Lab" />
        <p>{mes} {hoje.getFullYear()}</p>
      </div>
      <div className="meio">
        <p className="v3-rot" style={{ color: "var(--ac)" }}>Preparado para</p>
        <p className="cliente">{p.g.marca || p.nome || "Sua Empresa"}</p>
      </div>
      <h1 className="v3-display">{realce(p.titulo || p.doc.nome)}</h1>
      <span className="ponto" />
    </Pag3>
  );
}

/** Índice: "Índice" grande à esquerda, a lista à direita. */
export function Indice3(p) {
  const itens = (p.indice || []).map((nome, i) => [nome, i + 1]).filter(([, i]) => i > 2);
  return (
    <Pag3 {...p}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 40, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h2 className="v3-display" style={{ fontSize: 84, lineHeight: 0.9 }}>Índice</h2>
          <p className="v3-p" style={{ color: "var(--cinza)", maxWidth: 230 }}>{p.doc.descricao}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {itens.map(([nome, i]) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "54px 1fr", alignItems: "baseline", padding: "11px 0", borderBottom: "1px solid var(--linha)" }}>
              <span className="v3-display" style={{ fontSize: 15, color: "var(--ac)" }}>{nn(i)}</span>
              <span style={{ fontSize: 19, fontWeight: 300, letterSpacing: -0.3 }}>{nome}</span>
            </div>
          ))}
        </div>
      </div>
    </Pag3>
  );
}

// ---------- mockups ----------

/** Moldura de iPhone. */
export function Celular({ children, largura = 300, altura = 620, estilo }) {
  return (
    <div className="v3-cel" style={{ width: largura, height: altura, ...estilo }}>
      <div className="tela">
        <div className="status"><span>9:41</span><i className="ilha" /><span>● ● ▮</span></div>
        {children}
      </div>
    </div>
  );
}

const Ico = {
  coracao: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>,
  balao: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 12a8 8 0 1 1-3.2-6.4L20 4l-1 4.2A8 8 0 0 1 20 12z" /></svg>,
  aviao: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 3 3 10l7 3 3 7 8-17z" /></svg>,
  salvar: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h12v18l-6-4-6 4z" /></svg>,
};

/** Post do Instagram (cabeçalho, imagem, ações, legenda). `imagem` pode ser um nó React. */
export function PostInsta({ marca, imagem, legenda, alturaImg = 300, curtidas = "128" }) {
  const h = handle(marca);
  return (
    <div className="v3-insta">
      <div className="cab"><span className="avatar" /><b>{h}</b><span className="mais">···</span></div>
      <div style={{ height: alturaImg, background: "#efeee9", overflow: "hidden" }}>{imagem}</div>
      <div className="acoes"><span>{Ico.coracao}{Ico.balao}{Ico.aviao}</span>{Ico.salvar}</div>
      <p className="curt">{curtidas} curtidas</p>
      <div className="leg"><b>{h}</b> {legenda}</div>
    </div>
  );
}

/** Conversa de WhatsApp. itens: { tipo: "dia" | "entra" | "sai", texto, hora }. */
export function Whats({ nome, itens, altura }) {
  return (
    <div className="v3-whats" style={altura ? { height: altura } : undefined}>
      <div className="cab"><span className="seta">‹</span><span className="avatar" /><div><b>{nome}</b><small>online</small></div></div>
      <div className="corpo">
        {itens.map((m, i) => m.tipo === "dia"
          ? <p key={i} className="dia">{m.texto}</p>
          : <div key={i} className={`bal ${m.tipo}`}><span className="t">{m.texto}</span><small>{m.hora || "10:24"}{m.tipo === "sai" && <em> ✓✓</em>}</small></div>)}
      </div>
    </div>
  );
}

/** Janela de e-mail. */
export function Email({ de, assunto, corpo }) {
  return (
    <div className="v3-email">
      <div className="barra"><i /><i /><i /></div>
      <div className="campos"><p><span>De</span>{de}</p><p><span>Assunto</span><b>{assunto}</b></p></div>
      <div className="corpo">{corpo}</div>
    </div>
  );
}

/** Direct do Instagram: pergunta (entra) e resposta (sai). */
export function Direct({ marca, pares }) {
  return (
    <div className="v3-direct">
      <div className="cab"><span className="avatar" /><b>{handle(marca)}</b></div>
      <div className="corpo">
        {pares.map(([q, r], i) => (
          <React.Fragment key={i}>
            <div className="bal entra">{q}</div>
            <div className="bal sai">{r}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/** Perfil do Instagram (cabeçalho e grade 3×3 com as imagens). */
export function PerfilInsta({ marca, imagens = [], bio }) {
  const grade = Array.from({ length: 9 }, (_, i) => imagens[i % Math.max(1, imagens.length)]);
  return (
    <>
      <div style={{ padding: "6px 14px 10px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 58, height: 58, borderRadius: 99, background: "var(--ac)", boxShadow: "0 0 0 2px #fff, 0 0 0 4px #d6249f", flexShrink: 0 }} />
        <div style={{ display: "flex", gap: 14, fontSize: 10, textAlign: "center" }}>{[["128", "posts"], ["2.430", "seguidores"], ["310", "seguindo"]].map(([a, b]) => <p key={b}><b style={{ display: "block", fontSize: 12 }}>{a}</b>{b}</p>)}</div>
      </div>
      <p style={{ padding: "0 14px", fontSize: 11, fontWeight: 600 }}>{handle(marca)}</p>
      <p style={{ padding: "2px 14px 10px", fontSize: 10, lineHeight: 1.4, color: "#444", whiteSpace: "pre-line" }}>{bio || marca}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
        {grade.map((src, i) => <div key={i} style={{ aspectRatio: "4 / 5" }}><Foto src={src} raio={0} vazio="" estilo={{ background: i % 2 ? "#eceae4" : "#e3e1da" }} /></div>)}
      </div>
    </>
  );
}
