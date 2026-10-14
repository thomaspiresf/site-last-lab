import React from "react";
import { Logo, hexRgb, rgbCmyk, tintaSobre, useFontes } from "./base";
import { Capa2, Foto, Linha, Marcas2, Pag2, Rot, Sumario2, Tit, acentoDe, nn, ou2 } from "./base2";

// Manual de identidade e Brand board, V2 (direção de arte editorial). Mesmos dados da V1.
// O destaque das páginas é a cor de destaque do próprio cliente.

const ERROS = [
  ["Distorcer", { transform: "scaleX(1.55)" }],
  ["Girar", { transform: "rotate(-14deg)" }],
  ["Trocar as cores", { filter: "invert(45%) sepia(90%) saturate(600%) hue-rotate(170deg)" }],
  ["Aplicar efeitos", { filter: "drop-shadow(6px 6px 0 #9a9aa3)" }],
  ["Fundo sem contraste", { opacity: 0.22 }],
  ["Fundo poluído", {}, "repeating-linear-gradient(45deg, #ef4b3a 0 14px, #ffd8d2 14px 28px, #6b8cff 28px 42px)"],
];

function Conceito(p) {
  const palavras = p.g.palavras.filter(Boolean);
  return (
    <Pag2 {...p} fundo="escuro">
      <Tit t="Conceito" lead="A ideia por trás da identidade." claro />
      <p style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.2, letterSpacing: -1.2, whiteSpace: "pre-line", marginTop: 24 }}>{ou2(p.g.conceito, "[O que a identidade quer transmitir e por quê]")}</p>
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid #2c2c2e" }}>
        {(palavras.length ? palavras.slice(0, 3) : ["", "", ""]).map((w, i) => (
          <div key={i} style={{ padding: "18px 18px 0 0", borderRight: i < 2 ? "1px solid #2c2c2e" : 0, paddingLeft: i ? 18 : 0 }}>
            <p className="v2-rot">{nn(i + 1)}</p>
            <p style={{ fontSize: 34, fontWeight: 500, letterSpacing: -1, marginTop: 40 }}>{ou2(w, `[Palavra ${i + 1}]`)}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function LogoPag(p) {
  return (
    <Pag2 {...p}>
      <Tit t="Logo" lead="A assinatura principal e as versões para cada espaço." />
      <div className="v2-sangra" style={{ background: "#fff", height: 430, display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <Logo g={p.g} nome={p.nome} altura={180} />
      </div>
      <Linha r="Versões">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, p.g.versoes.length)}, 1fr)`, gap: 0 }}>
          {p.g.versoes.map((v, i) => (
            <div key={i} style={{ borderLeft: i ? "1px solid var(--filete)" : 0, padding: i ? "0 0 0 16px" : "0 16px 0 0" }}>
              <div style={{ height: 120, padding: 8 }}><Foto src={v.img} contain vazio={v.nome || "Versão"} /></div>
              <p style={{ fontSize: 13, marginTop: 10 }}>{ou2(v.nome, `[Versão ${i + 1}]`)}</p>
            </div>
          ))}
        </div>
      </Linha>
    </Pag2>
  );
}

function UsoLogo(p) {
  const ac = acentoDe(p.g.cores[1]?.hex);
  return (
    <Pag2 {...p}>
      <Tit t="Uso do logo" lead="Espaço em volta, tamanho mínimo e os fundos certos." />
      <Linha r="Área de proteção">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 190px", gap: 24, alignItems: "center" }}>
          <div style={{ background: "#fff", height: 210, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "linear-gradient(#ececea 1px, transparent 1px), linear-gradient(90deg, #ececea 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            <div className="dc-protecao" style={{ background: "#fff" }}><Logo g={p.g} nome={p.nome} altura={64} />{["tl", "tr", "bl", "br"].map((c) => <i key={c} className={c}>x</i>)}</div>
          </div>
          <p className="v2-txt" style={{ fontSize: 13.5 }}>{ou2(p.g.protecao, "[Regra da área de proteção]")}</p>
        </div>
      </Linha>
      <Linha r="Tamanho mínimo">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "end" }}>
          <div><Logo g={p.g} nome={p.nome} altura={44} estilo={{ marginLeft: 0 }} /><p style={{ fontSize: 22, fontWeight: 300, marginTop: 12 }}>{ou2(p.g.minImpresso, "[mm]")} <span className="v2-rot" style={{ color: "var(--cinza)" }}>impresso</span></p></div>
          <div><Logo g={p.g} nome={p.nome} altura={28} /><p style={{ fontSize: 22, fontWeight: 300, marginTop: 12 }}>{ou2(p.g.minDigital, "[px]")} <span className="v2-rot" style={{ color: "var(--cinza)" }}>digital</span></p></div>
        </div>
      </Linha>
      <div className="v2-sangra" style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", height: 230 }}>
        {[["#ffffff", false, "Fundo claro"], ["#0b0b0c", true, "Fundo escuro"], [ac, tintaSobre(ac) === "#ffffff", "Cor da marca"]].map(([bg, neg, r]) => (
          <div key={r} style={{ background: bg, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
            <Logo g={p.g} nome={p.nome} negativo={neg} altura={48} />
            <p className="v2-rot" style={{ position: "absolute", left: 20, top: 18, color: neg ? "#fff" : "#0b0b0c", opacity: 0.6 }}>{r}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function NaoFazer(p) {
  return (
    <Pag2 {...p}>
      <Tit t="O que não fazer" lead="Os erros mais comuns. Se ficar em dúvida, use a versão original." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--tinta)" }}>
        {ERROS.map(([nomeErro, estilo, fundo], i) => (
          <div key={nomeErro} style={{ borderBottom: "1px solid var(--filete)", borderRight: i % 2 === 0 ? "1px solid var(--filete)" : 0, padding: i % 2 === 0 ? "18px 18px 18px 0" : "18px 0 18px 18px" }}>
            <div style={{ height: 150, background: fundo || "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
              <div style={estilo}><Logo g={p.g} nome={p.nome} altura={54} /></div>
              <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top right, transparent calc(50% - 1px), var(--ac) 50%, transparent calc(50% + 1px))" }} />
            </div>
            <p style={{ fontSize: 13, marginTop: 10 }}><b style={{ color: "var(--ac)", fontWeight: 600, marginRight: 10 }}>{nn(i + 1)}</b>{nomeErro}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function Cores(p) {
  const cores = p.g.cores;
  return (
    <Pag2 {...p}>
      <Tit t="Cores" lead="A paleta, com os códigos para tela e impressão." />
      <div className="v2-sangra" style={{ display: "flex", height: 360 }}>
        {cores.map((c, i) => (
          <div key={i} style={{ flex: i === 0 ? 2.2 : 1, background: hexRgb(c.hex) ? c.hex : "#ddd", color: tintaSobre(c.hex), padding: "20px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.6, opacity: 0.7 }}>{nn(i + 1)}</p>
            <p style={{ fontSize: i === 0 ? 30 : 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.1 }}>{c.nome}</p>
          </div>
        ))}
      </div>
      <table className="v2-tabela">
        <thead><tr><th>Cor</th><th style={{ width: 92 }}>HEX</th><th style={{ width: 104 }}>RGB</th><th style={{ width: 110 }}>CMYK</th><th>Uso</th></tr></thead>
        <tbody>
          {cores.map((c, i) => {
            const rgb = hexRgb(c.hex);
            return (
              <tr key={i}>
                <td className="forte"><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 99, background: rgb ? c.hex : "#ddd", marginRight: 10, boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />{ou2(c.nome, `[Cor ${i + 1}]`)}</td>
                <td>{(c.hex || "").toUpperCase()}</td>
                <td>{rgb ? rgb.join(" ") : "—"}</td>
                <td>{rgb ? rgbCmyk(rgb).join(" ") : "—"}</td>
                <td>{ou2(c.uso, "—")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Pag2>
  );
}

function Tipografia(p) {
  useFontes([p.g.fonteTitulo, p.g.fonteTexto]);
  const ft = `"${p.g.fonteTitulo}", Poppins, sans-serif`;
  const fx = `"${p.g.fonteTexto}", Poppins, sans-serif`;
  return (
    <Pag2 {...p}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "end" }}>
        <p style={{ fontFamily: ft, fontSize: 250, fontWeight: 600, lineHeight: 0.8, letterSpacing: -10 }}>Aa</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 6 }}>
          <Rot>Títulos</Rot>
          <p style={{ fontFamily: ft, fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>{ou2(p.g.fonteTitulo, "[Fonte]")}</p>
          <p className="v2-txt" style={{ fontSize: 13.5, color: "var(--cinza)" }}>{ou2(p.g.usoTitulo, "[Uso]")}</p>
        </div>
      </div>
      <Linha r="Textos">
        <p style={{ fontFamily: fx, fontSize: 30, fontWeight: 400, letterSpacing: -0.5 }}>{ou2(p.g.fonteTexto, "[Fonte]")}</p>
        <p className="v2-txt" style={{ fontSize: 13.5, color: "var(--cinza)", marginTop: 6 }}>{ou2(p.g.usoTexto, "[Uso]")}</p>
        <p style={{ fontFamily: fx, fontSize: 15, lineHeight: 1.6, marginTop: 14 }}>ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 !?&@%</p>
      </Linha>
      {[["Título", ft, 40, 600, "48 pt"], ["Subtítulo", ft, 22, 400, "22 pt"], ["Texto", fx, 15, 400, "15 pt"]].map(([r, f, s, w, m]) => (
        <Linha key={r} r={<>{r}<br /><span style={{ color: "var(--cinza)", fontWeight: 500 }}>{m}</span></>}>
          <p style={{ fontFamily: f, fontSize: s, fontWeight: w, lineHeight: 1.2, letterSpacing: s > 30 ? -1 : 0 }}>{r === "Texto" ? "Texto corrido para documentos, site e legendas, com linhas curtas e bastante respiro." : r === "Título" ? "A marca em uma frase" : "Um subtítulo que explica em uma linha"}</p>
        </Linha>
      ))}
    </Pag2>
  );
}

function Grafismos(p) {
  const [a, b, c, d] = p.g.grafismos;
  return (
    <Pag2 {...p}>
      <Tit t="Grafismos" lead="Os elementos que dão ritmo e reconhecimento à marca." />
      <div className="v2-sangra" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "260px 260px", gap: 2 }}>
        <div style={{ gridRow: "span 2" }}><Foto src={a} vazio="Grafismo 01" /></div>
        <Foto src={b} vazio="Grafismo 02" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}><Foto src={c} vazio="03" /><Foto src={d} vazio="04" /></div>
      </div>
      <Linha r="Como usar"><p className="v2-txt">{ou2(p.g.grafismosTxt, "[Como e onde usar os grafismos]")}</p></Linha>
    </Pag2>
  );
}

function Fotografia(p) {
  const [a, b, c, d] = p.g.fotos;
  return (
    <Pag2 {...p}>
      <Tit t="Fotografia" lead="O olhar da marca nas imagens." />
      <div className="v2-sangra" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "230px 230px", gap: 2 }}>
        <div style={{ gridRow: "span 2" }}><Foto src={a} vazio="Referência 01" /></div>
        <div style={{ gridColumn: "span 2" }}><Foto src={b} vazio="Referência 02" /></div>
        <Foto src={c} vazio="03" /><Foto src={d} vazio="04" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div><Rot estilo={{ marginBottom: 10 }}>Usamos</Rot><Marcas2 itens={p.g.fotoFaz} reserva="[Ex.: luz natural]" /></div>
        <div><Rot estilo={{ marginBottom: 10 }}>Evitamos</Rot><Marcas2 itens={p.g.fotoEvita} nao reserva="[Ex.: banco de imagem]" /></div>
      </div>
    </Pag2>
  );
}

function Aplicacoes(p) {
  const [prim, ...resto] = p.g.aplicacoes;
  return (
    <Pag2 {...p}>
      <Tit t="Aplicações" lead="A marca no dia a dia." />
      <div className="v2-sangra" style={{ height: 380, position: "relative" }}>
        <Foto src={prim?.img} vazio={prim?.nome || "Aplicação"} />
        {prim?.img && prim?.nome && <p className="v2-rot" style={{ position: "absolute", left: 64, bottom: 16, background: "var(--papel)", padding: "6px 10px", color: "var(--tinta)" }}>{prim.nome}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, Math.min(3, resto.length))}, 1fr)`, gap: 16 }}>
        {resto.slice(0, 3).map((a, i) => (
          <div key={i}>
            <div style={{ height: 170 }}><Foto src={a.img} vazio={a.nome || "Aplicação"} /></div>
            <p style={{ fontSize: 12.5, marginTop: 8 }}><b style={{ color: "var(--ac)", fontWeight: 600, marginRight: 8 }}>{nn(i + 2)}</b>{ou2(a.nome, "[Aplicação]")}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function Arquivos(p) {
  return (
    <Pag2 {...p} fundo="escuro">
      <Tit t="Arquivos" lead="Tudo o que você precisa para usar a marca, num lugar só." claro />
      <div className="v2-numerada">
        {p.g.arquivos.filter(Boolean).map((x, i) => <div key={i}><span className="n">{nn(i + 1)}</span><p style={{ fontSize: 20 }}>{x}</p></div>)}
      </div>
      <Linha r="Onde estão"><p style={{ fontSize: 20, fontWeight: 300, wordBreak: "break-all" }}>{ou2(p.g.ondeArquivos, "[Link da pasta]")}</p></Linha>
      <p style={{ marginTop: "auto", fontSize: 13, fontWeight: 300, color: "var(--cinza)" }}>Na dúvida sobre algum uso, fale com a gente antes de aplicar · contato@lastlab.com.br · (15) 99129-5541</p>
    </Pag2>
  );
}

// ---------- brand board ----------

function Board(p) {
  useFontes([p.g.fonteTitulo, p.g.fonteTexto]);
  const cores = p.g.cores;
  const ac = acentoDe(cores[1]?.hex);
  const apl = p.g.aplicacoes.slice(0, 3);
  const cel = { background: "#fff", position: "relative", overflow: "hidden" };
  const rot = (t, claro) => <p className="v2-rot" style={{ position: "absolute", left: 16, top: 14, color: claro ? "rgba(255,255,255,0.7)" : "var(--cinza)" }}>{t}</p>;
  return (
    <Pag2 {...p} estilo={{ gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h2 style={{ fontSize: 56, fontWeight: 300, letterSpacing: -2, lineHeight: 1 }}>Brand board</h2>
        <p className="v2-rot">{p.g.marca || p.nome}</p>
      </div>
      <div className="v2-sangra" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: "290px 140px 130px 1fr", gap: 2, background: "var(--filete)", padding: 0 }}>
        <div style={{ ...cel, gridColumn: "span 4", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>{rot("Logo")}<Logo g={p.g} nome={p.nome} altura={130} /></div>
        <div style={{ ...cel, gridColumn: "span 2", background: "#0b0b0c", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>{rot("Negativo", true)}<Logo g={p.g} nome={p.nome} negativo altura={64} /></div>
        {cores.slice(0, 6).map((c, i) => (
          <div key={i} style={{ gridColumn: `span ${cores.length <= 3 ? 2 : cores.length === 4 ? (i === 0 ? 3 : 1) : 1}`, background: hexRgb(c.hex) ? c.hex : "#ddd", color: tintaSobre(c.hex), padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "flex-end", fontSize: 11, lineHeight: 1.4 }}>
            <b style={{ fontSize: 13, fontWeight: 600 }}>{c.nome}</b><span>{(c.hex || "").toUpperCase()}</span>
          </div>
        ))}
        {cores.length === 5 && <div style={{ ...cel, background: ac }} />}
        <div style={{ ...cel, gridColumn: "span 3", display: "flex", alignItems: "center", gap: 18, padding: "0 22px" }}>
          <p style={{ fontFamily: `"${p.g.fonteTitulo}", Poppins`, fontSize: 72, fontWeight: 600, lineHeight: 1, letterSpacing: -3 }}>Aa</p>
          <div><p className="v2-rot">Títulos</p><p style={{ fontFamily: `"${p.g.fonteTitulo}", Poppins`, fontSize: 20, fontWeight: 600 }}>{ou2(p.g.fonteTitulo, "[Fonte]")}</p></div>
        </div>
        <div style={{ ...cel, gridColumn: "span 3", display: "flex", alignItems: "center", gap: 18, padding: "0 22px" }}>
          <p style={{ fontFamily: `"${p.g.fonteTexto}", Poppins`, fontSize: 72, fontWeight: 400, lineHeight: 1, letterSpacing: -2 }}>Aa</p>
          <div><p className="v2-rot">Textos</p><p style={{ fontFamily: `"${p.g.fonteTexto}", Poppins`, fontSize: 20 }}>{ou2(p.g.fonteTexto, "[Fonte]")}</p></div>
        </div>
        {apl.map((a, i) => <div key={i} style={{ ...cel, gridColumn: `span ${6 / Math.max(1, apl.length)}` }}><Foto src={a.img} vazio={a.nome || "Aplicação"} /></div>)}
      </div>
    </Pag2>
  );
}

const CapaManual = (p) => <Capa2 {...p} titulo="Manual de identidade" />;

export const MANUAL_V2 = () => [[CapaManual, "Capa"], [Sumario2, "Sumário"], [Conceito, "Conceito"], [LogoPag, "Logo"], [UsoLogo, "Uso do logo"], [NaoFazer, "O que não fazer"], [Cores, "Cores"], [Tipografia, "Tipografia"], [Grafismos, "Grafismos"], [Fotografia, "Fotografia"], [Aplicacoes, "Aplicações"], [Arquivos, "Arquivos"]];
export const BOARD_V2 = () => [[Board, "Brand board"]];
export const acentoIdentidade = (g) => acentoDe(g.cores?.[1]?.hex);
