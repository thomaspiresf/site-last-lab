import React, { useState } from "react";
import { Link } from "react-router-dom";

// Aviso de cookies, só informativo: a medição (GA, Pixel e a própria) já roda desde o primeiro
// acesso. Some depois do "Entendi" (no site e no diagnóstico, que usam a mesma chave).
const CHAVE = "ll-aviso-cookies";

const jaViu = () => { try { return !!localStorage.getItem(CHAVE); } catch { return false; } };

export default function AvisoCookies() {
  const [aberto, setAberto] = useState(() => !jaViu());
  if (!aberto) return null;
  const fechar = () => {
    try { localStorage.setItem(CHAVE, new Date().toISOString()); } catch { /* navegação privada */ }
    setAberto(false);
  };
  return (
    <div role="region" aria-label="Aviso de cookies"
      className="fixed z-40 left-3 bottom-3 sm:left-6 sm:bottom-6 flex items-center gap-3 rounded-full bg-black text-white pl-4 pr-1.5 py-1.5 shadow-lg">
      <p className="text-[12.5px] leading-tight text-zinc-300">
        Usamos cookies. <Link to="/privacidade" className="text-white underline underline-offset-2">Saiba mais</Link>
      </p>
      <button type="button" onClick={fechar}
        className="shrink-0 px-3.5 py-1.5 rounded-full bg-white text-black text-[12.5px] font-semibold hover:bg-zinc-200 transition-colors">
        Entendi
      </button>
    </div>
  );
}
