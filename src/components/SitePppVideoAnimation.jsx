import React, { useEffect, useRef, useState } from "react";
import { useScroll } from "framer-motion";

export default function SitePppVideoAnimation() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);

  const [imagesLoaded, setImagesLoaded] = useState(false);

  const targetFrame = useRef(0);
  const currentFrame = useRef(0);
  const animFrameId = useRef(null);

  const TOTAL_FRAMES = 381; // 00000 to 00381 (382 frames)

  // Preload sequence frames
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = [];

    for (let i = 0; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(5, "0");
      img.src = `/images/site-ppp/video-otmz/laptop_ppp_${numStr}.png`;

      img.onload = () => {
        loadedCount++;
        if (loadedCount >= Math.floor(TOTAL_FRAMES * 0.3)) {
          setImagesLoaded(true);
        }
      };
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;
  }, []);

  // Scroll tracking on exact card bounds as it passes through the fold
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"]
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

  // Smooth LERP animation loop to respond smoothly to scroll
  useEffect(() => {
    const loop = () => {
      const diff = targetFrame.current - currentFrame.current;
      currentFrame.current += diff * 0.08;

      const idx = Math.min(
        TOTAL_FRAMES,
        Math.max(0, Math.round(currentFrame.current))
      );
      if (imagesRef.current[idx]) {
        renderFrameOnCanvas(canvasRef.current, imagesRef.current[idx]);
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  // Update target frame based on scroll progress
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      targetFrame.current = Math.min(
        TOTAL_FRAMES,
        Math.max(0, Math.round(v * TOTAL_FRAMES))
      );
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <section ref={containerRef} className="w-full">
      <div className="rounded-[24px] overflow-hidden bg-zinc-950 aspect-video relative shadow-sm border border-zinc-200/60 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover"
        />
        {!imagesLoaded && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-zinc-400 text-sm font-medium">
            Carregando animação...
          </div>
        )}
      </div>
    </section>
  );
}
