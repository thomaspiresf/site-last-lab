import { createContext, useContext } from "react";

// Ajustes de cada página feitos no editor: textos fixos (títulos, aberturas, rótulos), visual
// (fundo, cor de destaque, tamanho do título e dos textos). O editor fornece o contexto por página;
// fora dele (modelo nas Entregáveis) tudo fica no padrão.
export const PaginaCtx = createContext(null);

/** O texto fixo, ou o que foi escrito no lugar dele para esta página. Registra o original no editor. */
export function useTexto(original) {
  const c = useContext(PaginaCtx);
  if (!c || typeof original !== "string" || !original) return original;
  c.registrar?.(original);
  const v = c.textos?.[original];
  return v === undefined || v === "" ? original : v;
}

/** O visual da página: { fundo, acento, titulo (px), texto (%) }. */
export function useEstilo() {
  return useContext(PaginaCtx)?.estilo || {};
}
