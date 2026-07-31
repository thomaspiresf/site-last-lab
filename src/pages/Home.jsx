import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "../components/Hero";
import ProjectCard from "../components/ProjectCard";
import PlantaBaixaAnimation from "../components/PlantaBaixaAnimation";
import { projects } from "../data/projects";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = [
    "Todos",
    "Branding",
    "Website",
    "Produto",
    "Evento",
    "Campanhas",
    "Apresentações"
  ];

  const filteredProjects = selectedCategory === "Todos"
    ? projects
    : projects.filter((p) => p.categories && p.categories.includes(selectedCategory));

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <Hero />

      {/* Second Fold Section: Floor Plan Scroll Animation (1/3 image + 2/3 text) */}
      <PlantaBaixaAnimation />

      {/* Cases Section with Category Filters */}
      <section className="w-full py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          
          {/* Category Filter Tabs Bar */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-black text-white shadow-sm scale-[1.02]"
                        : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 hover:text-black"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cases Grid with increased vertical gap */}
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10 sm:gap-y-12 min-h-[400px]"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <ProjectCard project={project} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-16 text-zinc-500 font-medium">
              Nenhum projeto nesta categoria no momento. Em breve novos cases!
            </div>
          )}

        </div>
      </section>

      {/* Mid & Lower Feature Grid (2x2 Cards Grid) */}
      <section className="w-full py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
          {/* Row 1: Box 1 Image Card + Light Gray Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Box 1 Image Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-[24px] overflow-hidden min-h-[320px] sm:min-h-[380px] shadow-sm border border-zinc-200 bg-zinc-100 relative"
            >
              <img
                src="/images/box-1.png"
                alt="Last Lab Graphic Box 1"
                className="w-full h-full object-cover object-center"
              />
            </motion.div>

            {/* Card 2: Light Gray Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#e2e6e7] rounded-[24px] p-8 sm:p-12 md:p-14 flex flex-col justify-center min-h-[320px] sm:min-h-[380px] shadow-sm border border-zinc-300/40"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tight leading-[1.15] mb-6">
                Criamos para marcas que querem evoluir e ir além do óbvio.
              </h2>
              <p className="text-zinc-800 text-base sm:text-lg font-medium leading-relaxed">
                Toda marca tem potencial. Quando a comunicação é bem trabalhada, esse potencial se torna presença e resultado.
              </p>
            </motion.div>
          </div>

          {/* Row 2: Dark CTA Card + Box 2 Photo Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 3: Dark CTA Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-[#141414] text-white rounded-[24px] p-8 sm:p-12 md:p-14 flex flex-col justify-center min-h-[320px] sm:min-h-[380px] shadow-sm border border-zinc-800"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
                Quer desenvolver um projeto?
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base font-normal leading-relaxed mb-8">
                Agende uma conversa com nossa equipe. Estamos prontos para entender sua marca e desenvolver a melhor solução para ela.
              </p>
              <div>
                <Link
                  to="/contato"
                  className="inline-block px-7 py-3 text-base font-medium text-white border-[1.5px] border-white rounded-[12px] hover:bg-white hover:text-black transition-all duration-300 shadow-sm"
                >
                  Agendar conversa
                </Link>
              </div>
            </motion.div>

            {/* Card 4: Box 2 Photo Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-[24px] overflow-hidden min-h-[320px] sm:min-h-[380px] shadow-sm border border-zinc-800 relative bg-zinc-900"
            >
              <img
                src="/images/box-2.png"
                alt="Digital Design Process Box 2"
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
