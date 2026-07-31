import React from "react";
import { motion } from "framer-motion";
import ContactForm from "../components/ContactForm";

export default function Contact() {
  return (
    <div className="w-full bg-white pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left mb-12 space-y-4"
        >
          <h1 className="text-4xl sm:text-6xl font-extrabold text-black tracking-tight leading-tight">
            Vamos falar sobre seu projeto.
          </h1>
          <p className="text-xl text-zinc-700 leading-relaxed">
            Preencha o formulário para agendarmos uma conversa e entender seus objetivos. Se preferir, escreva diretamente para{" "}
            <a
              href="mailto:contato@lastlab.com.br"
              className="text-black font-bold underline hover:text-zinc-700 transition-colors"
            >
              contato@lastlab.com.br
            </a>
          </p>
        </motion.div>

        {/* Contact Form */}
        <div className="w-full">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
