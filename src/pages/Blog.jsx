import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { listArtigos, getAdminSession } from "../lib/api";

export function dataArtigo(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export function CartaoArtigo({ artigo }) {
  return (
    <Link to={`/blog/${artigo.slug}`} className="group block">
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 mb-4">
        {artigo.capaUrl && (
          <img
            src={artigo.capaUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
        {!artigo.publicado && <span className="normal-case tracking-normal font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white">Rascunho · só você vê</span>}
        {artigo.serie && <span className="text-[#EF4B3A]">{artigo.serie}</span>}
        {artigo.serie && artigo.publicadoEm && <span>·</span>}
        <span>{dataArtigo(artigo.publicadoEm)}</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-black tracking-tight leading-snug group-hover:text-zinc-600 transition-colors">
        {artigo.titulo}
      </h2>
      {artigo.resumo && <p className="text-zinc-600 mt-2 leading-relaxed line-clamp-3">{artigo.resumo}</p>}
    </Link>
  );
}

export default function Blog() {
  const [artigos, setArtigos] = useState(null);

  useEffect(() => {
    document.title = "Blog | Last Lab";
    // logado no admin, a lista inclui os rascunhos (para ver a prévia antes de publicar)
    getAdminSession()
      .then((sessao) => listArtigos({ publicados: !sessao }))
      .then(setArtigos)
      .catch(() => setArtigos([]));
  }, []);

  return (
    <div className="w-full bg-white pt-32 pb-24">
      <section className="max-w-6xl mx-auto px-6 md:px-12 mb-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-black tracking-tight leading-tight">Blog</h1>
          <p className="text-lg sm:text-xl text-zinc-700 leading-relaxed">
            Marcas olhadas de perto, opinião sobre marca e valor, e o que a gente aprende no dia a dia do estúdio.
          </p>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-12">
        {artigos === null ? (
          <p className="text-zinc-400 text-sm">Carregando...</p>
        ) : artigos.length === 0 ? (
          <p className="text-zinc-500">Os primeiros textos chegam em breve.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {artigos.map((a) => (
              <CartaoArtigo key={a.id} artigo={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
