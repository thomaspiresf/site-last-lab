import { getCatalogoServicos } from "../lib/api";
import { aplicarCatalogo } from "./catalogoOfertas";

// Busca o catálogo editado e aplica por cima do padrão. Uma vez por sessão, a não ser que peça de novo.
let carregando = null;
export function carregarCatalogo(forcar = false) {
  if (!carregando || forcar) {
    carregando = getCatalogoServicos()
      .then(({ dados }) => aplicarCatalogo(dados))
      .catch(() => {}); // sem catálogo editado: segue com o padrão do código
  }
  return carregando;
}
