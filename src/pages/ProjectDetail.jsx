import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProjectCard from "../components/ProjectCard";
import ImpactoVideoAnimation from "../components/ImpactoVideoAnimation";
import { projects } from "../data/projects";

export default function ProjectDetail() {
  const { slug } = useParams();
  const detailSectionRef = useRef(null);

  // Find project by slug or fallback
  const currentSlug = slug || "studio-vzo";
  const project = projects.find((p) => p.slug === currentSlug) || projects[0];

  const [expanded1, setExpanded1] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setExpanded1(false);
  }, [currentSlug]);

  const handleExpandAndScroll = () => {
    setExpanded1(true);
    if (detailSectionRef.current) {
      detailSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const otherProjects = projects.filter((p) => p.slug !== project.slug).slice(0, 3);

  return (
    <div className="w-full bg-white pt-28 pb-20">
      {/* Top Header Info */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3 text-left"
        >
          {/* Category & Project Type Tag (LAST LAB / EXPERIÊNCIA PROFISSIONAL) */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              {project.category}
            </span>
            <span className="text-zinc-300 font-light">•</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200/80">
              {project.typeTag || "LAST LAB"}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-black tracking-tight leading-none">
            {project.title}
          </h1>
          <h2 className="text-xl sm:text-2xl text-zinc-700 font-light max-w-3xl leading-snug pt-2">
            {project.subtitle}
          </h2>
        </motion.div>
      </section>

      {/* 1. Main Hero Media (YouTube Video or Banner Image) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full rounded-[24px] overflow-hidden aspect-[16/9] bg-black relative shadow-sm"
        >
          {project.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${project.youtubeId}?autoplay=0&controls=1&rel=0&modestbranding=1`}
              title={project.title}
              className="w-full h-full border-0 scale-[1.01]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img
              src={project.bannerImage}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </section>

      {/* 2. 3 Top Square Images Grid (top-1, top-2, top-3) */}
      {project.topGrid && project.topGrid.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-10">
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {project.topGrid.map((imgUrl, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="rounded-[14px] sm:rounded-[20px] overflow-hidden aspect-square bg-zinc-100 border border-zinc-200/60 shadow-sm"
              >
                <img
                  src={imgUrl}
                  alt={`${project.title} top ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Section 1: Collapsed & Expanded Copy Section (50% / 50% Grid Split) */}
      <section ref={detailSectionRef} className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-16 scroll-mt-32">
        {!expanded1 ? (
          /* COLLAPSED STATE: 50% / 50% Grid Split */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="hidden lg:block" />
            <div className="space-y-4 text-left">
              <p className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                "{project.quote1 || project.description}"
              </p>
              <button
                onClick={() => setExpanded1(true)}
                className="text-[#0059ff] hover:underline font-semibold text-base block pt-1 focus:outline-none"
              >
                Saiba mais sobre o projeto
              </button>
            </div>
          </div>
        ) : (
          /* EXPANDED STATE: 50% / 50% Equal 2-Column Layout */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start"
          >
            {/* Left Column (50% width): Full Paragraphs & Metadata */}
            <div className="space-y-8 text-left">
              <div className="space-y-6 text-zinc-800 text-base sm:text-lg leading-relaxed font-normal">
                {project.expandDetails?.paragraphs?.map((p, idx) => (
                  <p key={idx}>{p}</p>
                )) || <p>{project.description}</p>}
              </div>

              {/* Blue Link "Visualização de portfólio" */}
              <div className="pt-2">
                <a
                  href="#portfolio"
                  onClick={(e) => {
                    e.preventDefault();
                    setExpanded1(false);
                  }}
                  className="text-[#0059ff] hover:underline font-semibold text-base block"
                >
                  {project.expandDetails?.portfolioLink || "Visualização de portfólio"}
                </a>
              </div>

              {/* Metadata 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-zinc-200 text-sm">
                {/* Left Meta Col */}
                <div className="space-y-4">
                  {project.expandDetails?.client && (
                    <div>
                      <span className="text-zinc-400 font-medium block">Empresa</span>
                      <span className="text-black font-bold text-base">{project.expandDetails.client}</span>
                    </div>
                  )}
                  {project.expandDetails?.sector && (
                    <div>
                      <span className="text-zinc-400 font-medium block">Setor</span>
                      <span className="text-black font-bold text-base">{project.expandDetails.sector}</span>
                    </div>
                  )}
                  {project.expandDetails?.year && (
                    <div>
                      <span className="text-zinc-400 font-medium block">Ano</span>
                      <span className="text-black font-bold text-base">{project.expandDetails.year}</span>
                    </div>
                  )}
                </div>

                {/* Right Meta Col (Team & Partner) */}
                <div className="space-y-4">
                  {project.expandDetails?.team && (
                    <div>
                      <span className="text-zinc-400 font-medium block">Equipe do projeto</span>
                      <span className="text-zinc-800 leading-relaxed block">{project.expandDetails.team}</span>
                    </div>
                  )}
                  {project.expandDetails?.partner && (
                    <div>
                      <span className="text-zinc-400 font-medium block">Parceiro: <span className="text-zinc-800">{project.expandDetails.partner}</span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (50% width): Quote + Stacked Expanded Images */}
            <div className="space-y-6 text-left">
              <p className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                "{project.quote1 || project.description}"
              </p>

              {/* Stacked Expanded Images */}
              {project.expandDetails?.expandImages && (
                <div className="space-y-6 pt-2">
                  {project.expandDetails.expandImages.map((imgUrl, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-100">
                      <img src={imgUrl} alt={`Expanded artwork ${idx + 1}`} className="w-full h-auto object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </section>

      {/* IMPACTO CONQUER Animated Laptop & Mobile Video Sequences (2 col Desktop, 1 col Mobile, Aspect Square, Scroll-Driven) */}
      {project.slug === "impacto-conquer" && (
        <ImpactoVideoAnimation />
      )}

      {/* IMPACTO CONQUER Specific Sequential Gallery Sections */}
      {project.slug === "impacto-conquer" && project.impactoFlow && (
        <div className="space-y-12 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-16">
          {project.impactoFlow.map((item, idx) => {
            if (item.type === "quote2") {
              return (
                <section key={idx} className="w-full my-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                    <div className="hidden lg:block" />
                    <div className="space-y-4 text-left">
                      <p className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                        "{project.quote2}"
                      </p>
                      <button
                        onClick={handleExpandAndScroll}
                        className="text-[#0059ff] hover:underline font-semibold text-base block pt-1 focus:outline-none"
                      >
                        Saiba mais sobre o projeto
                      </button>
                    </div>
                  </div>
                </section>
              );
            }

            if (item.type === "grid2") {
              return (
                <section key={idx} className="w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {item.items.map((subItem, subIdx) => (
                      <div
                        key={subIdx}
                        className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square"
                      >
                        <img
                          src={subItem.src}
                          alt={subItem.alt || `Impacto Conquer detail ${subIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            return (
              <section key={idx} className="w-full">
                <div
                  className={`rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm ${
                    item.aspect || ""
                  }`}
                >
                  <img
                    src={item.src}
                    alt={item.alt || `Impacto Conquer ${idx + 1}`}
                    className={`w-full ${
                      item.aspect ? "h-full object-cover object-center" : "h-auto object-cover"
                    }`}
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}


      {/* STUDIO VZO Specific Gallery Sections */}
      {project.slug === "studio-vzo" && (
        <>
          {project.vzoOutdoor && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.vzoOutdoor} alt="Studio VZO Outdoor" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.vzoPairIconsPhone && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                  <img src={project.vzoPairIconsPhone[0]} alt="Studio VZO Icons" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                  <img src={project.vzoPairIconsPhone[1]} alt="Studio VZO Phone" className="w-full h-full object-cover" />
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* PRONTO PRA PARTIR Specific Gallery Sections */}
      {project.slug === "pronto-pra-partir" && (
        <>
          {project.pppBeyondBasic && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.pppBeyondBasic} alt="PPP Sua viagem muito além do básico" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.pppMockupsTrio && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.pppMockupsTrio} alt="PPP Mockups Trio" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src="/images/ppp/cores.png" alt="PPP Cores" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src="/images/ppp/phone.png" alt="PPP Phone" className="w-full h-full object-cover" />
              </div>
            </div>
          </section>
        </>
      )}

      {/* SEMANTIX Specific Gallery Sections */}
      {project.slug === "semantix" && (
        <>
          {project.vimeoWireframe && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden bg-black aspect-video relative">
                <iframe
                  src={`https://player.vimeo.com/video/${project.vimeoWireframe}?autoplay=1&loop=1&muted=1&controls=0&autopause=0&title=0&byline=0&portrait=0`}
                  className="w-full h-full border-0 pointer-events-none scale-[1.01]"
                  allow="autoplay; fullscreen; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Semantix Wireframe"
                />
              </div>
            </section>
          )}

          <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-[24px] overflow-hidden bg-black aspect-square relative">
                {project.vimeoCores && (
                  <iframe
                    src={`https://player.vimeo.com/video/${project.vimeoCores}?autoplay=1&loop=1&muted=1&controls=0&autopause=0&title=0&byline=0&portrait=0`}
                    className="w-full h-full border-0 pointer-events-none scale-[1.01]"
                    allow="autoplay; fullscreen; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title="Semantix Cores"
                  />
                )}
              </div>
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                <img src="/images/semantix/jukebox.png" alt="Semantix App" className="w-full h-full object-cover" />
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
            <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
              <img src="/images/semantix/spread.png" alt="Semantix Website Spread" className="w-full h-auto object-cover" />
            </div>
          </section>

          {project.vimeoTelas && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden bg-black aspect-video relative">
                <iframe
                  src={`https://player.vimeo.com/video/${project.vimeoTelas}?autoplay=1&loop=1&muted=1&controls=0&autopause=0&title=0&byline=0&portrait=0`}
                  className="w-full h-full border-0 pointer-events-none scale-[1.01]"
                  allow="autoplay; fullscreen; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Semantix Telas"
                />
              </div>
            </section>
          )}
        </>
      )}

      {/* QUARTEIRÃO MÁGICO Specific Gallery Sections */}
      {project.slug === "quarteirao-magico" && (
        <>
          {project.quarteiraoPhones && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.quarteiraoPhones} alt="Quarteirão Mágico Phone Feed" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.quarteiraoBusStop && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.quarteiraoBusStop} alt="Quarteirão Mágico Bus Stop Posters" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.quarteiraoPairGrid && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {project.quarteiraoPairGrid.map((imgUrl, idx) => (
                  <div key={idx} className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                    <img src={imgUrl} alt={`Quarteirão detail ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* UNA Specific Gallery Sections */}
      {project.slug === "una" && (
        <>
          {project.unaMiddle1 && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.unaMiddle1} alt="UNA Circle Seal" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
            <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
              <img src="/images/una/top-1.png" alt="UNA Laptop Presentation" className="w-full h-auto object-cover" />
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                <img src="/images/una/expand-1.avif" alt="UNA Notebook Journaling" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                <img src="/images/una/expand-2.avif" alt="UNA Instagram Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </section>
        </>
      )}

      {/* CONQUER Specific Gallery Sections */}
      {project.slug === "conquer-business-school" && (
        <>
          {project.doritosImage && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.doritosImage} alt="Conquer Doritos Concept" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.transformarImage && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.transformarImage} alt="Conquer Transformar" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                <img src="/images/conquer/youxyou.png" alt="YOU X YOU" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                <img src="/images/conquer/house.png" alt="House drawing" className="w-full h-full object-cover" />
              </div>
            </div>
          </section>
        </>
      )}

      {/* Quote 2 Section: Quote on right (50% / 50% Grid Split) */}
      {project.quote2 && project.slug !== "impacto-conquer" && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="hidden lg:block" />
            <div className="space-y-4 text-left">
              <p className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                "{project.quote2}"
              </p>
              <button
                onClick={handleExpandAndScroll}
                className="text-[#0059ff] hover:underline font-semibold text-base block pt-1 focus:outline-none"
              >
                Saiba mais sobre o projeto
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STUDIO VZO Specific Lower Gallery Sections */}
      {project.slug === "studio-vzo" && (
        <>
          {/* Yellow & Black Duo Card */}
          {project.vzoDuo && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.vzoDuo} alt="Studio VZO Cards Duo" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {/* Black T-Shirt */}
          {project.vzoTshirt && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.vzoTshirt} alt="Studio VZO T-Shirt" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {/* Bento Brandboard Grid */}
          {project.vzoBento && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.vzoBento} alt="Studio VZO Bento Grid" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {/* 2-Column Pair Grid: Color Swatches + Yellow Sand Gradient Art */}
          {project.vzoPairBottom && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                  <img src={project.vzoPairBottom[0]} alt="Studio VZO Color Swatches" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                  <img src={project.vzoPairBottom[1]} alt="Studio VZO Sand Gradient" className="w-full h-full object-cover" />
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* PRONTO PRA PARTIR Specific Lower Gallery Sections */}
      {project.slug === "pronto-pra-partir" && (
        <>
          {project.pppNyGuide && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.pppNyGuide} alt="PPP Nova York Guide" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.pppPosterWall && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.pppPosterWall} alt="PPP Poster Wall" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.pppLaptopChair && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.pppLaptopChair} alt="PPP Laptop Chair" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.pppPairBottom && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {project.pppPairBottom.map((imgUrl, idx) => (
                  <div key={idx} className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm aspect-square">
                    <img src={imgUrl} alt={`PPP detail ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* SEMANTIX Specific Lower Gallery Sections */}
      {project.slug === "semantix" && (
        <>
          {project.vimeoPalavras && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden bg-black aspect-video relative">
                <iframe
                  src={`https://player.vimeo.com/video/${project.vimeoPalavras}?autoplay=1&loop=1&muted=1&controls=0&autopause=0&title=0&byline=0&portrait=0`}
                  className="w-full h-full border-0 pointer-events-none scale-[1.01]"
                  allow="autoplay; fullscreen; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Semantix Palavras"
                />
              </div>
            </section>
          )}

          {project.semantixRocks && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.semantixRocks} alt="Semantix Laptop on Rocks" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.vimeoCards && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-20">
              <div className="rounded-[24px] overflow-hidden bg-black aspect-video relative">
                <iframe
                  src={`https://player.vimeo.com/video/${project.vimeoCards}?autoplay=1&loop=1&muted=1&controls=0&autopause=0&title=0&byline=0&portrait=0`}
                  className="w-full h-full border-0 pointer-events-none scale-[1.01]"
                  allow="autoplay; fullscreen; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Semantix Cards"
                />
              </div>
            </section>
          )}
        </>
      )}

      {/* QUARTEIRÃO MÁGICO Specific Lower Gallery Sections */}
      {project.slug === "quarteirao-magico" && (
        <>
          {project.quarteiraoYellowWall && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.quarteiraoYellowWall} alt="Quarteirão Mágico Yellow Wall" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.quarteiraoTshirt && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.quarteiraoTshirt} alt="Quarteirão Mágico T-Shirt" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.quarteiraoTypography && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.quarteiraoTypography} alt="Quarteirão Mágico Typography" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {project.quarteiraoIcons && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-20">
              <div className="rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm">
                <img src={project.quarteiraoIcons} alt="Quarteirão Mágico Icons Grid" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}
        </>
      )}

      {/* Recommendations Section ("Conheça mais projetos") */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 border-t border-zinc-200 pt-16">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-black">Conheça mais projetos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {otherProjects.map((p, idx) => (
            <ProjectCard key={p.id} project={p} index={idx} />
          ))}
        </div>
      </section>
    </div>
  );
}
