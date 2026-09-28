import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Building2,
  Sparkles,
  Briefcase,
  Users,
  Award,
  Heart,
  Palette,
  Eye,
  Paintbrush,
  Star,
  PlusCircle,
  Ban,
  MessageSquare,
  Check,
  Pencil,
  ChevronLeft,
  ArrowRight,
  Loader2,
  Rocket,
  ClipboardCheck,
  Wand2,
  FileImage,
  Sliders,
  PackageCheck,
} from "lucide-react";
import { submitBrandBrief } from "../lib/api";

const STEPS = [
  {
    key: "name",
    icon: User,
    label: "Bora começar!",
    question: "Qual o seu nome?",
    type: "text",
    placeholder: "Seu nome",
    required: true,
  },
  {
    key: "email",
    icon: Mail,
    label: "Conhecendo você...",
    question: "Qual o seu melhor e-mail?",
    type: "email",
    placeholder: "seunome@email.com",
    required: true,
  },
  {
    key: "phone",
    icon: Phone,
    label: "Entendendo sua visão...",
    question: "Quer deixar um telefone de contato?",
    subtitle: "Opcional, mas ajuda no atendimento",
    type: "tel",
    placeholder: "(11) 99999-9999",
  },
  {
    key: "businessStage",
    icon: Building2,
    label: "Estamos conhecendo sua marca...",
    question: "Você já tem uma empresa ou está começando do zero?",
    type: "single-select",
    required: true,
    options: [
      { value: "tem_empresa", label: "Já tenho uma empresa" },
      { value: "comecando", label: "Estou começando agora" },
      { value: "nao_sei", label: "Ainda não sei direito" },
    ],
  },
  {
    key: "brandName",
    icon: Sparkles,
    label: "Descobrindo sua essência...",
    question: "Qual o nome da sua marca?",
    type: "text",
    placeholder: "Nome da marca (ou \"ainda não tenho\")",
  },
  {
    key: "activity",
    icon: Briefcase,
    label: "Definindo seu estilo...",
    question: "O que você faz ou pretende fazer com a marca?",
    type: "textarea",
    placeholder: "Conte um pouco sobre o produto, serviço ou ideia...",
    required: true,
  },
  {
    key: "targetAudience",
    icon: Users,
    label: "Moldando sua identidade...",
    question: "Quem é o seu público?",
    type: "textarea",
    placeholder: "Ex: Mulheres de 25 a 40 anos / Jovens urbanos / Famílias...",
    required: true,
  },
  {
    key: "differentiators",
    icon: Award,
    label: "Capturando sua personalidade...",
    question: "O que torna seu serviço ou produto diferente da concorrência?",
    type: "textarea",
    placeholder: "Ex: Atendimento exclusivo, entrega rápida, produção artesanal...",
  },
  {
    key: "desiredFeelings",
    icon: Heart,
    label: "Refinando os detalhes...",
    question: "Quais sensações e mensagens você deseja transmitir com sua identidade visual?",
    type: "textarea",
    placeholder: "Ex: Confiança, leveza, exclusividade...",
  },
  {
    key: "styleAdjectives",
    icon: Palette,
    label: "Refinando os detalhes...",
    question: "Quais adjetivos melhor descrevem o estilo da sua marca?",
    subtitle: "Escolha no máximo 3",
    type: "multi-select",
    maxSelect: 3,
    required: true,
    options: [
      "Elegante",
      "Moderna",
      "Divertida",
      "Minimalista",
      "Sofisticada",
      "Rústica",
      "Criativa",
      "Acolhedora",
      "Jovial",
      "Tradicional",
      "Feminina",
      "Masculina",
      "Neutra",
    ],
  },
  {
    key: "visualStyles",
    icon: Eye,
    label: "Quase lá!",
    question: "Qual estilo combina mais com a identidade que você imagina?",
    subtitle: "Pode escolher mais de um",
    type: "multi-select",
    required: true,
    options: ["Moderno", "Minimalista", "Divertido", "Sofisticado", "Rústico", "Outro"],
  },
  {
    key: "colorPreferences",
    icon: Paintbrush,
    label: "Finalizando...",
    question: "Possui alguma preferência de cor para a identidade visual? Se sim, qual?",
    type: "textarea",
    placeholder: "Ex: Azul e branco, tons terrosos, sem preferência...",
  },
  {
    key: "admiredBrands",
    icon: Star,
    label: "Última pergunta!",
    question: "Tem alguma marca que você admira pelo estilo ou comunicação?",
    type: "textarea",
    placeholder: "Ex: Nubank, Netflix, Natura...",
  },
  {
    key: "desiredElements",
    icon: PlusCircle,
    label: "Preparando a magia...",
    question: "Tem algo em mente que queira que esteja presente na identidade visual?",
    type: "textarea",
    placeholder: "Ex: Um símbolo, algo relacionado à natureza, um elemento feminino...",
  },
  {
    key: "avoidElements",
    icon: Ban,
    label: "Quase pronto...",
    question: "E o que você não quer de jeito nenhum na sua identidade visual?",
    type: "textarea",
    placeholder: "Ex: Nada muito sério / Não gosto da cor amarela / Nada cursivo",
  },
  {
    key: "extraInfo",
    icon: MessageSquare,
    label: "Última etapa!",
    question: "Algo mais que você queira contar?",
    subtitle: "Campo opcional para informações extras",
    type: "textarea",
    placeholder: "Ex: Tenho pressa para lançar / Preciso de cartão de visita também / Qualquer coisa que ache importante...",
  },
];

const REVIEW_SECTIONS = [
  {
    title: "Contato",
    icon: User,
    fields: [
      { key: "name", label: "Nome" },
      { key: "email", label: "E-mail" },
      { key: "phone", label: "Telefone", optional: true },
    ],
  },
  {
    title: "Empresa",
    icon: Building2,
    fields: [
      { key: "businessStage", label: "Situação" },
      { key: "brandName", label: "Nome da marca" },
      { key: "activity", label: "Atividade" },
    ],
  },
  {
    title: "Público e Posicionamento",
    icon: Users,
    fields: [
      { key: "targetAudience", label: "Público-alvo" },
      { key: "differentiators", label: "Diferenciais" },
      { key: "desiredFeelings", label: "Sensações desejadas" },
    ],
  },
  {
    title: "Identidade Visual",
    icon: Palette,
    fields: [
      { key: "styleAdjectives", label: "Adjetivos" },
      { key: "visualStyles", label: "Estilos visuais" },
      { key: "colorPreferences", label: "Cores preferidas" },
      { key: "admiredBrands", label: "Marcas de referência" },
    ],
  },
  {
    title: "Elementos e Observações",
    icon: MessageSquare,
    fields: [
      { key: "desiredElements", label: "Elementos desejados" },
      { key: "avoidElements", label: "O que evitar" },
      { key: "extraInfo", label: "Informações extras", optional: true },
    ],
  },
];

const BUSINESS_STAGE_LABEL = {
  tem_empresa: "Já tenho uma empresa",
  comecando: "Estou começando agora",
  nao_sei: "Ainda não sei direito",
};

const ROADMAP = [
  {
    icon: ClipboardCheck,
    title: "Briefing enviado",
    description: "Suas informações foram recebidas com sucesso!",
    done: true,
  },
  {
    icon: Sliders,
    title: "Análise do briefing",
    description: "Vamos estudar seu mercado, entender suas referências e tudo que você compartilhou com a gente.",
  },
  {
    icon: Wand2,
    title: "Criação do conceito visual",
    description: "Desenvolvemos o posicionamento e o estilo base da sua identidade.",
  },
  {
    icon: FileImage,
    title: "Propostas visuais iniciais",
    description: "Mostramos uma prévia da identidade criada com base nas suas respostas. Vamos alinhar juntos antes de seguir para os ajustes finais.",
  },
  {
    icon: Sparkles,
    title: "Ajustes e refinamentos",
    description: "Com seu feedback, faremos os ajustes necessários para garantir que fique do seu jeito.",
  },
  {
    icon: PackageCheck,
    title: "Entrega final",
    description: "Entregamos todos os arquivos organizados e prontos para uso (logotipo, cores, fontes e manual de aplicação).",
  },
];

function formatValue(key, value) {
  if (value == null || value === "") return "—";
  if (key === "businessStage") return BUSINESS_STAGE_LABEL[value] || value;
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return value;
}

function isFilled(step, answers) {
  const value = answers[step.key];
  if (step.type === "multi-select") return Array.isArray(value) && value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function canAdvance(step, answers) {
  if (!step.required) return true;
  return isFilled(step, answers);
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

function ProgressHeader({ percent, label }) {
  return (
    <div className="border-b border-zinc-100">
      <div className="max-w-2xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden">
            <img src="/images/logo.png" alt="" className="h-4 w-4 object-contain" />
          </div>
          <span className="text-sm font-semibold text-zinc-500">{percent}%</span>
        </div>
        <span className="text-sm font-medium text-zinc-500">{label}</span>
      </div>
      <div className="h-1.5 bg-zinc-100">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400"
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function IntroScreen({ onStart }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full text-center space-y-6"
      >
        <div className="w-24 h-24 rounded-full bg-white shadow-sm mx-auto flex items-center justify-center">
          <img src="/images/logo.png" alt="Last Lab" className="h-10 w-10 object-contain" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-tight">
          Vamos dar vida à sua marca?
        </h1>
        <p className="text-lg text-zinc-600 leading-relaxed">
          Responda algumas perguntas rápidas para entendermos seu estilo, suas ideias e seus objetivos. 🚀
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-black text-white text-base font-semibold hover:bg-zinc-800 transition-colors"
        >
          Começar agora
        </button>
      </motion.div>
    </div>
  );
}

function QuestionScreen({ step, value, onChange, onNext, onBack, showBack, canGoNext, submitLabel }) {
  const Icon = step.icon;
  const isTextInput = step.type === "text" || step.type === "email" || step.type === "tel";

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && canGoNext) {
      e.preventDefault();
      onNext();
    }
  };

  const toggleMulti = (option) => {
    const current = Array.isArray(value) ? value : [];
    const already = current.includes(option);
    if (already) {
      onChange(current.filter((v) => v !== option));
      return;
    }
    if (step.maxSelect && current.length >= step.maxSelect) return;
    onChange([...current, option]);
  };

  return (
    <div className="flex-1 flex items-start justify-center px-6 pt-16 pb-32">
      <motion.div
        key={step.key}
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-xl w-full text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto">
          <Icon size={26} />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-snug">
            {step.question}
          </h2>
          {step.subtitle && <p className="text-sm text-zinc-500 mt-2">{step.subtitle}</p>}
        </div>

        {isTextInput && (
          <input
            autoFocus
            type={step.type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={step.placeholder}
            className="w-full px-4 py-3.5 rounded-[10px] border border-zinc-300 text-base text-center focus:outline-none focus:ring-2 focus:ring-black/80"
          />
        )}

        {step.type === "textarea" && (
          <textarea
            autoFocus
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={step.placeholder}
            rows={4}
            className="w-full px-4 py-3.5 rounded-[10px] border border-zinc-300 text-base focus:outline-none focus:ring-2 focus:ring-black/80 resize-none"
          />
        )}

        {step.type === "single-select" && (
          <div className="space-y-3">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`w-full px-5 py-4 rounded-[10px] border text-left text-base font-medium transition-colors ${
                  value === opt.value
                    ? "border-black bg-zinc-50 text-black"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step.type === "multi-select" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {step.options.map((opt) => {
                const selected = Array.isArray(value) && value.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMulti(opt)}
                    className={`px-4 py-4 rounded-[10px] border text-base font-medium transition-colors ${
                      selected
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {step.maxSelect && (
              <p className="text-xs text-zinc-400">
                {(Array.isArray(value) ? value.length : 0)}/{step.maxSelect} selecionados
              </p>
            )}
          </>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            {submitLabel || "Continuar"}
            <ArrowRight size={15} />
          </button>
          {!step.required && !submitLabel && (
            <button
              type="button"
              onClick={onNext}
              className="text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Pular
            </button>
          )}
        </div>
      </motion.div>

      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="fixed bottom-6 left-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-black transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
      )}
    </div>
  );
}

function ReviewScreen({ answers, onEdit, onSubmit, onBack, submitting, error }) {
  return (
    <div className="flex-1 flex items-start justify-center px-6 pt-16 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-lg w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto">
            <img src="/images/logo.png" alt="" className="h-7 w-7 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-black tracking-tight">Revisão do Briefing</h1>
          <p className="text-sm text-zinc-500">Confira suas respostas antes de enviar</p>
        </div>

        <div className="space-y-6">
          {REVIEW_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">
                <section.icon size={13} />
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-start justify-between gap-3 px-4 py-3 rounded-[10px] border border-zinc-200"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                        {field.label}
                        {field.optional && (
                          <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                            opcional
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-zinc-800 mt-0.5 whitespace-pre-wrap break-words">
                        {formatValue(field.key, answers[field.key])}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEdit(field.key)}
                      className="shrink-0 text-zinc-400 hover:text-black transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-black transition-colors"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            {submitting ? "Enviando..." : "Enviar Briefing"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div className="flex-1 flex items-start justify-center px-6 pt-16 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        <div>
          <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4">
            <Rocket size={26} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Briefing enviado!</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Recebemos suas respostas e já começamos a dar vida à sua identidade visual. Confira abaixo as próximas
            etapas do processo:
          </p>
        </div>

        <div className="text-left space-y-0">
          {ROADMAP.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    step.done ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {step.done ? <Check size={16} /> : <step.icon size={16} />}
                </div>
                {i < ROADMAP.length - 1 && <div className="w-px flex-1 bg-zinc-200 my-1" />}
              </div>
              <div className="pb-6">
                <p className={`text-sm font-bold ${step.done ? "text-emerald-600" : "text-black"}`}>{step.title}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-zinc-400 border-t border-zinc-100 pt-6">
          Agradecemos a confiança no nosso trabalho. Em breve, entraremos em contato para dar andamento à criação da
          sua nova identidade!
        </p>
      </motion.div>
    </div>
  );
}

export default function BrandBriefing() {
  const [phase, setPhase] = useState("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [editingFromReview, setEditingFromReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const step = STEPS[stepIndex];

  const setAnswer = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (editingFromReview) {
      setEditingFromReview(false);
      setPhase("review");
      return;
    }
    if (stepIndex === STEPS.length - 1) {
      setPhase("review");
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (editingFromReview) {
      setEditingFromReview(false);
      setPhase("review");
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleEditFromReview = (key) => {
    const index = STEPS.findIndex((s) => s.key === key);
    if (index === -1) return;
    setStepIndex(index);
    setEditingFromReview(true);
    setPhase("form");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitBrandBrief(answers);
      setPhase("success");
    } catch (err) {
      setError(err.message || "Erro ao enviar o briefing. Tente novamente.");
    }
    setSubmitting(false);
  };

  if (phase === "intro") {
    return <IntroScreen onStart={() => setPhase("form")} />;
  }

  if (phase === "success") {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col">
        <SuccessScreen />
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col">
        <ReviewScreen
          answers={answers}
          onEdit={handleEditFromReview}
          onSubmit={handleSubmit}
          onBack={() => {
            setStepIndex(STEPS.length - 1);
            setPhase("form");
          }}
          submitting={submitting}
          error={error}
        />
      </div>
    );
  }

  const percent = Math.round((stepIndex / (STEPS.length - 1)) * 100);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <ProgressHeader percent={percent} label={step.label} />
      <AnimatePresence mode="wait">
        <QuestionScreen
          key={step.key}
          step={step}
          value={answers[step.key]}
          onChange={(value) => setAnswer(step.key, value)}
          onNext={handleNext}
          onBack={handleBack}
          showBack={stepIndex > 0 || editingFromReview}
          canGoNext={canAdvance(step, answers)}
          submitLabel={editingFromReview ? "Salvar e voltar" : undefined}
        />
      </AnimatePresence>
    </div>
  );
}
