// Analytics do site: eventos anônimos na tabela `eventos` do Supabase (aba Analytics do admin) e,
// se houver VITE_GA_MEASUREMENT_ID no build, o Google Analytics 4. O diagnóstico usa as mesmas
// chaves de visitante e sessão (mesmo domínio), então a mesma pessoa é contada uma vez só.
// Não rastreia: o admin (nem quem já entrou no admin neste navegador), robôs e o localhost.

const URL_SB = import.meta.env.VITE_SUPABASE_URL;
const CHAVE = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
// Meta Pixel (conjunto de dados "Last Lab - Site", portfólio Last Lab). O ID é público.
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "2314908892694814";
// eventos do site que também vão para a Meta (padrão da Meta → para otimizar anúncios)
const PIXEL_EVENTOS = { whatsapp: "Contact", brief_iniciou: ["BriefingIniciado", true], brief_enviado: "Lead" };

const K_VISITANTE = "ll-visitante";
const K_SESSAO = "ll-sessao";
const K_INTERNO = "ll-interno";
const SESSAO_MIN = 30; // minutos sem atividade encerram a sessão

const ler = (s, k) => { try { return s.getItem(k); } catch { return null; } };
const gravar = (s, k, v) => { try { s.setItem(k, v); } catch { /* navegação privada */ } };
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);

/** Este navegador é do admin: não entra nas estatísticas. */
export function marcarInterno() {
  gravar(localStorage, K_INTERNO, "1");
}

function desligado() {
  if (typeof window === "undefined") return true;
  if (ler(localStorage, K_INTERNO)) return true;
  if (navigator.webdriver) return true;
  return /^(localhost|127\.|192\.168\.)/.test(location.hostname) && !import.meta.env.VITE_ANALYTICS_LOCAL;
}

export function visitanteId() {
  let v = ler(localStorage, K_VISITANTE);
  if (!v) { v = novoId(); gravar(localStorage, K_VISITANTE, v); }
  return v;
}

/** Sessão: id, origem (UTM ou site de onde veio) e aparelho, fixados na primeira página. */
function sessao() {
  const agora = Date.now();
  let s = null;
  try { s = JSON.parse(ler(sessionStorage, K_SESSAO) || "null"); } catch { s = null; }
  if (!s || agora - s.ultimo > SESSAO_MIN * 60000) {
    const q = new URLSearchParams(location.search);
    let referencia = null;
    try {
      const r = document.referrer && new URL(document.referrer);
      if (r && !/lastlab\.com\.br$/.test(r.hostname)) referencia = r.hostname.replace(/^www\./, "").slice(0, 120);
    } catch { /* referrer inválido */ }
    const w = window.innerWidth;
    s = {
      id: novoId(),
      origem: q.get("utm_source")?.slice(0, 80) || null,
      midia: q.get("utm_medium")?.slice(0, 80) || null,
      campanha: q.get("utm_campaign")?.slice(0, 120) || null,
      anuncio: q.get("utm_content")?.slice(0, 160) || null,
      referencia,
      dispositivo: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? (w >= 700 ? "tablet" : "celular") : w < 700 ? "celular" : "computador",
    };
  }
  s.ultimo = agora;
  gravar(sessionStorage, K_SESSAO, JSON.stringify(s));
  return s;
}

/** Registra um evento (tipo: "pagina", "whatsapp"...). Nunca quebra a página. */
export function registrar(tipo, { pagina = location.pathname, detalhe = null } = {}) {
  if (desligado() || !URL_SB || !CHAVE) return;
  const s = sessao();
  const corpo = {
    app: "site", visitante: visitanteId(), sessao: s.id, tipo,
    pagina: pagina.slice(0, 200), detalhe: detalhe ? String(detalhe).slice(0, 120) : null,
    origem: s.origem, midia: s.midia, campanha: s.campanha, anuncio: s.anuncio, referencia: s.referencia, dispositivo: s.dispositivo,
  };
  fetch(`${URL_SB}/rest/v1/eventos`, {
    method: "POST",
    headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(corpo),
    keepalive: true,
  }).catch(() => {});
  if (window.fbq) {
    if (tipo === "pagina") window.fbq("track", "PageView");
    else if (PIXEL_EVENTOS[tipo]) {
      const [nome, proprio] = [].concat(PIXEL_EVENTOS[tipo]);
      window.fbq(proprio ? "trackCustom" : "track", nome, { origem: tipo === "brief_enviado" ? "briefing" : pagina });
    }
  }
  if (window.gtag) {
    if (tipo === "pagina") window.gtag("event", "page_view", { page_path: pagina, page_location: location.href });
    else window.gtag("event", tipo === "whatsapp" ? "clique_whatsapp" : tipo, { pagina });
  }
}

/** Liga o Pixel da Meta e o GA4 (se houver o ID) e conta cliques em qualquer link de WhatsApp. Chamar uma vez. */
export function iniciarAnalytics() {
  if (desligado()) return;
  if (GA_ID && !window.gtag) {
    const sc = document.createElement("script");
    sc.async = true;
    sc.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(sc);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    // as páginas são enviadas por registrar() a cada troca de rota
    window.gtag("config", GA_ID, { send_page_view: false });
  }
  if (PIXEL_ID && !window.fbq) {
    /* eslint-disable */
    (function (f, b, e, v) {
      const n = (f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      const t = b.createElement(e); t.async = true; t.src = v;
      b.head.appendChild(t);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    // o PageView vai a cada troca de página, por registrar("pagina")
    window.fbq("init", PIXEL_ID);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
    if (a) registrar("whatsapp");
  }, { capture: true });
}
