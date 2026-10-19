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
      className="fixed z-40 left-3 right-20 bottom-3 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-sm rounded-2xl bg-black text-white px-4 py-3.5 shadow-lg">
      <p className="text-[13px] leading-snug text-zinc-300">
        Usamos cookies e ferramentas de medição (Google Analytics e Pixel da Meta) para entender as visitas e melhorar
        nossas campanhas. <Link to="/privacidade" className="text-white underline underline-offset-2">Política de privacidade</Link>
      </p>
      <button type="button" onClick={fechar}
        className="mt-2.5 px-4 py-1.5 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-zinc-200 transition-colors">
        Entendi
      </button>
    </div>
  );
}
