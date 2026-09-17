import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Download } from "lucide-react";

export const EMAIL = "thomas.pires.f@gmail.com";
export const LINKEDIN_URL = "https://www.linkedin.com/in/thom%C3%A1s-pires-40a602b6/";
export const CV_PATH = "/curriculo-thomas-pires.pdf";

export function ThomasHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Projetos", to: "/thomas#projetos" },
    { name: "Sobre", to: "/thomas/sobre" },
    { name: "Contato", to: "/thomas#contato" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md py-4 border-b border-zinc-100 shadow-sm"
          : "bg-white py-6"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between">
        <Link to="/thomas" className="text-lg sm:text-xl font-black tracking-tight text-black">
          Thomás Pires
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              className="text-sm sm:text-base font-medium text-zinc-700 hover:text-black transition-colors duration-200"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <a
          href={CV_PATH}
          download
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-black rounded-[12px] hover:bg-zinc-800 transition-all duration-300 shadow-sm"
        >
          <Download size={16} />
          Currículo
        </a>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-zinc-900 p-2 focus:outline-none"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-6 py-6 space-y-4 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-lg font-medium py-2 px-3 rounded-lg text-zinc-600 hover:bg-zinc-50 hover:text-black transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <a
            href={CV_PATH}
            download
            className="flex items-center gap-2 text-lg font-medium py-2 px-3 rounded-lg bg-black text-white"
          >
            <Download size={18} />
            Baixar currículo
          </a>
        </div>
      )}
    </header>
  );
}

export function ThomasFooter() {
  return (
    <footer className="w-full bg-[#141414] py-8 px-6 md:px-12 text-zinc-300">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium">
        <p className="text-zinc-400">© Thomás Pires. {new Date().getFullYear()}</p>
        <div className="flex items-center gap-5">
          <a href={`mailto:${EMAIL}`} className="text-white hover:underline transition-colors">
            {EMAIL}
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
