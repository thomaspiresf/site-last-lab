import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, Send, MessageSquare, Loader2 } from "lucide-react";

export default function ContactForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("https://formsubmit.co/ajax/thomas.pires.f@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          Nome: formData.name,
          Email: formData.email,
          Empresa: formData.company,
          Mensagem: formData.message,
          _subject: `Novo Contato do Site - ${formData.name}`,
          _template: "table",
          _captcha: "false"
        })
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      // Fallback para exibir a tela de sucesso de qualquer forma (com os botões de e-mail/WhatsApp manual)
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const text = `Olá Last Lab! Meu nome é ${formData.name || 'Cliente'}. Empresa/Marca: ${formData.company || 'N/A'}. E-mail: ${formData.email || 'N/A'}. Mensagem: ${formData.message || 'Sem detalhes fornecidos.'}`;
    const url = `https://wa.me/5511999999999?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleEmailRedirect = () => {
    const subject = `Novo Projeto - ${formData.name || 'Contato Last Lab'}`;
    const body = `Nome: ${formData.name}\nE-mail: ${formData.email}\nEmpresa: ${formData.company}\n\nMensagem:\n${formData.message}`;
    window.location.href = `mailto:contato@lastlab.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="w-full bg-zinc-50 p-8 sm:p-12 rounded-[24px] border border-zinc-200 shadow-sm relative overflow-hidden text-black">
      {!submitted ? (
        <>
          {/* Progress Bar */}
          <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden mb-10">
            <div
              className="bg-black h-full transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <form onSubmit={handleNext}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <label className="block text-2xl sm:text-3xl font-extrabold text-black">
                    Como você gostaria de ser chamado(a)?
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Digite seu nome completo"
                    required
                    autoFocus
                    className="w-full bg-white border border-zinc-300 rounded-xl px-5 py-4 text-lg text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <label className="block text-2xl sm:text-3xl font-extrabold text-black">
                    Qual o seu e-mail de contato?
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seuemail@empresa.com"
                    required
                    autoFocus
                    className="w-full bg-white border border-zinc-300 rounded-xl px-5 py-4 text-lg text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <label className="block text-2xl sm:text-3xl font-extrabold text-black">
                    Qual o nome da sua marca ou empresa?
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Ex: Last Lab Studio"
                    required
                    autoFocus
                    className="w-full bg-white border border-zinc-300 rounded-xl px-5 py-4 text-lg text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
                  />
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <label className="block text-2xl sm:text-3xl font-extrabold text-black">
                    Fale um pouco sobre o seu projeto
                  </label>
                  <textarea
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Descreva seu projeto, prazo ou necessidade..."
                    required
                    autoFocus
                    className="w-full bg-white border border-zinc-300 rounded-xl px-5 py-4 text-lg text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none shadow-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex items-center justify-between mt-10">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="text-zinc-600 hover:text-black font-semibold px-4 py-2 transition-colors"
                >
                  Voltar
                </button>
              ) : <div />}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white hover:bg-zinc-800 font-bold rounded-xl transition-all duration-300 shadow-md group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{step === totalSteps ? (isSubmitting ? "Enviando..." : "Enviar Projeto") : "Continuar"}</span>
                {step === totalSteps ? (
                  isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />
                ) : (
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </button>
            </div>
          </form>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 space-y-6"
        >
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-3xl font-extrabold text-black">Mensagem recebida, {formData.name}!</h3>
          <p className="text-zinc-700 text-lg max-w-md mx-auto">
            Obrigado pelo contato. Em breve nossa equipe retornará com o contato para agendar uma conversa.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleEmailRedirect}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <Mail size={18} />
              <span>Abrir no e-mail</span>
            </button>
            <button
              onClick={handleWhatsAppRedirect}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
            >
              <MessageSquare size={18} />
              <span>Enviar via WhatsApp</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
