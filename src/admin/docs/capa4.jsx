import React from "react";
import "./capa4.css";

// Capa dos entregáveis no layout definitivo (V4 e os guias): metadados, o grafismo do material,
// o nome do material em destaque e o nome do cliente abaixo.

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const nn = (n) => String(n).padStart(2, "0");

/** O grafismo de cada material (public/images/entregaveis). */
export const GRAFISMO = {
  "guia-editorial": 1, lancamento: 2, "roteiro-comercial": 3, "guia-mensagem": 4,
  "guia-marca": 5, "plano-campanha": 6, "mapa-jornada": 7, manual: 8,
};
export const grafismoDe = (id) => (GRAFISMO[id] ? `/images/entregaveis/grafismo-${GRAFISMO[id]}.png` : null);

export function CapaGrafismo({ titulo, marca, imagem, n = 1, total = 1, escala, classe = "", tamanho }) {
  const hoje = new Date();
  const cliente = marca || "Sua Empresa";
  return (
    <section className={`capa4 ${classe}`} style={escala ? { zoom: escala } : undefined}>
      <div className="c4-meta">
        <div><p className="r">Documento</p><p>{titulo}</p></div>
        <div><p className="r">Para</p><p>{cliente}</p></div>
        <div><p className="r">Data</p><p>{MESES[hoje.getMonth()]} {hoje.getFullYear()}</p></div>
      </div>
      {imagem && <img className="c4-graf" src={imagem} alt="" crossOrigin="anonymous" />}
      <div className="c4-tit"><h1 style={tamanho ? { fontSize: tamanho } : undefined}>{titulo}</h1><p>{cliente}</p></div>
      <img className="c4-logo" src="/images/logo.png" alt="Last Lab" />
      <p className="c4-pag">{nn(n)} / {nn(total)}</p>
    </section>
  );
}
