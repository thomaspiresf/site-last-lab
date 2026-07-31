import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function PlantaBaixaAnimation() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const TOTAL_FRAMES = 60; // 00000 to 00060 (61 frames total)

  // Check window size for mobile vs desktop adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preload all 61 WebP frames
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = [];

    for (let i = 0; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(5, "0");
      img.src = `/sequencia%20planta%20baixa/PB_${numStr}.webp`;
      
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= TOTAL_FRAMES) {
          setImagesLoaded(true);
        }
      };
      loadedImages.push(img);
    }

    imagesRef.current = loadedImages;
  }, []);

  // Scroll trigger: Section starts tracking as card enters view
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 15%"]
  });

  // Card Y position (subtle shift on mobile, 80px shift on desktop)
  const cardY = useTransform(
    scrollYProgress,
    [0, 0.4],
    [isMobile ? 20 : 80, 0]
  );

  const renderFrame = (index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = imagesRef.current[index];

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw centered with aspect ratio fit
      const hRatio = canvas.width / img.naturalWidth;
      const vRatio = canvas.height / img.naturalHeight;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.naturalWidth * ratio) / 2;
      const centerShiftY = (canvas.height - img.naturalHeight * ratio) / 2;

      ctx.drawImage(
        img,
        0,
        0,
        img.naturalWidth,
        img.naturalHeight,
        centerShiftX,
        centerShiftY,
        img.naturalWidth * ratio,
        img.naturalHeight * ratio
      );
    }
  };

  // Update animation frame: Animation start delayed by 100px (~0.15 scroll progress) on desktop
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Delay start by 100px (~0.15) on desktop
      const desktopDelay = isMobile ? 0 : 0.15;
      const normalized = Math.min(1, Math.max(0, (latest - desktopDelay) / (0.70 - desktopDelay)));
      const frameIndex = Math.min(
        TOTAL_FRAMES,
        Math.max(0, Math.floor(normalized * (TOTAL_FRAMES + 1)))
      );
      renderFrame(frameIndex);
    });

    renderFrame(0);

    return () => unsubscribe();
  }, [scrollYProgress, imagesLoaded, isMobile]);

  return (
    <section ref={containerRef} className="w-full py-8 sm:py-20 -mt-[24px] sm:-mt-[60px] relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 w-full">
        
        {/* Parallax Container */}
        <motion.div
          style={{ y: cardY }}
          className="bg-[#f3f4f9] rounded-[24px] sm:rounded-[28px] p-6 sm:p-12 md:p-14 border border-zinc-200/60 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            {/* Left Column (1/3 width on desktop, compact on mobile): Floor Plan Sequence */}
            <div className="md:col-span-4 lg:col-span-4 w-full max-w-[220px] sm:max-w-none mx-auto aspect-square rounded-[18px] sm:rounded-[20px] overflow-hidden shadow-sm border border-zinc-200/80 bg-white flex items-center justify-center p-3 sm:p-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Right Column (2/3 width on desktop): Title + Introduction Text */}
            <div className="md:col-span-8 lg:col-span-8 text-left space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-black tracking-tight leading-tight">
                Estúdio Independente de Design
              </h2>
              <p className="text-sm sm:text-lg md:text-xl text-zinc-800 font-medium leading-relaxed tracking-tight">
                A Last Lab nasce de uma bagagem de mais de 10 anos desenvolvendo projetos para diversos segmentos. Este portfólio reúne as criações recentes do estúdio e os trabalhos que formam a experiência por trás da marca.
              </p>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
