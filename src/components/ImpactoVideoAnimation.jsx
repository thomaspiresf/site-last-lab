import React, { useEffect, useRef, useState } from "react";
import { useScroll } from "framer-motion";

export default function ImpactoVideoAnimation() {
  const cardsRef = useRef(null);
  const canvasLaptopRef = useRef(null);
  const canvasMobileRef = useRef(null);

  const laptopImagesRef = useRef([]);
  const mobileImagesRef = useRef([]);

  const [laptopLoaded, setLaptopLoaded] = useState(false);
  const [mobileLoaded, setMobileLoaded] = useState(false);

  const targetLaptopFrame = useRef(0);
  const targetMobileFrame = useRef(0);
  const currentLaptopFrame = useRef(0);
  const currentMobileFrame = useRef(0);
  const animFrameId = useRef(null);

  const TOTAL_LAPTOP_FRAMES = 157; // 00000 to 00157 (158 frames)
  const TOTAL_MOBILE_FRAMES = 173; // 00000 to 00173 (174 frames)

  // Preload Laptop frames
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = [];

    for (let i = 0; i <= TOTAL_LAPTOP_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(5, "0");
      img.src = `/images/impacto-conquer/video-laptop-otmz/laptop impacto conquer_${numStr}.webp`;

      img.onload = () => {
        loadedCount++;
        if (loadedCount >= TOTAL_LAPTOP_FRAMES) {
          setLaptopLoaded(true);
        }
      };
      loadedImages.push(img);
    }
    laptopImagesRef.current = loadedImages;
  }, []);

  // Preload Mobile frames
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = [];

    for (let i = 0; i <= TOTAL_MOBILE_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(5, "0");
      img.src = `/images/impacto-conquer/video-mobile-otmz/video mobile_${numStr}.webp`;

      img.onload = () => {
        loadedCount++;
        if (loadedCount >= TOTAL_MOBILE_FRAMES) {
          setMobileLoaded(true);
        }
      };
      loadedImages.push(img);
    }
    mobileImagesRef.current = loadedImages;
  }, []);

  // Scroll tracking on exact cards element bounds (normal height section)
  const { scrollYProgress } = useScroll({
    target: cardsRef,
    offset: ["start 75%", "end 25%"]
  });

  const renderFrameOnCanvas = (canvas, img) => {
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const hRatio = canvas.width / img.naturalWidth;
    const vRatio = canvas.height / img.naturalHeight;
    const ratio = Math.max(hRatio, vRatio);
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
  };

  // Smooth LERP animation loop to dampen playback speed without adding extra document height
  useEffect(() => {
    const loop = () => {
      const diffLaptop = targetLaptopFrame.current - currentLaptopFrame.current;
      currentLaptopFrame.current += diffLaptop * 0.07;

      const diffMobile = targetMobileFrame.current - currentMobileFrame.current;
      currentMobileFrame.current += diffMobile * 0.07;

      const laptopIdx = Math.min(
        TOTAL_LAPTOP_FRAMES,
        Math.max(0, Math.round(currentLaptopFrame.current))
      );
      renderFrameOnCanvas(canvasLaptopRef.current, laptopImagesRef.current[laptopIdx]);

      const mobileIdx = Math.min(
        TOTAL_MOBILE_FRAMES,
        Math.max(0, Math.round(currentMobileFrame.current))
      );
      renderFrameOnCanvas(canvasMobileRef.current, mobileImagesRef.current[mobileIdx]);

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [laptopLoaded, mobileLoaded]);

  // Update target frames with 100px start delay and 200px end delay
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (progress) => {
      // 100px start delay (~0.18 progress)
      // 200px end delay (~0.28 progress)
      const startDelay = 0.18;
      const endDelay = 0.28;

      const normalized = Math.min(
        1,
        Math.max(0, (progress - startDelay) / (1 - startDelay - endDelay))
      );

      targetLaptopFrame.current = normalized * TOTAL_LAPTOP_FRAMES;
      targetMobileFrame.current = normalized * TOTAL_MOBILE_FRAMES;
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-12 sm:mb-16">
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Laptop Video Square Card */}
        <div className="w-full aspect-square rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm relative flex items-center justify-center">
          <canvas
            ref={canvasLaptopRef}
            width={800}
            height={800}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Mobile Video Square Card */}
        <div className="w-full aspect-square rounded-[24px] overflow-hidden border border-zinc-200/60 bg-zinc-100 shadow-sm relative flex items-center justify-center">
          <canvas
            ref={canvasMobileRef}
            width={800}
            height={800}
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </section>
  );
}
