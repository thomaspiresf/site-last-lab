import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ThomasHeader, ThomasFooter } from "../components/ThomasChrome";
import { experienceCompanies, education, bioParagraphs } from "../data/resume";

function Avatar({ logo, name }) {
  return (
    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200/60">
      <img src={logo} alt={name} className="w-full h-full object-cover" />
    </div>
  );
}

function RoleItem({ role, isLast }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative pl-6">
      {!isLast && <span className="absolute left-[3px] top-3 bottom-[-1.25rem] w-px bg-zinc-200" />}
      <span className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-zinc-300" />

      <p className="font-bold text-black">{role.title}</p>
      <p className="text-sm text-zinc-500 mb-1">{role.period}</p>

      {role.description && (
        <>
          {open && (
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line mb-1 max-w-2xl">
              {role.description}
            </p>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-black hover:underline"
          >
            {open ? "Ver menos" : "Ver mais"}
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </>
      )}
    </div>
  );
}

function CompanyBlock({ item, isLast }) {
  return (
    <div className={`py-8 ${!isLast ? "border-b border-zinc-200" : ""}`}>
      <div className="flex items-center gap-4 mb-6">
        <Avatar logo={item.logo} name={item.company} />
        <div>
          <h3 className="text-xl font-extrabold text-black">{item.company}</h3>
          <p className="text-sm text-zinc-500">{item.duration}</p>
        </div>
      </div>

      <div className="space-y-6 ml-1">
        {item.roles.map((role, idx) => (
          <RoleItem key={role.title + role.period} role={role} isLast={idx === item.roles.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default function ThomasSobre() {
  return (
    <div className="w-full bg-white min-h-screen flex flex-col">
      <ThomasHeader />

      <main className="flex-grow">
        {/* Intro: foto + descritivo */}
        <section className="w-full pt-28 sm:pt-32 pb-12 sm:pb-16 bg-zinc-50">
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
                  <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">Sobre</h1>
                  <p className="text-sm sm:text-base font-medium text-zinc-500">Brand & Product Designer</p>
                </div>
              </div>

              <div className="space-y-4 text-lg sm:text-xl text-zinc-700 leading-relaxed">
                {bioParagraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Experiência */}
        <section className="w-full py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-10"
            >
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-2">Experiência</h2>
              <div>
                {experienceCompanies.map((item, idx) => (
                  <CompanyBlock key={item.company} item={item} isLast={idx === experienceCompanies.length - 1} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Formação Acadêmica */}
        <section className="w-full pb-12 sm:pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-10"
            >
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-6">
                Formação Acadêmica
              </h2>
              <div className="space-y-5">
                {education.map((item, idx) => (
                  <div
                    key={item.school + item.period}
                    className={`flex items-center gap-4 pb-5 ${
                      idx !== education.length - 1 ? "border-b border-zinc-200" : ""
                    }`}
                  >
                    <Avatar logo={item.logo} name={item.school} />
                    <div>
                      <p className="font-bold text-black">{item.school}</p>
                      <p className="text-sm text-zinc-600">{item.course}</p>
                      <p className="text-sm text-zinc-500">{item.period}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full pb-16 sm:pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 text-center">
            <Link
              to="/thomas#projetos"
              className="inline-block px-7 py-3 text-base font-semibold text-black border-[1.5px] border-black rounded-[14px] hover:bg-black hover:text-white transition-all duration-300"
            >
              Veja alguns projetos
            </Link>
          </div>
        </section>
      </main>

      <ThomasFooter />
    </div>
  );
}
