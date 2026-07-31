import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Hero() {
  const slides = [
    {
      word: "sites & landing pages.",
      image: "/images/banner-ppp-home.avif"
    },
    {
      word: "branding.",
      image: "/images/banner-una-home.avif"
    },
    {
      word: "apresentações.",
      image: "/images/hero-2.png"
    },
    {
      word: "campanhas on & offline.",
      image: "/images/banner-conquer-home.avif"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 1400);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[currentIndex];

  return (
    <section className="w-full bg-white pt-28 sm:pt-32 pb-2 sm:pb-6 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 w-full overflow-hidden">
        {/* Main Hero Card Container matching mobile screenshot aspect & vertical spacing */}
        <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden min-h-[540px] sm:min-h-[460px] md:min-h-[520px] aspect-auto sm:aspect-[2.1/1] shadow-sm flex items-center w-full max-w-full">
          
          {/* Instantaneous Hard Image Swap (No Fade Transition) */}
          <img
            key={currentSlide.image}
            src={currentSlide.image}
            alt="Last Lab Showcase"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Overlaid Content Block (Left Side) */}
          <div className="relative z-10 p-6 sm:p-12 md:p-14 max-w-2xl w-full space-y-5 sm:space-y-6">
            <h1 className="text-[26px] xs:text-[28px] sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.08] text-left break-words">
              Design que<br />
              <span className="sm:whitespace-nowrap">organiza, conecta</span><br />
              & comunica.
            </h1>

            <div className="text-sm sm:text-lg font-medium text-zinc-900 leading-snug space-y-1 text-left max-w-full">
              <p>Para sua marca ganhar força,</p>
              <div className="flex flex-wrap items-baseline gap-x-1.5 max-w-full">
                <span>consistência e presença em</span>
                <span className="inline-flex relative overflow-hidden align-baseline">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentSlide.word}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="text-black font-bold whitespace-nowrap inline-block"
                    >
                      {currentSlide.word}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
            </div>

            <div className="pt-2 text-left">
              <Link
                to="/sobre"
                className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-black border-[1.5px] border-black rounded-[14px] bg-transparent hover:bg-black hover:text-white transition-all duration-300 shadow-sm"
              >
                Como fazemos?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
