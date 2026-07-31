import React from "react";
import { motion } from "framer-motion";
import ProjectCard from "../components/ProjectCard";
import { projects, methodSteps } from "../data/projects";

export default function About() {
  const featuredProjects = projects.slice(0, 3);

  return (
    <div className="w-full bg-white pt-32 pb-20">
      {/* Header Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl space-y-6"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-black tracking-tight leading-tight">
            Design com método.
          </h1>
          <h2 className="text-2xl sm:text-3xl text-zinc-700 font-semibold">
            Porque clareza não acontece por acaso.
          </h2>

          <div className="pt-4 text-lg sm:text-xl text-zinc-800 leading-relaxed space-y-3 max-w-3xl">
            <p className="font-bold text-black text-xl sm:text-2xl">
              Ouvir. Direcionar. Aplicar.
            </p>
            <p className="text-zinc-700">
              O <strong className="text-black font-semibold">Método BASE</strong> estrutura projetos de design em diferentes formatos: branding, apresentações, social media, campanhas e digital, partindo sempre do mesmo princípio: entendimento real, direção clara e soluções visuais que funcionam.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Main Header Banner Image */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 mb-20">
        <div className="w-full rounded-3xl overflow-hidden aspect-[21/9] bg-zinc-100 border border-zinc-200 shadow-sm">
          <img
            src="/images/sobre-banner.png"
            alt="Design com método - Last Lab"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Método BASE Step Cards */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 mb-24 space-y-12">
        {methodSteps.map((step, idx) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12 p-8 sm:p-10 rounded-3xl bg-zinc-50 border border-zinc-200/80 shadow-sm"
          >
            <div className="w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0 rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-sm">
              <img
                src={step.image}
                alt={step.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3 text-left">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
                {step.number}. {step.title}
              </h3>
              <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Projects Selection */}
      <section className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-black">
            Veja alguns projetos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProjects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>
      </section>
    </div>
  );
}
