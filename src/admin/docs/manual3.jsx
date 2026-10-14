import React from "react";
import { Logo, hexRgb, rgbCmyk, tintaSobre, useFontes } from "./base";
import { acentoDe } from "./base2";
import { Cab, Capa3, Foto, Indice3, Pag3, PostInsta, Rot, nn, ou3, realce } from "./base3";

// Manual de identidade e Brand board, V3. Mesmos dados das outras versões; destaque na cor do cliente.

const ERROS = [
  ["Distorcer", { transform: "scaleX(1.5)" }],
  ["Girar", { transform: "rotate(-14deg)" }],
  ["Trocar as cores", { filter: "invert(45%) sepia(90%) saturate(600%) hue-rotate(170deg)" }],
  ["Aplicar efeitos", { filter: "drop-shadow(5px 5px 0 #9a9aa3)" }],
  ["Sem contraste", { opacity: 0.2 }],
  ["Fundo poluído", {}, "repeating-linear-gradient(45deg, #ef4b3a 0 12px, #ffd8d2 12px 24px, #6b8cff 24px 36px)"],
];

function Conceito(p) {
  const palavras = p.g.palavras.filter(Boolean);
  const lista = palavras.length ? palavras.slice(0, 3) : ["", "", ""];
  return (
    <Pag3 {...p} fundo="escuro">
      <Rot>{nn(p.n)} — Conceito</Rot>
      <p className="v3-display" style={{ fontSize: 35, lineHeight: 1.06, maxWidth: 600, whiteSpace: "pre-line" }}>{ou3(p.g.conceito, "O que a identidade quer transmitir, e por quê.")}</p>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
        {lista.map((w, i) => (
          <p key={i} className="v3-display" style={{ fontSize: 78, lineHeight: 0.98, color: i === 0 ? "var(--ac)" : undefined }}>{ou3(w, `palavra ${i + 1}`)}</p>
        ))}
      </div>
    </Pag3>
  );
}

function LogoPag(p) {
  return (
    <Pag3 {...p}>
      <Cab p={p} t="O *logo*" lead="A assinatura principal e as versões para cada espaço." />
      <div className="v3-card" style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 70 }}>
        <Logo g={p.g} nome={p.nome} altura={150} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, p.g.versoes.length)}, 1fr)`, gap: 16 }}>
        {p.g.versoes.map((v, i) => (
          <div key={i}>
            <div className="v3-card" style={{ height: 150, padding: 22 }}><Foto src={v.img} contain raio={0} vazio={v.nome || "Versão"} /></div>
            <p style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "baseline" }}><span className="v3-display" style={{ fontSize: 13, color: "var(--ac)" }}>{nn(i + 1)}</span><span style={{ fontSize: 12.5 }}>{ou3(v.nome, "Versão")}</span></p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

function UsoLogo(p) {
  const ac = acentoDe(p.g.cores[1]?.hex);
  return (
    <Pag3 {...p}>
      <Cab p={p} t="Uso do *logo*" lead="Espaço em volta, tamanho mínimo e os fundos certos." tamanho={84} />
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28, alignItems: "center" }}>
        <div className="v3-card" style={{ height: 230, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "linear-gradient(#f0efea 1px, transparent 1px), linear-gradient(90deg, #f0efea 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
          <div className="dc-protecao" style={{ background: "#fff" }}><Logo g={p.g} nome={p.nome} altura={58} />{["tl", "tr", "bl", "br"].map((c) => <i key={c} className={c}>x</i>)}</div>
        </div>
        <div><Rot>Área de proteção</Rot><p className="v3-p" style={{ marginTop: 10 }}>{ou3(p.g.protecao, "[Regra da área de proteção]")}</p></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {[[p.g.minImpresso, "Impresso", 40], [p.g.minDigital, "Digital", 26]].map(([v, r, a]) => (
          <div key={r} style={{ borderTop: "1px solid var(--linha)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div><Rot>Mínimo · {r}</Rot><p className="v3-display" style={{ fontSize: 41, marginTop: 10 }}>{ou3(v, "—")}</p></div>
            <Logo g={p.g} nome={p.nome} altura={a} />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: "auto" }}>
        {[["#ffffff", false], ["#121212", true], [ac, tintaSobre(ac) === "#ffffff"]].map(([bg, neg], i) => (
          <div key={i} style={{ background: bg, borderRadius: 20, height: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 22, boxShadow: i === 0 ? "var(--sombra)" : undefined }}><Logo g={p.g} nome={p.nome} negativo={neg} altura={44} /></div>
        ))}
      </div>
    </Pag3>
  );
}

function NaoFazer(p) {
  return (
    <Pag3 {...p}>
      <Cab p={p} t="O que *não* fazer" lead="Na dúvida, use sempre a versão original." tamanho={84} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {ERROS.map(([nomeErro, estilo, fundo], i) => (
          <div key={nomeErro}>
            <div className="v3-card" style={{ height: 160, background: fundo || "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
              <div style={estilo}><Logo g={p.g} nome={p.nome} altura={46} /></div>
              <span style={{ position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: 99, background: "#121212", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</span>
            </div>
            <p style={{ marginTop: 10, fontSize: 12.5 }}><span className="v3-display" style={{ fontSize: 12, color: "var(--ac)", marginRight: 8 }}>{nn(i + 1)}</span>{nomeErro}</p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

function Cores(p) {
  const [prim, ...resto] = p.g.cores;
  const Codigos = ({ c }) => {
    const rgb = hexRgb(c.hex);
    return (
      <div style={{ fontSize: 10, lineHeight: 1.7, letterSpacing: 0.6, opacity: 0.8 }}>
        <p>HEX {(c.hex || "").toUpperCase()}</p><p>RGB {rgb ? rgb.join(" ") : "—"}</p><p>CMYK {rgb ? rgbCmyk(rgb).join(" ") : "—"}</p>
      </div>
    );
  };
  return (
    <Pag3 {...p}>
      <Cab p={p} t="*Cores*" lead="A paleta, com os códigos para tela e impressão." />
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 14, flex: 1 }}>
        {prim && (
          <div style={{ background: hexRgb(prim.hex) ? prim.hex : "#ddd", color: tintaSobre(prim.hex), borderRadius: 26, padding: 26, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "var(--sombra)" }}>
            <p className="v3-display" style={{ fontSize: 45 }}>{realce(`*${prim.nome || "Principal"}*`)}</p>
            <div><p style={{ fontSize: 12.5, fontWeight: 300, marginBottom: 14, maxWidth: 220 }}>{prim.uso}</p><Codigos c={prim} /></div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateRows: `repeat(${Math.max(1, resto.length)}, 1fr)`, gap: 14 }}>
          {resto.map((c, i) => (
            <div key={i} style={{ background: hexRgb(c.hex) ? c.hex : "#ddd", color: tintaSobre(c.hex), borderRadius: 22, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", boxShadow: "var(--sombra), inset 0 0 0 1px rgba(0,0,0,0.05)" }}>
              <div><p className="v3-display" style={{ fontSize: 22 }}>{c.nome || `Cor ${i + 2}`}</p><p style={{ fontSize: 11, fontWeight: 300, marginTop: 4, opacity: 0.85 }}>{c.uso}</p></div>
              <Codigos c={c} />
            </div>
          ))}
        </div>
      </div>
    </Pag3>
  );
}

function Tipografia(p) {
  useFontes([p.g.fonteTitulo, p.g.fonteTexto]);
  const ft = `"${p.g.fonteTitulo}", Poppins, sans-serif`;
  const fx = `"${p.g.fonteTexto}", Poppins, sans-serif`;
  return (
    <Pag3 {...p}>
      <Rot>{nn(p.n)} — Tipografia</Rot>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "end" }}>
        <p style={{ fontFamily: ft, fontSize: 280, fontWeight: 600, lineHeight: 0.74, letterSpacing: -14 }}>Aa</p>
        <div style={{ paddingBottom: 6 }}>
          <Rot>Títulos</Rot>
          <p style={{ fontFamily: ft, fontSize: 30, fontWeight: 600, marginTop: 8, letterSpacing: -0.8 }}>{ou3(p.g.fonteTitulo, "[Fonte]")}</p>
          <p className="v3-p" style={{ color: "var(--cinza)", marginTop: 6, fontSize: 12.5 }}>{p.g.usoTitulo}</p>
        </div>
      </div>
      <div className="v3-card" style={{ padding: "26px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <div>
          <Rot>Textos</Rot>
          <p style={{ fontFamily: fx, fontSize: 30, marginTop: 8 }}>{ou3(p.g.fonteTexto, "[Fonte]")}</p>
          <p className="v3-p" style={{ color: "var(--cinza)", marginTop: 6, fontSize: 12.5 }}>{p.g.usoTexto}</p>
        </div>
        <p style={{ fontFamily: fx, fontSize: 13.5, lineHeight: 1.7 }}>ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 !?&@%</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
        {[["48", ft, 44, 600, "A marca em uma frase"], ["22", ft, 22, 400, "Um subtítulo que explica em uma linha"], ["14", fx, 14, 400, "Texto corrido para documentos, site e legendas, com linhas curtas e respiro."]].map(([pt, f, s, w, t]) => (
          <div key={pt} style={{ display: "grid", gridTemplateColumns: "64px 1fr", alignItems: "baseline", borderTop: "1px solid var(--linha)", padding: "16px 0" }}>
            <span className="v3-display" style={{ fontSize: 14, color: "var(--ac)" }}>{pt}</span>
            <p style={{ fontFamily: f, fontSize: s, fontWeight: w, lineHeight: 1.15, letterSpacing: s > 30 ? -1.2 : 0 }}>{t}</p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

function Grafismos(p) {
  const [a, b, c, d] = p.g.grafismos;
  return (
    <Pag3 {...p}>
      <Cab p={p} t="*Grafismos*" lead="Os elementos que dão ritmo e reconhecimento à marca." />
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gridTemplateRows: "1fr 1fr", gap: 14, flex: 1 }}>
        <div style={{ gridRow: "span 2" }}><Foto src={a} vazio="Grafismo 01" raio={24} /></div>
        <Foto src={b} vazio="Grafismo 02" raio={24} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Foto src={c} vazio="03" raio={20} /><Foto src={d} vazio="04" raio={20} /></div>
      </div>
      <p className="v3-p" style={{ maxWidth: 460 }}>{ou3(p.g.grafismosTxt, "[Como e onde usar os grafismos]")}</p>
    </Pag3>
  );
}

function Fotografia(p) {
  const [a, b, c, d] = p.g.fotos;
  const lista = (itens, nao, reserva) => {
    const l = itens.filter(Boolean);
    return (l.length ? l : [null]).map((x, i) => <p key={i} style={{ fontSize: 13, fontWeight: 300, padding: "9px 0", borderBottom: "1px solid var(--linha)", display: "flex", gap: 10 }}><span style={{ color: nao ? "var(--cinza)" : "var(--ac)" }}>{nao ? "×" : "✓"}</span>{x || <span className="v3-vazio">{reserva}</span>}</p>);
  };
  return (
    <Pag3 {...p}>
      <Cab p={p} t="*Fotografia*" lead="O olhar da marca nas imagens." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "200px 200px", gap: 12 }}>
        <div style={{ gridRow: "span 2" }}><Foto src={a} vazio="01" raio={22} /></div>
        <div style={{ gridColumn: "span 2" }}><Foto src={b} vazio="02" raio={22} /></div>
        <Foto src={c} vazio="03" raio={22} /><Foto src={d} vazio="04" raio={22} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <div><p className="v3-display" style={{ fontSize: 24, marginBottom: 8 }}><em>Usamos</em></p>{lista(p.g.fotoFaz, false, "Ex.: luz natural")}</div>
        <div><p className="v3-display" style={{ fontSize: 24, marginBottom: 8 }}><em>Evitamos</em></p>{lista(p.g.fotoEvita, true, "Ex.: banco de imagem")}</div>
      </div>
    </Pag3>
  );
}

function Aplicacoes(p) {
  const [prim, seg, ...resto] = p.g.aplicacoes;
  return (
    <Pag3 {...p}>
      <Cab p={p} t="*Aplicações*" lead="A marca no dia a dia." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 250px", gap: 18, alignItems: "start" }}>
        <div>
          <div style={{ height: 330 }}><Foto src={prim?.img} vazio={prim?.nome || "Aplicação"} raio={24} /></div>
          <p style={{ fontSize: 12.5, marginTop: 10 }}><span className="v3-display" style={{ fontSize: 12, color: "var(--ac)", marginRight: 8 }}>01</span>{prim?.nome}</p>
        </div>
        <PostInsta marca={p.g.marca || p.nome} alturaImg={250} imagem={<Foto src={seg?.img} vazio={seg?.nome || "Post"} raio={0} />} legenda={seg?.nome || "A marca aplicada nas redes."} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, resto.length))}, 1fr)`, gap: 14 }}>
        {resto.slice(0, 4).map((a, i) => (
          <div key={i}>
            <div style={{ height: 150 }}><Foto src={a.img} vazio={a.nome || "Aplicação"} raio={18} /></div>
            <p style={{ fontSize: 12, marginTop: 8 }}><span className="v3-display" style={{ fontSize: 12, color: "var(--ac)", marginRight: 6 }}>{nn(i + 3)}</span>{a.nome}</p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

function Arquivos(p) {
  return (
    <Pag3 {...p} fundo="escuro">
      <Cab p={p} t="Os *arquivos*" lead="Tudo o que você precisa para usar a marca, num lugar só." />
      <div className="v3-lista">
        {p.g.arquivos.filter(Boolean).map((x, i) => <div key={i}><span className="n">{nn(i + 1)}</span><p style={{ fontSize: 17, fontWeight: 300 }}>{x}</p></div>)}
      </div>
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "end" }}>
        <div><Rot>Onde estão</Rot><p style={{ fontSize: 15, fontWeight: 300, marginTop: 8, wordBreak: "break-all" }}>{ou3(p.g.ondeArquivos, "[Link da pasta]")}</p></div>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cinza)", lineHeight: 1.6, textAlign: "right" }}>Na dúvida sobre algum uso,<br />fale com a gente antes de aplicar.<br />contato@lastlab.com.br</p>
      </div>
    </Pag3>
  );
}

// ---------- brand board ----------

function Board(p) {
  useFontes([p.g.fonteTitulo, p.g.fonteTexto]);
  const cores = p.g.cores.slice(0, 6);
  const apl = p.g.aplicacoes.slice(0, 3);
  return (
    <Pag3 {...p} estilo={{ gap: 14, paddingTop: 96 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <h2 className="v3-display" style={{ fontSize: 53 }}>Brand <em>board</em></h2>
        <p className="v3-rot">{p.g.marca || p.nome}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, height: 280 }}>
        <div className="v3-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}><Logo g={p.g} nome={p.nome} altura={110} /></div>
        <div style={{ background: "#121212", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><Logo g={p.g} nome={p.nome} negativo altura={56} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, height: 150 }}>
        {cores.map((c, i) => (
          <div key={i} style={{ flex: i === 0 ? 1.8 : 1, background: hexRgb(c.hex) ? c.hex : "#ddd", color: tintaSobre(c.hex), borderRadius: 20, padding: "14px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "var(--sombra)" }}>
            <p className="v3-display" style={{ fontSize: i === 0 ? 30 : 20 }}>{c.nome}</p>
            <p style={{ fontSize: 9.5, letterSpacing: 0.8, opacity: 0.85 }}>{(c.hex || "").toUpperCase()}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[[p.g.fonteTitulo, "Títulos", 600], [p.g.fonteTexto, "Textos", 400]].map(([n, r, w]) => (
          <div key={r} className="v3-card" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 18 }}>
            <p style={{ fontFamily: `"${n}", Poppins`, fontSize: 64, fontWeight: w, lineHeight: 1, letterSpacing: -3 }}>Aa</p>
            <div><Rot>{r}</Rot><p style={{ fontFamily: `"${n}", Poppins`, fontSize: 18, fontWeight: w, marginTop: 4 }}>{ou3(n, "[Fonte]")}</p></div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, apl.length)}, 1fr)`, gap: 14, flex: 1 }}>
        {apl.map((a, i) => <Foto key={i} src={a.img} vazio={a.nome || "Aplicação"} raio={22} />)}
      </div>
    </Pag3>
  );
}

const Capa = (p) => <Capa3 {...p} titulo="Manual de *identidade*" />;

export const MANUAL_V3 = () => [[Capa, "Capa"], [Indice3, "Índice"], [Conceito, "Conceito"], [LogoPag, "Logo"], [UsoLogo, "Uso do logo"], [NaoFazer, "O que não fazer"], [Cores, "Cores"], [Tipografia, "Tipografia"], [Grafismos, "Grafismos"], [Fotografia, "Fotografia"], [Aplicacoes, "Aplicações"], [Arquivos, "Arquivos"]];
export const BOARD_V3 = () => [[Board, "Brand board"]];
