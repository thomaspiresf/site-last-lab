import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Link2, Mail } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projects";
import { bioParagraphs } from "../data/resume";
import { ThomasHeader, ThomasFooter, EMAIL, LINKEDIN_URL, CV_PATH } from "../components/ThomasChrome";

function ThomasProjects() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = ["Todos", "Branding", "Website", "Produto", "Evento", "Campanhas", "Apresentações"];

  const filteredProjects =
    selectedCategory === "Todos"
      ? projects
      : projects.filter((p) => p.categories && p.categories.includes(selectedCategory));

  return (
    <section id="projetos" className="w-full pt-28 sm:pt-32 pb-8 sm:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-2">Projetos</h2>
          <p className="text-zinc-600 text-base sm:text-lg">
            Uma seleção de trabalhos em branding, sites e produtos digitais.
          </p>
        </div>

        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none justify-start">
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
                <ProjectCard
                  project={project}
                  index={index}
                  showTag={false}
                  linkPrefix="/thomas/projetos"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-zinc-500 font-medium">
            Nenhum projeto nesta categoria no momento.
          </div>
        )}
      </div>
    </section>
  );
}

function ThomasAbout() {
  return (
    <section id="sobre" className="w-full py-12 sm:py-16 bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 sm:gap-5 mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 border border-zinc-200/80 shadow-sm">
              <img
                src="/images/thomas-avatar.png"
                alt="Thomás Pires"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight">Sobre mim</h2>
              <p className="text-sm sm:text-base font-medium text-zinc-500">Brand & Product Designer</p>
            </div>
          </div>

          <div className="space-y-4 text-lg sm:text-xl text-zinc-700 leading-relaxed">
            {bioParagraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-6">
            <Link
              to="/thomas/sobre"
              className="inline-block px-6 py-3 text-[15px] sm:text-base font-semibold text-white bg-black rounded-[14px] hover:bg-zinc-800 transition-all duration-300 shadow-sm"
            >
              Ver mais
            </Link>
            <a
              href={CV_PATH}
              download
              className="inline-flex items-center gap-2 px-6 py-3 text-[15px] sm:text-base font-semibold text-black border-[1.5px] border-black rounded-[14px] bg-transparent hover:bg-black hover:text-white transition-all duration-300"
            >
              <Download size={17} />
              Currículo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThomasContact() {
  return (
    <section id="contato" className="w-full py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-[#141414] text-white rounded-[28px] p-8 sm:p-14 md:p-16 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Vamos conversar?
          </h2>
          <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Aberto a novas oportunidades em design de marca e produto. Entre em contato por qualquer um dos
            canais abaixo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-black bg-white rounded-[12px] hover:bg-zinc-200 transition-all duration-300 shadow-sm"
            >
              <Mail size={18} />
              {EMAIL}
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white border-[1.5px] border-white rounded-[12px] hover:bg-white hover:text-black transition-all duration-300"
            >
              <Link2 size={18} />
              LinkedIn
            </a>
            <a
              href={CV_PATH}
              download
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white border-[1.5px] border-white rounded-[12px] hover:bg-white hover:text-black transition-all duration-300"
            >
              <Download size={18} />
              Currículo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Thomas() {
  return (
    <div id="topo" className="w-full bg-white min-h-screen flex flex-col">
      <ThomasHeader />
      <main className="flex-grow">
        <ThomasProjects />
        <ThomasAbout />
        <ThomasContact />
      </main>
      <ThomasFooter />
    </div>
  );
}
