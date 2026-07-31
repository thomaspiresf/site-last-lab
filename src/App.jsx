import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProjectDetail from "./pages/ProjectDetail";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between selection:bg-black selection:text-white font-sans w-full max-w-full">
        <Navbar />
        <main className="flex-grow w-full max-w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/projetos/:slug" element={<ProjectDetail />} />
            {/* Direct routes for legacy slug URLs */}
            <Route path="/semantix" element={<ProjectDetail />} />
            <Route path="/highline" element={<ProjectDetail />} />
            <Route path="/guarana-story" element={<ProjectDetail />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
