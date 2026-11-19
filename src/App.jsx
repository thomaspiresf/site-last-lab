import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RodapeNovo from "./components/RodapeNovo";
import HomeNova from "./pages/HomeNova";
import CaseNovo from "./pages/CaseNovo";
import EstudioNovo from "./pages/EstudioNovo";
import ContatoNovo from "./pages/ContatoNovo";
import { BlogNovo, ArtigoNovo } from "./pages/BlogNovo";
import BrandBriefing from "./pages/BrandBriefing";
import Privacidade from "./pages/Privacidade";
import { ThomasInicio, ThomasSobreNova, ThomasCase } from "./pages/ThomasNova";
import WhatsAppButton from "./components/WhatsAppButton";
import WhatsAppNovo from "./components/WhatsAppNovo";
import AvisoCookies from "./components/AvisoCookies";
import { iniciarAnalytics, registrar } from "./lib/analytics";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminClientDetail from "./admin/AdminClientDetail";
import AdminClientReferences from "./admin/AdminClientReferences";
import AdminBriefings from "./admin/AdminBriefings";
import AdminDiagnosticos from "./admin/AdminDiagnosticos";
import AdminAgenda from "./admin/AdminAgenda";
// o editor do blog (TipTap) só carrega no admin, para não pesar o site
const AdminBlog = lazy(() => import("./admin/AdminBlog"));
import AdminDiagnosticoAjustes from "./admin/AdminDiagnosticoAjustes";
import AdminAnalytics from "./admin/AdminAnalytics";
import AdminApresentacao from "./admin/AdminApresentacao";
import AdminRoteiro from "./admin/AdminRoteiro";
import AdminServicos from "./admin/AdminServicos";
import AdminEntregaveis from "./admin/AdminEntregaveis";
import AdminDocumento from "./admin/AdminDocumento";
import AdminNamingList from "./admin/AdminNamingList";
import AdminNamingStudy from "./admin/AdminNamingStudy";
import AdminCalendarEditor from "./admin/AdminCalendarEditor";
import ApprovalPage from "./approval/ApprovalPage";
import ClientPortal from "./approval/ClientPortal";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    // a página de case nova cuida da própria rolagem (para a transição de expandir)
    if (/^(\/thomas)?\/projetos\//.test(pathname)) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

// O diagnóstico é uma página estática em public/diagnostico. Se o app do site abrir em
// /diagnostico (link interno ou página guardada em cache), recarrega a versão estática.
function IrParaDiagnostico() {
  const jaTentou = new URLSearchParams(window.location.search).has("r");
  useEffect(() => {
    if (jaTentou) return;
    // ?r=1 muda o endereço, então o navegador não reaproveita a cópia antiga (e não entra em loop)
    const resto = window.location.pathname.replace(/^\/diagnostico\/?/, "");
    const busca = new URLSearchParams(window.location.search);
    busca.set("r", "1");
    window.location.replace(`/diagnostico/${resto}?${busca}${window.location.hash}`);
  }, [jaTentou]);
  return jaTentou ? <HomeNova /> : null;
}

// /home-nova/... (endereço do protótipo) vira o mesmo caminho sem o prefixo
function RedirecionarPrototipo() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`${pathname.replace(/^\/home-nova/, "") || "/"}${search}${hash}`} replace />;
}

// páginas privadas (admin, portal e aprovação do cliente) não entram nas estatísticas
const PRIVADAS = /^\/(admin|aprovar|portal)/;

function Shell() {
  const { pathname } = useLocation();
  useEffect(() => { iniciarAnalytics(); }, []);
  useEffect(() => {
    if (!PRIVADAS.test(pathname)) registrar("pagina", { pagina: pathname });
  }, [pathname]);
  const hideAgencyChrome =
    pathname.startsWith("/thomas") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/aprovar") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/briefing");
  // as páginas novas trazem a própria barra de navegação; só a de privacidade segue no layout antigo
  const chromeAntigo = pathname.startsWith("/privacidade");

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between selection:bg-black selection:text-white font-sans w-full max-w-full">
      {!hideAgencyChrome && chromeAntigo && <Navbar />}
      <main className="flex-grow w-full max-w-full">
        <Routes>
          <Route path="/" element={<HomeNova />} />
          <Route path="/projetos/:slug" element={<CaseNovo />} />
          <Route path="/estudio" element={<EstudioNovo />} />
          <Route path="/contato" element={<ContatoNovo />} />
          <Route path="/blog" element={<BlogNovo />} />
          <Route path="/blog/:slug" element={<ArtigoNovo />} />
          {/* endereços antigos e do protótipo */}
          <Route path="/sobre" element={<Navigate to="/estudio" replace />} />
          <Route path="/home-nova" element={<Navigate to="/" replace />} />
          <Route path="/home-nova/*" element={<RedirecionarPrototipo />} />
          <Route path="/semantix" element={<Navigate to="/projetos/semantix" replace />} />
          <Route path="/site-pronto-pra-partir" element={<Navigate to="/projetos/site-pronto-pra-partir" replace />} />
          <Route path="/site-ppp" element={<Navigate to="/projetos/site-pronto-pra-partir" replace />} />
          <Route path="/highline" element={<Navigate to="/#projetos" replace />} />
          <Route path="/guarana-story" element={<Navigate to="/#projetos" replace />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/thomas" element={<ThomasInicio />} />
          <Route path="/thomas/sobre" element={<ThomasSobreNova />} />
          <Route path="/thomas/projetos/:slug" element={<ThomasCase />} />
          <Route path="/briefing" element={<BrandBriefing />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/clientes/:clientId" element={<AdminClientDetail />} />
          <Route path="/admin/clientes/:clientId/referencias" element={<AdminClientReferences />} />
          <Route path="/admin/briefings" element={<AdminBriefings />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/diagnosticos" element={<AdminDiagnosticos />} />
          <Route path="/admin/agenda" element={<AdminAgenda />} />
          <Route path="/admin/blog" element={<Suspense fallback={null}><AdminBlog /></Suspense>} />
          <Route path="/admin/blog/:id" element={<Suspense fallback={null}><AdminBlog /></Suspense>} />
          <Route path="/admin/diagnosticos/ajustes" element={<AdminDiagnosticoAjustes />} />
          <Route path="/admin/diagnosticos/:id/apresentar" element={<AdminApresentacao />} />
          <Route path="/admin/diagnosticos/:id/roteiro" element={<AdminRoteiro />} />
          <Route path="/admin/diagnosticos/:id/guia" element={<AdminDocumento docFixo="guia-mensagem" />} />
          <Route path="/admin/diagnosticos/:id/guia-marca" element={<AdminDocumento docFixo="guia-marca" />} />
          <Route path="/admin/servicos" element={<AdminServicos />} />
          <Route path="/admin/entregaveis" element={<AdminEntregaveis />} />
          <Route path="/admin/diagnosticos/:id/doc/:docId" element={<AdminDocumento />} />
          <Route path="/admin/naming" element={<AdminNamingList />} />
          <Route path="/admin/naming/:studyId" element={<AdminNamingStudy />} />
          <Route path="/admin/calendarios/:calendarId" element={<AdminCalendarEditor />} />
          <Route path="/aprovar/:token" element={<ApprovalPage />} />
          <Route path="/portal/:clientId" element={<ClientPortal />} />
          <Route path="/aprovacao/:slug" element={<ClientPortal />} />
          <Route path="/aprovacao/:slug/:mes" element={<ApprovalPage />} />
          <Route path="/diagnostico/*" element={<IrParaDiagnostico />} />
          <Route path="*" element={<HomeNova />} />
        </Routes>
      </main>
      {!hideAgencyChrome && (chromeAntigo ? <Footer /> : <RodapeNovo />)}
      {!hideAgencyChrome && (chromeAntigo ? <WhatsAppButton /> : <WhatsAppNovo />)}
      {!PRIVADAS.test(pathname) && <AvisoCookies />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Shell />
    </Router>
  );
}
