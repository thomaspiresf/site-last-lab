import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function ProjectCard({ project, index }) {
  const hasHoverImage = project.hoverImage && project.hoverImage !== project.coverImage;

  const displayTag = project.typeTag === "LAST LAB" 
    ? "Projeto Last Lab" 
    : "Experiência profissional";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="w-full"
    >
      <Link
        to={`/projetos/${project.slug}`}
        className="group block space-y-3"
      >
        {/* Square Cover Image Container */}
        <div className="relative overflow-hidden rounded-[24px] bg-zinc-100 border border-zinc-200/60 shadow-sm transition-all duration-300 group-hover:shadow-xl aspect-square">
          {/* Default Image */}
          <img
            src={project.coverImage}
            alt={project.title}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-in-out ${
              project.coverClass || ""
            } ${
              hasHoverImage ? "group-hover:opacity-0" : ""
            }`}
            loading="lazy"
          />

          {/* Hover Click Image (Appears smoothly on mouseover) */}
          {hasHoverImage && (
            <img
              src={project.hoverImage}
              alt={`${project.title} hover`}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"
              loading="lazy"
            />
          )}
        </div>

        {/* Title & Tag Block Below Image */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <h3 className="text-base sm:text-lg font-bold text-black tracking-tight group-hover:text-zinc-600 transition-colors">
            {project.title}
          </h3>
          <span className="text-xs sm:text-sm font-medium text-zinc-500 tracking-tight">
            {displayTag}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
