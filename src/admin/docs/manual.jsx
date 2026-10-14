import React from "react";
import { Capa, Img, Logo, Marcas, Pag, Titulo, hexRgb, ou, rgbCmyk, tintaSobre, useFontes } from "./base";

// Manual de identidade (Identidade visual e Rebranding) e Brand board (Revisão de imagem e Kit
// essencial). Os dois usam os mesmos dados (apresentacao.identidade): preencher um preenche o outro.
// Conteúdo pelas boas práticas de mercado: curto e usável, com o que evita erro no dia a dia
// (logo e versões, proteção e tamanho mínimo, usos incorretos, cores com HEX/RGB/CMYK, fontes,
// grafismos, fotografia, aplicações e onde estão os arquivos).

export const VAZIO_IDENTIDADE = {
  marca: "",
  conceito: "", palavras: ["", "", ""],
  logo: "", logoNegativo: "",
  versoes: [{ img: "", nome: "Horizontal" }, { img: "", nome: "Vertical" }, { img: "", nome: "Símbolo" }],
  protecao: "Deixe em volta da marca, no mínimo, a altura do símbolo (x) livre de textos e imagens.",
  minImpresso: "25 mm", minDigital: "120 px",
  cores: [
    { nome: "Principal", hex: "#0A0A0A", uso: "Logo, títulos e textos" },
    { nome: "Destaque", hex: "#EF4B3A", uso: "Botões, chamadas e detalhes" },
    { nome: "Fundo", hex: "#F2F2F6", uso: "Fundos e respiros" },
    { nome: "Apoio", hex: "#55555D", uso: "Textos de apoio" },
  ],
  fonteTitulo: "Poppins", usoTitulo: "Títulos, chamadas e destaques",
  fonteTexto: "Inter", usoTexto: "Textos corridos, legendas e documentos",
  grafismos: ["", "", "", ""], grafismosTxt: "",
  fotoFaz: ["", "", ""], fotoEvita: ["", "", ""], fotos: ["", "", "", ""],
  aplicacoes: [{ img: "", nome: "Cartão de visita" }, { img: "", nome: "Post para redes" }, { img: "", nome: "Assinatura de e-mail" }, { img: "", nome: "Fachada ou embalagem" }],
  arquivos: ["Logo em todas as versões (PNG, SVG e PDF)", "Paleta de cores (HEX, RGB e CMYK)", "Fontes, com o link para baixar", "Grafismos e texturas", "Templates editáveis"],
  ondeArquivos: "",
};

const SECOES = (completo) => [
  { titulo: "Marca", campos: [{ k: "marca", tipo: "texto", ph: "Nome da marca" }] },
  ...(completo ? [{ titulo: "Conceito", ajuda: "A ideia por trás da identidade, em poucas linhas.", campos: [
    { k: "conceito", tipo: "area", rows: 4, ph: "O que a identidade quer transmitir e por quê" },
    { k: "palavras", tipo: "lista", rotulo: "Três palavras", ph: "Ex.: sólida", max: 4 },
  ] }] : []),
  { titulo: "Logo", ajuda: "PNG com fundo transparente ou SVG.", campos: [
    { k: "logo", tipo: "imagem", rotulo: "Principal" },
    { k: "logoNegativo", tipo: "imagem", rotulo: "Para fundo escuro (opcional)" },
    { k: "versoes", tipo: "itens", rotulo: "Versões", max: 4, novo: { img: "", nome: "" }, campos: [{ k: "img", tipo: "imagem" }, { k: "nome", tipo: "texto", ph: "Nome da versão" }] },
  ] },
  ...(completo ? [{ titulo: "Uso do logo", campos: [
    { k: "protecao", tipo: "area", rows: 2, rotulo: "Área de proteção" },
    { k: "minImpresso", tipo: "texto", rotulo: "Tamanho mínimo impresso" },
    { k: "minDigital", tipo: "texto", rotulo: "Tamanho mínimo digital" },
  ] }] : []),
  { titulo: "Cores", ajuda: "RGB e CMYK são calculados a partir do HEX.", campos: [
    { k: "cores", tipo: "itens", max: 6, novo: { nome: "", hex: "#CCCCCC", uso: "" }, campos: [{ k: "hex", tipo: "cor" }, { k: "nome", tipo: "texto", ph: "Nome" }, { k: "uso", tipo: "texto", ph: "Onde usar" }] },
  ] },
  { titulo: "Tipografia", ajuda: "Nome exato da fonte no Google Fonts.", campos: [
    { k: "fonteTitulo", tipo: "fonte", rotulo: "Fonte dos títulos" },
    ...(completo ? [{ k: "usoTitulo", tipo: "texto", rotulo: "Uso" }] : []),
    { k: "fonteTexto", tipo: "fonte", rotulo: "Fonte dos textos" },
    ...(completo ? [{ k: "usoTexto", tipo: "texto", rotulo: "Uso" }] : []),
  ] },
  ...(completo ? [
    { titulo: "Grafismos", campos: [
      { k: "grafismos", tipo: "imagens", max: 4 },
      { k: "grafismosTxt", tipo: "area", rows: 3, ph: "Como e onde usar os grafismos" },
    ] },
    { titulo: "Fotografia", campos: [
      { k: "fotoFaz", tipo: "lista", rotulo: "Fotos que usamos", ph: "Ex.: luz natural, pessoas reais", max: 4 },
      { k: "fotoEvita", tipo: "lista", rotulo: "Fotos que evitamos", ph: "Ex.: banco de imagem posado", max: 4 },
      { k: "fotos", tipo: "imagens", rotulo: "Referências", max: 4 },
    ] },
  ] : []),
  { titulo: "Aplicações", campos: [
    { k: "aplicacoes", tipo: "itens", max: completo ? 6 : 3, novo: { img: "", nome: "" }, campos: [{ k: "img", tipo: "imagem" }, { k: "nome", tipo: "texto", ph: "Onde foi aplicada" }] },
  ] },
  ...(completo ? [{ titulo: "Arquivos", campos: [
    { k: "arquivos", tipo: "lista", rotulo: "O que vai na pasta", max: 8 },
    { k: "ondeArquivos", tipo: "texto", rotulo: "Onde estão", ph: "Link da pasta" },
  ] }] : []),
];

// ---------- páginas do manual ----------

function Conceito(p) {
  const palavras = p.g.palavras.filter(Boolean);
  return (
    <Pag {...p} tipo="escuro" classe="gm-frase">
      <p className="rot">Conceito</p>
      <blockquote style={{ fontSize: 40, lineHeight: 1.25, whiteSpace: "pre-line" }}>{ou(p.g.conceito, "[A ideia por trás da identidade: o que ela quer transmitir e por quê]")}</blockquote>
      <div className="gm-palavras" style={{ marginTop: 12 }}>
        {(palavras.length ? palavras : ["[Palavra 1]", "[Palavra 2]", "[Palavra 3]"]).map((w) => <span key={w} style={{ borderColor: "#f7f7f9", fontSize: 20, padding: "8px 20px" }}>{w}</span>)}
      </div>
    </Pag>
  );
}

function LogoPag(p) {
  return (
    <Pag {...p}>
      <Titulo t="Logo" s="A assinatura da marca e as suas versões." />
      <div className="dc-card" style={{ height: 380, display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <Logo g={p.g} nome={p.nome} altura={170} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, p.g.versoes.length)}, 1fr)`, gap: 16 }}>
        {p.g.versoes.map((v, i) => (
          <div key={i}>
            <div className="dc-card" style={{ height: 170, padding: 26 }}><Img src={v.img} contain vazio={v.nome || "Versão"} /></div>
            <p className="txt" style={{ marginTop: 10, fontWeight: 500 }}>{ou(v.nome, `[Versão ${i + 1}]`)}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function UsoLogo(p) {
  const destaque = p.g.cores[1]?.hex || "#ef4b3a";
  return (
    <Pag {...p}>
      <Titulo t="Uso do logo" s="Espaço, tamanho e fundos." />
      <div className="gm-grade2" style={{ alignItems: "stretch" }}>
        <div className="gm-bloco">
          <p className="rot">Área de proteção</p>
          <div className="dc-card" style={{ height: 230, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="dc-protecao"><Logo g={p.g} nome={p.nome} altura={70} />{["tl", "tr", "bl", "br"].map((c) => <i key={c} className={c}>x</i>)}</div>
          </div>
          <p className="txt suave" style={{ fontSize: 15 }}>{ou(p.g.protecao, "[Regra da área de proteção]")}</p>
        </div>
        <div className="gm-bloco">
          <p className="rot">Tamanho mínimo</p>
          <div className="dc-card" style={{ height: 230, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 48, padding: "0 20px 40px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}><Logo g={p.g} nome={p.nome} altura={46} /><span className="dc-medida">{ou(p.g.minImpresso, "[mm]")} · impresso</span></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}><Logo g={p.g} nome={p.nome} altura={30} /><span className="dc-medida">{ou(p.g.minDigital, "[px]")} · digital</span></div>
          </div>
          <p className="txt suave" style={{ fontSize: 15 }}>Abaixo disso, o logo perde leitura.</p>
        </div>
      </div>
      <div className="gm-bloco">
        <p className="rot">Fundos</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[["#ffffff", false, "Fundo claro"], ["#0a0a0a", true, "Fundo escuro"], [destaque, tintaSobre(destaque) === "#ffffff", "Cor da marca"]].map(([bg, neg, r]) => (
            <div key={r}>
              <div style={{ background: bg, borderRadius: 16, height: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><Logo g={p.g} nome={p.nome} negativo={neg} altura={54} /></div>
              <p className="txt" style={{ fontSize: 14, marginTop: 8 }}>{r}</p>
            </div>
          ))}
        </div>
      </div>
    </Pag>
  );
}

const ERROS = [
  ["Distorcer", { transform: "scaleX(1.55)" }],
  ["Girar", { transform: "rotate(-14deg)" }],
  ["Trocar as cores", { filter: "invert(45%) sepia(90%) saturate(600%) hue-rotate(170deg)" }],
  ["Aplicar sombra ou efeito", { filter: "drop-shadow(6px 6px 0 #9a9aa3)" }],
  ["Fundo sem contraste", { opacity: 0.22 }],
  ["Fundo poluído", {}, "repeating-linear-gradient(45deg, #ef4b3a 0 14px, #ffd8d2 14px 28px, #6b8cff 28px 42px)"],
];

function NaoFazer(p) {
  return (
    <Pag {...p}>
      <Titulo t="O que não fazer" s="Os erros mais comuns, para ninguém cometer." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
        {ERROS.map(([nomeErro, estilo, fundo]) => (
          <div key={nomeErro}>
            <div className="dc-card" style={{ height: 200, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: fundo || "#fff", overflow: "hidden" }}>
              <div style={estilo}><Logo g={p.g} nome={p.nome} altura={64} /></div>
              <span className="dc-x">×</span>
            </div>
            <p className="txt" style={{ fontSize: 15, marginTop: 8, fontWeight: 500 }}>{nomeErro}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function Cores(p) {
  const cores = p.g.cores;
  return (
    <Pag {...p}>
      <Titulo t="Cores" s="A paleta e onde usar cada cor." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {cores.map((c, i) => {
          const rgb = hexRgb(c.hex);
          const cmyk = rgb ? rgbCmyk(rgb) : null;
          const grande = i === 0 && cores.length % 2 === 1;
          return (
            <div key={i} className="dc-card" style={{ gridColumn: grande ? "span 2" : undefined }}>
              <div style={{ background: rgb ? c.hex : "#ddd", color: tintaSobre(c.hex), height: grande ? 200 : cores.length > 4 ? 120 : 170, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{ou(c.nome, `[Cor ${i + 1}]`)}</p>
                <p style={{ fontSize: 15, fontWeight: 500, letterSpacing: 1 }}>{(c.hex || "").toUpperCase()}</p>
              </div>
              <div style={{ padding: "14px 22px 16px", fontSize: 13, lineHeight: 1.6 }}>
                <p><b>RGB</b> {rgb ? rgb.join(" ") : "—"}</p>
                <p><b>CMYK</b> {cmyk ? cmyk.join(" ") : "—"}</p>
                <p className="suave" style={{ marginTop: 4 }}>{ou(c.uso, "[Onde usar]")}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Pag>
  );
}

function Tipografia(p) {
  useFontes([p.g.fonteTitulo, p.g.fonteTexto]);
  const ft = `"${p.g.fonteTitulo}", Poppins, sans-serif`;
  const fx = `"${p.g.fonteTexto}", Poppins, sans-serif`;
  return (
    <Pag {...p}>
      <Titulo t="Tipografia" s="Duas fontes, cada uma no seu papel." />
      {[[p.g.fonteTitulo, ft, p.g.usoTitulo, "Títulos"], [p.g.fonteTexto, fx, p.g.usoTexto, "Textos"]].map(([n, f, uso, r]) => (
        <div key={r} className="gm-bloco" style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 24, alignItems: "center" }}>
          <p style={{ fontFamily: f, fontSize: 120, lineHeight: 1, fontWeight: 600 }}>Aa</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p className="rot">{r}</p>
            <p style={{ fontFamily: f, fontSize: 30, fontWeight: 600, lineHeight: 1.1 }}>{ou(n, "[Fonte]")}</p>
            {uso !== undefined && <p className="txt suave" style={{ fontSize: 15 }}>{ou(uso, "[Uso]")}</p>}
            <p style={{ fontFamily: f, fontSize: 15, lineHeight: 1.5, color: "#55555d" }}>ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz 0123456789</p>
          </div>
        </div>
      ))}
      <div className="gm-caixa" style={{ gap: 12 }}>
        <p className="rot">Hierarquia</p>
        <p style={{ fontFamily: ft, fontSize: 40, fontWeight: 600, lineHeight: 1.1 }}>Título da página</p>
        <p style={{ fontFamily: ft, fontSize: 22, fontWeight: 400 }}>Subtítulo que explica em uma linha</p>
        <p style={{ fontFamily: fx, fontSize: 15, lineHeight: 1.6, color: "#55555d" }}>Texto corrido para documentos, site e legendas. Tamanho confortável, linhas curtas e bastante respiro entre os blocos.</p>
      </div>
    </Pag>
  );
}

function Grafismos(p) {
  return (
    <Pag {...p}>
      <Titulo t="Grafismos" s="Os elementos que dão ritmo à marca." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {p.g.grafismos.map((src, i) => <div key={i} className="dc-card" style={{ height: 290 }}><Img src={src} vazio={`Grafismo ${i + 1}`} /></div>)}
      </div>
      <p className="txt" style={{ whiteSpace: "pre-line" }}>{ou(p.g.grafismosTxt, "[Como e onde usar os grafismos]")}</p>
    </Pag>
  );
}

function Fotografia(p) {
  return (
    <Pag {...p}>
      <Titulo t="Fotografia" s="O olhar da marca nas imagens." />
      <div className="gm-grade2">
        <div className="gm-bloco"><p className="rot">Usamos</p><Marcas itens={p.g.fotoFaz} reserva="[Ex.: luz natural, pessoas reais]" /></div>
        <div className="gm-bloco"><p className="rot">Evitamos</p><Marcas itens={p.g.fotoEvita} nao reserva="[Ex.: banco de imagem posado]" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {p.g.fotos.map((src, i) => <div key={i} className="dc-card" style={{ height: 250 }}><Img src={src} vazio={`Referência ${i + 1}`} /></div>)}
      </div>
    </Pag>
  );
}

function Aplicacoes(p) {
  const n = p.g.aplicacoes.length;
  return (
    <Pag {...p}>
      <Titulo t="Aplicações" s="A marca no dia a dia." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {p.g.aplicacoes.map((a, i) => (
          <div key={i}>
            <div className="dc-card" style={{ height: n > 4 ? 200 : 290 }}><Img src={a.img} vazio={a.nome || "Aplicação"} /></div>
            <p className="txt" style={{ fontSize: 15, marginTop: 8, fontWeight: 500 }}>{ou(a.nome, `[Aplicação ${i + 1}]`)}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function Arquivos(p) {
  return (
    <Pag {...p} tipo="escuro">
      <Titulo t="Arquivos" s="Tudo o que você precisa para usar a marca." />
      <Marcas itens={p.g.arquivos} reserva="[Arquivo]" />
      <div className="gm-bloco" style={{ borderColor: "#f7f7f9", marginTop: 12 }}>
        <p className="rot">Onde estão</p>
        <p style={{ fontSize: 22, fontWeight: 300, wordBreak: "break-all" }}>{ou(p.g.ondeArquivos, "[Link da pasta]")}</p>
      </div>
      <p className="txt" style={{ color: "#c9c9d1", marginTop: "auto" }}>Na dúvida sobre algum uso, fale com a gente antes de aplicar.<br />contato@lastlab.com.br · (15) 99129-5541</p>
    </Pag>
  );
}

// ---------- brand board (uma página) ----------

function Board(p) {
  useFontes([p.g.fonteTitulo, p.g.fonteTexto]);
  const cores = p.g.cores;
  return (
    <Pag {...p} estilo={{ gap: 18, paddingTop: 56 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><h2 style={{ fontSize: 44 }}>Brand board</h2><p className="rot">{p.g.marca || p.nome}</p></div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <div className="dc-card" style={{ height: 310, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}><Logo g={p.g} nome={p.nome} altura={130} /></div>
        <div style={{ background: "#0a0a0a", borderRadius: 18, height: 310, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}><Logo g={p.g} nome={p.nome} negativo altura={70} /></div>
      </div>
      <div style={{ display: "flex", borderRadius: 18, overflow: "hidden", height: 180, boxShadow: "inset 0 0 0 1px #dcdce2" }}>
        {cores.map((c, i) => (
          <div key={i} style={{ flex: i === 0 ? 2 : 1, background: hexRgb(c.hex) ? c.hex : "#ddd", color: tintaSobre(c.hex), padding: "14px 14px", display: "flex", flexDirection: "column", justifyContent: "flex-end", fontSize: 12, lineHeight: 1.4 }}>
            <b style={{ fontSize: 14 }}>{c.nome}</b><span>{(c.hex || "").toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[[p.g.fonteTitulo, "Títulos", 600], [p.g.fonteTexto, "Textos", 400]].map(([n, r, w]) => (
          <div key={r} className="dc-card" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 18 }}>
            <p style={{ fontFamily: `"${n}", Poppins, sans-serif`, fontSize: 64, fontWeight: w, lineHeight: 1 }}>Aa</p>
            <div><p className="rot">{r}</p><p style={{ fontFamily: `"${n}", Poppins, sans-serif`, fontSize: 20, fontWeight: w }}>{ou(n, "[Fonte]")}</p></div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, Math.min(3, p.g.aplicacoes.length))}, 1fr)`, gap: 14 }}>
        {p.g.aplicacoes.slice(0, 3).map((a, i) => <div key={i} className="dc-card" style={{ height: 250 }}><Img src={a.img} vazio={a.nome || "Aplicação"} /></div>)}
      </div>
    </Pag>
  );
}

// ---------- definições ----------

const CapaManual = (p) => <Capa {...p} titulo="Manual de identidade" />;

export const MANUAL = {
  id: "manual", nome: "Manual de identidade", chave: "identidade", rodape: ["Identidade", "visual"], area: "valor",
  servicos: ["valor_principal", "valor_premium"],
  descricao: "Conceito, logo e versões, uso correto e incorreto, cores com HEX/RGB/CMYK, tipografia, grafismos, fotografia, aplicações e arquivos.",
  vazio: VAZIO_IDENTIDADE, secoes: SECOES(true),
  paginas: () => [[CapaManual, "Capa"], [Conceito, "Conceito"], [LogoPag, "Logo"], [UsoLogo, "Uso do logo"], [NaoFazer, "O que não fazer"], [Cores, "Cores"], [Tipografia, "Tipografia"], [Grafismos, "Grafismos"], [Fotografia, "Fotografia"], [Aplicacoes, "Aplicações"], [Arquivos, "Arquivos"]],
};

export const BRAND_BOARD = {
  id: "brand-board", nome: "Brand board", chave: "identidade", rodape: ["Brand", "board"], area: "valor",
  servicos: ["revisao", "kit"],
  descricao: "A marca numa página: logo, versão em fundo escuro, cores, fontes e aplicações. Usa os mesmos dados do Manual.",
  vazio: VAZIO_IDENTIDADE, secoes: SECOES(false),
  paginas: () => [[Board, "Brand board"]],
};
