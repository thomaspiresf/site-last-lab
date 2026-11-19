import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Nav, Grade, Convite } from "./HomeNova";
import { destaques } from "./homeNovaDados";
import { methodSteps } from "../data/projects";
import "./homeNova.css";

// Página do estúdio (protótipo, rota /estudio), em preto com os grafismos da marca em laranja.
// Abertura: o grafismo 2 desenhado por código — 6 lâminas vistas em perspectiva, como uma persiana.
// "a" vai de 0 (lâminas de frente) a 1 (lâminas quase de lado); em a = 0,5 fica igual ao arquivo.

const ALTURA = 470;
const LARG_LAMINA = 165;
const ANGULO_MEIO = [20, 50, 66].map((g) => (g * Math.PI) / 180); // giro de cada lâmina (de fora p/ dentro) no desenho original
const RECUO_MEIO = 0.135; // a borda de dentro encolhe 13,5% em cima e embaixo
const QUINA = 26; // largura do trecho reto no topo/base de cada lâmina, medida no arquivo do grafismo 2
// profundidade de cada uma das 6 lâminas (0 = de fora, 2 = do centro), da esquerda para a direita
const PROF = [0, 1, 2, 2, 1, 0];

const limitar = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const suave = (v) => v * v * (3 - 2 * v);
const faixa = (p, de, ate) => suave(limitar((p - de) / (ate - de)));
const comPassada = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }; // passa um pouco e volta
const misturar = (c1, c2, t) => `rgb(${c1.map((v, k) => Math.round(v + (c2[k] - v) * t)).join(",")})`;
const LARANJA = [239, 75, 58];
const SOMBRA = [118, 34, 26]; // a lâmina escurece conforme vira de lado

// Desenha as 6 lâminas. a[i] = giro de cada uma (0 de frente, 0,5 = grafismo 2, 1 de lado).
// abre = quanto elas se afastam para as laterais.
function desenharLaminas(a, abre = 0, largura = 1000) {
  const medida = (ai, d) => {
    const ang = Math.min(Math.PI * 0.48, Math.max(0, ANGULO_MEIO[d] * ai * 2));
    return {
      w: Math.max(4, LARG_LAMINA * Math.cos(ang)),
      recuo: Math.min(0.42, (RECUO_MEIO * Math.sin(ang)) / Math.sin(ANGULO_MEIO[d])) * ALTURA,
      // a "quina" do grafismo 2: um trecho reto em cima e embaixo, na borda de fora, antes da diagonal
      // (é a espessura da lâmina vista em perspectiva; some quando a lâmina fica de frente)
      quina: Math.min(QUINA * Math.min(1, Math.sin(ang) / Math.sin(ANGULO_MEIO[0])), LARG_LAMINA * Math.cos(ang) * 0.45),
      // laranja chapado como no grafismo 2; só escurece quando gira bem além do desenho original (persiana abrindo),
      // com folga para a respiração e o mouse não mancharem a cor
      cor: misturar(LARANJA, SOMBRA, limitar((ang - ANGULO_MEIO[d] * 1.15) / (Math.PI * 0.48 - ANGULO_MEIO[d] * 1.15)) * 0.75),
    };
  };
  const media = a.reduce((x, y) => x + y, 0) / a.length;
  const entre = 10 + 100 * media + 130 * abre; // ~60 entre lâminas no desenho original (a = 0,5)
  const centro = 6 + 68 * media + 560 * abre; // metade do vão central (~80 no original)
  const lado = (indices, sinal) => {
    let x = largura / 2 - centro;
    return indices.map((i) => {
      const m = medida(a[i], PROF[i]);
      const interno = x, externo = x - m.w;
      x = externo - entre;
      const xi = largura / 2 + (interno - largura / 2) * sinal;
      const xo = largura / 2 + (externo - largura / 2) * sinal;
      const xq = largura / 2 + (externo + m.quina - largura / 2) * sinal;
      const pts = [[xo, 0], [xq, 0], [xi, m.recuo], [xi, ALTURA - m.recuo], [xq, ALTURA], [xo, ALTURA]];
      return { i, cor: m.cor, cx: (xi + xo) / 2, w: m.w, pts: pts.map((v) => v.map((n) => n.toFixed(1)).join(",")).join(" ") };
    });
  };
  // monta de dentro para fora: esquerda (2,1,0) e direita (3,4,5)
  return [...lado([2, 1, 0], 1), ...lado([3, 4, 5], -1)].sort((x, y) => x.i - y.i);
}

// Título com as palavras subindo de dentro de uma máscara, uma de cada vez
function Palavras({ texto, atraso = 0, className = "" }) {
  // o espaço fica fora da máscara (dentro de um inline-block ele seria descartado)
  return texto.split(" ").map((p, i) => (
    <React.Fragment key={i}>
      <span className="es-palavra">
        <span className={className} style={{ animationDelay: `${atraso + i * 90}ms` }}>{p}</span>
      </span>{" "}
    </React.Fragment>
  ));
}

// Abertura (esquema Almanaque). A tela fica presa enquanto a pessoa rola, em quatro tempos:
// 1) entrada: as lâminas chegam de lado e "abrem" até o grafismo 2, do centro para fora, passando
//    um pouco do ponto e voltando; o título sobe palavra por palavra;
// 2) parado: as lâminas respiram e seguem o mouse, cada uma com um pequeno atraso;
// 3) rolando: a persiana FECHA num paredão laranja que toma a tela, e aparece "Ouvir. Direcionar. Aplicar.";
// 4) segue rolando: a persiana ABRE até as lâminas virarem frestas, revelando o manifesto por trás,
//    e no fim elas se afastam para as laterais.
// Cada lâmina persegue o seu próprio alvo com um atraso diferente (as do centro puxam as de fora),
// por isso o movimento ondula em vez de andar em bloco.
function Abertura() {
  const secao = useRef(null);
  const palco = useRef(null);
  const laminas = useRef([]);
  const svg = useRef(null);
  const estreito = typeof window !== "undefined" && window.innerWidth < 700;

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let quadro = 0;
    const inicio = performance.now();
    let rolagem = 0, mouse = 0, mouseAlvo = 0;
    const atual = [1, 1, 1, 1, 1, 1];

    const alvoRolagem = () => {
      const el = secao.current;
      if (!el) return 0;
      return limitar(-el.getBoundingClientRect().top / (el.offsetHeight - window.innerHeight));
    };
    const aoMover = (e) => { mouseAlvo = (e.clientX / window.innerWidth) * 2 - 1; };

    const tick = (agora) => {
      rolagem += (alvoRolagem() - rolagem) * (reduzir ? 1 : 0.085);
      mouse += (mouseAlvo - mouse) * 0.06;
      const t = (agora - inicio) / 1000;
      const p = rolagem;

      // as lâminas saem direto do desenho original, girando e se afastando, e revelam o manifesto
      const afasta = faixa(p, 0.3, 0.86);
      const parado = 1 - faixa(p, 0, 0.12);

      for (let i = 0; i < 6; i++) {
        const d = PROF[i];
        const lado = i < 3 ? 1 : -1;
        // entrada: do centro para fora, chegando de lado (1) até o desenho original (0,5)
        const e = reduzir ? 1 : comPassada(limitar((t - 0.1 - (2 - d) * 0.12) / 1.15));
        let alvo = 1 - 0.5 * e;
        alvo += parado * (Math.sin(t * 1.2 + d * 0.9) * 0.03 + mouse * lado * 0.13 * (0.6 + d * 0.2));
        alvo = alvo + (1 - alvo) * faixa(p, 0.1 - d * 0.03, 0.5 - d * 0.03); // abre em onda, do centro para fora
        // cada lâmina persegue o alvo com o seu atraso
        atual[i] += (alvo - atual[i]) * (reduzir ? 1 : 0.1 + d * 0.035);
      }

      desenharLaminas(atual, afasta).forEach((l) => {
        const el = laminas.current[l.i];
        if (el) {
          el.setAttribute("points", l.pts); el.style.fill = l.cor;
        }
      });

      const s = palco.current?.style;
      if (s) {
        s.setProperty("--titulo-sai", faixa(p, 0.02, 0.22).toFixed(3));
        s.setProperty("--base-sai", faixa(p, 0, 0.12).toFixed(3));
        // enquanto se afastam, o grafismo cresce: as lâminas passam pelas laterais e saem da tela, sem cruzar o texto
        s.setProperty("--zoom", (1 + 1.8 * faixa(p, 0.2, 0.86)).toFixed(3));
        // o manifesto é revelado do centro para as pontas, exatamente pelo vão que as lâminas abrem ao sair
        // (medido na tela: o vão entre as duas lâminas do meio, a partir do centro do texto)
        const texto = palco.current.querySelector(".es-manifesto-palco");
        const esq = laminas.current[2], dir = laminas.current[3];
        if (texto && esq && dir) {
          const t0 = texto.getBoundingClientRect();
          const centro = t0.left + t0.width / 2;
          const vao = Math.min(centro - esq.getBoundingClientRect().right, dir.getBoundingClientRect().left - centro);
          // no fim, a janela continua abrindo além das lâminas para o texto ficar inteiro (no celular a tela é estreita)
          const fresta = Math.max(0, vao) + faixa(p, 0.7, 0.88) * window.innerWidth * 1.2;
          s.setProperty("--fresta", `${fresta.toFixed(1)}px`);
          s.setProperty("--suave", `${Math.min(120, fresta).toFixed(1)}px`); // borda esfumada do texto
        }
        s.setProperty("--manifesto", faixa(p, 0.16, 0.3).toFixed(3));
        s.setProperty("--laminas", (1 - faixa(p, 0.8, 0.94)).toFixed(3)); // só no finzinho, quando já saíram
      }
      quadro = requestAnimationFrame(tick);
    };
    quadro = requestAnimationFrame(tick);
    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("pointermove", aoMover);
    };
  }, []);

  return (
    <section ref={secao} className="es-abertura" aria-label="Estúdio">
      <div ref={palco} className="es-palco">
        <div className="es-palco-topo">
          <p className="hn-rotulo es-entra" style={{ animationDelay: "60ms" }}>Estúdio · Método BASE</p>
          <h1 className="hn-titulo es-titulo">
            <Palavras texto="Design com" atraso={250} />
            <Palavras texto="método." atraso={430} className="hn-laranja" />
          </h1>
        </div>

        <div className="es-palco-centro">
          {/* o manifesto fica atrás das lâminas: aparece pelas frestas quando a persiana abre */}
          <p className="hn-titulo es-manifesto-palco">
            Estruturamos projetos de branding, apresentações, social media, campanhas e digital a partir
            do mesmo princípio: <span className="es-cinza">entendimento real, direção clara e soluções visuais que funcionam.</span>
          </p>
          {/* no celular a tela é alta: as lâminas esticam na vertical em vez de encolher */}
          <svg
            className="es-grafismo es-grafismo-abertura"
            viewBox={`0 0 1000 ${ALTURA}`}
            preserveAspectRatio={estreito ? "none" : "xMidYMid meet"}
            aria-hidden="true"
            ref={svg}
          >
            {desenharLaminas([1, 1, 1, 1, 1, 1]).map((l) => (
              <polygon key={l.i} ref={(el) => (laminas.current[l.i] = el)} points={l.pts} style={{ fill: l.cor }} />
            ))}
          </svg>
        </div>

        <div className="es-palco-base">
          <span className="es-entra" style={{ animationDelay: "900ms" }}>Porque clareza não acontece por acaso.</span>
          <span className="es-role es-entra" style={{ animationDelay: "1000ms" }}>
            <i aria-hidden="true" /> Role
          </span>
        </div>
      </div>
    </section>
  );
}

// Um grafismo diferente para cada pilar, inteiro (sem recorte, para manter as quinas), à esquerda.
// Escolha do usuário: Buscar 8, Alinhar 1, Sintetizar 3, Entregar 6.
const GRAFISMO_DO_PILAR = ["/images/grafismos/grafismo-8.png", "/images/grafismos/grafismo-1.png", "/images/grafismos/grafismo-3.png", "/images/grafismos/grafismo-6.png"];

export default function EstudioNovo() {
  useEffect(() => { document.title = "Estúdio | Last Lab"; }, []);

  // entrada das etapas: quando cada uma aparece na tela, o grafismo é "desenhado" da esquerda
  // para a direita e o texto sobe logo depois
  const metodo = useRef(null);
  useEffect(() => {
    const etapas = [...(metodo.current?.querySelectorAll(".es-etapa") || [])];
    // anima sempre que a etapa entra na tela e "rearma" quando ela sai por completo
    const conferir = () => {
      const h = window.innerHeight;
      etapas.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < h * 0.82 && r.bottom > h * 0.12) el.classList.add("is-visivel");
        else if (r.top > h || r.bottom < 0) el.classList.remove("is-visivel");
      });
    };
    conferir();
    window.addEventListener("scroll", conferir, { passive: true });
    window.addEventListener("resize", conferir);
    return () => {
      window.removeEventListener("scroll", conferir);
      window.removeEventListener("resize", conferir);
    };
  }, []);

  return (
    <div className="hn es">
      <Nav escura />
      <Abertura />


      <section ref={metodo} className="es-metodo" aria-label="Os pilares do Método BASE">
        {methodSteps.map((e, i) => (
          <article key={e.number} className="es-etapa">
            <figure className="es-etapa-grafismo">
              <img src={GRAFISMO_DO_PILAR[i % GRAFISMO_DO_PILAR.length]} alt="" loading="lazy" />
            </figure>
            <div className="es-etapa-texto">
              <span className="es-etapa-num">{e.number}</span>
              <h2 className="hn-titulo">{e.title}</h2>
            </div>
            <p>{e.description}</p>
          </article>
        ))}
      </section>

      <section className="es-projetos">
        <div className="he-projetos-topo">
          <div>
            <p className="hn-rotulo">Projetos</p>
            <h2 className="hn-titulo">O método, na prática</h2>
          </div>
          <Link to="/#projetos" className="hn-link-case">Ver todos ↗</Link>
        </div>
        <Grade itens={destaques.slice(0, 3)} />
      </section>

      <Convite escuro />
    </div>
  );
}
