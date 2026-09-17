import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProjectDetail from "./pages/ProjectDetail";
import Thomas from "./pages/Thomas";
import ThomasSobre from "./pages/ThomasSobre";
import ThomasProjectDetail from "./pages/ThomasProjectDetail";
import WhatsAppButton from "./components/WhatsAppButton";

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
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const hideAgencyChrome = pathname.startsWith("/thomas");

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between selection:bg-black selection:text-white font-sans w-full max-w-full">
      {!hideAgencyChrome && <Navbar />}
      <main className="flex-grow w-full max-w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/thomas" element={<Thomas />} />
          <Route path="/thomas/sobre" element={<ThomasSobre />} />
          <Route path="/thomas/projetos/:slug" element={<ThomasProjectDetail />} />
          <Route path="/projetos/:slug" element={<ProjectDetail />} />
          {/* Direct routes for legacy slug URLs */}
          <Route path="/semantix" element={<ProjectDetail />} />
          <Route path="/site-pronto-pra-partir" element={<ProjectDetail />} />
          <Route path="/site-ppp" element={<ProjectDetail />} />
          <Route path="/highline" element={<ProjectDetail />} />
          <Route path="/guarana-story" element={<ProjectDetail />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!hideAgencyChrome && <Footer />}
      {!hideAgencyChrome && <WhatsAppButton />}
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
