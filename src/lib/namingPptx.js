import pptxgen from "pptxgenjs";

const BLACK = "000000";
const WHITE = "FFFFFF";
const GREY_BG = "F1F1F1";
const BODY_GREY = "6B6B6B";
const MUTED_ON_DARK = "8A8A8A";
const MUTED_ON_LIGHT = "AFAFAF";

function addFooter(slide, clientName, year, onDark) {
  const color = onDark ? MUTED_ON_DARK : MUTED_ON_LIGHT;
  slide.addText(clientName, { x: 0.4, y: 5.15, w: 4, h: 0.3, fontSize: 10, color, fontFace: "Arial" });
  slide.addText(String(year), { x: 8.6, y: 5.15, w: 1, h: 0.3, align: "right", fontSize: 10, color, fontFace: "Arial" });
}

function addSectionBlock(slide, x, y, title, text, titleSize = 16) {
  slide.addText(title, { x, y, w: 4.3, h: 0.35, fontSize: titleSize, bold: true, color: BLACK, fontFace: "Arial" });
  slide.addText(text || "", {
    x,
    y: y + 0.38,
    w: 4.3,
    h: 0.9,
    fontSize: 11,
    color: BODY_GREY,
    fontFace: "Arial",
    valign: "top",
  });
}

export function buildNamingPptx(study, options) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "LAST_LAB_16x9", width: 10, height: 5.63 });
  pptx.layout = "LAST_LAB_16x9";
  const year = new Date().getFullYear();

  // 1. Capa
  let slide = pptx.addSlide();
  slide.background = { color: BLACK };
  slide.addText("Estudo\nnaming", {
    x: 0.6,
    y: 0.7,
    w: 8,
    h: 2.4,
    fontSize: 48,
    bold: true,
    color: WHITE,
    fontFace: "Arial",
  });
  addFooter(slide, study.clientName, year, true);

  // 2. Palavras-chave
  if (study.keywords) {
    slide = pptx.addSlide();
    slide.background = { color: GREY_BG };
    slide.addText("Palavras chave", {
      x: 0,
      y: 0.35,
      w: 10,
      h: 0.5,
      align: "center",
      fontSize: 18,
      color: "D8D8D8",
      fontFace: "Arial",
    });
    slide.addText(study.keywords, {
      x: 0.6,
      y: 2.25,
      w: 8.8,
      h: 1.1,
      align: "center",
      fontSize: 32,
      color: BLACK,
      fontFace: "Arial",
    });
    addFooter(slide, study.clientName, year, false);
  }

  // 3. Dimensões da marca
  const dims = (study.dimensions || []).filter((d) => d.left && d.right);
  if (dims.length) {
    slide = pptx.addSlide();
    slide.background = { color: BLACK };
    slide.addText("Dimensões da marca", {
      x: 0,
      y: 0.3,
      w: 10,
      h: 0.5,
      align: "center",
      fontSize: 22,
      color: WHITE,
      fontFace: "Arial",
    });
    const startY = 1.15;
    const rowH = 0.72;
    dims.forEach((d, i) => {
      const y = startY + i * rowH;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.5,
        y,
        w: 1.9,
        h: 0.42,
        rectRadius: 0.21,
        fill: { color: BLACK },
        line: { color: "666666", width: 1 },
      });
      slide.addText(d.left, {
        x: 0.5,
        y,
        w: 1.9,
        h: 0.42,
        align: "center",
        valign: "middle",
        fontSize: 11,
        color: WHITE,
        fontFace: "Arial",
      });
      slide.addShape(pptx.ShapeType.line, {
        x: 2.6,
        y: y + 0.21,
        w: 4.8,
        h: 0,
        line: { color: "555555", width: 1.5 },
      });
      const value = typeof d.value === "number" ? d.value : 50;
      const dotX = 2.6 + (value / 100) * 4.8 - 0.07;
      slide.addShape(pptx.ShapeType.ellipse, {
        x: dotX,
        y: y + 0.14,
        w: 0.14,
        h: 0.14,
        fill: { color: WHITE },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 7.6,
        y,
        w: 1.9,
        h: 0.42,
        rectRadius: 0.21,
        fill: { color: BLACK },
        line: { color: "666666", width: 1 },
      });
      slide.addText(d.right, {
        x: 7.6,
        y,
        w: 1.9,
        h: 0.42,
        align: "center",
        valign: "middle",
        fontSize: 11,
        color: WHITE,
        fontFace: "Arial",
      });
    });
    addFooter(slide, study.clientName, year, true);
  }

  // Por opção de nome
  options.forEach((opt) => {
    // Divisor
    slide = pptx.addSlide();
    slide.background = { color: GREY_BG };
    slide.addText(
      [
        { text: (opt.prefix ? opt.prefix + "   " : ""), options: { color: "6B6B6B" } },
        { text: opt.name, options: { color: BLACK, bold: true } },
      ],
      { x: 0.6, y: 2.35, w: 8.8, h: 1, align: "center", fontSize: 36, fontFace: "Arial" }
    );
    addFooter(slide, study.clientName, year, false);

    // Significado
    if (opt.meaningConcepts?.length) {
      slide = pptx.addSlide();
      slide.background = { color: GREY_BG };
      slide.addText("Significado", {
        x: 0.6,
        y: 2.3,
        w: 4,
        h: 0.6,
        fontSize: 26,
        color: BLACK,
        fontFace: "Arial",
      });
      let ry = 0.7;
      opt.meaningConcepts.forEach((c) => {
        addSectionBlock(slide, 5.1, ry, c.title, c.text);
        ry += 1.5;
      });
      addFooter(slide, study.clientName, year, false);
    }

    // Sonoridade
    if (opt.soundPoints?.length) {
      slide = pptx.addSlide();
      slide.background = { color: GREY_BG };
      slide.addText("Sonoridade", {
        x: 0.6,
        y: 2.5,
        w: 4,
        h: 0.6,
        fontSize: 26,
        color: BLACK,
        fontFace: "Arial",
      });
      let ry = 0.55;
      opt.soundPoints.forEach((p) => {
        addSectionBlock(slide, 5.1, ry, p.title, p.text, 14);
        ry += 1.15;
      });
      addFooter(slide, study.clientName, year, false);
    }

    // Conexão
    if (opt.connectionText) {
      slide = pptx.addSlide();
      slide.background = { color: GREY_BG };
      slide.addText("Conexão", {
        x: 0.6,
        y: 2.2,
        w: 4,
        h: 0.6,
        fontSize: 26,
        color: BLACK,
        fontFace: "Arial",
      });
      slide.addText(opt.connectionText, {
        x: 5.1,
        y: 2.0,
        w: 4.3,
        h: 1.3,
        fontSize: 13,
        color: BLACK,
        fontFace: "Arial",
      });
      addFooter(slide, study.clientName, year, false);
    }

    // Tagline de fechamento
    if (opt.tagline) {
      slide = pptx.addSlide();
      slide.background = { color: BLACK };
      slide.addText(opt.tagline, {
        x: 0.8,
        y: 2.0,
        w: 8.4,
        h: 1.6,
        align: "center",
        fontSize: 26,
        bold: true,
        color: WHITE,
        fontFace: "Arial",
      });
      addFooter(slide, study.clientName, year, true);
    }
  });

  // Slide final de variações (feedback)
  if (options.length) {
    slide = pptx.addSlide();
    slide.background = { color: GREY_BG };
    const prefixes = [...new Set(options.map((o) => o.prefix).filter(Boolean))];
    const label = prefixes.length ? prefixes.join(" / ") : "Instituto / Clínica / Estúdio";
    slide.addText(
      [
        { text: label + "   ", options: { color: "6B6B6B" } },
        { text: options[0].name, options: { color: BLACK, bold: true } },
      ],
      { x: 0.6, y: 2.35, w: 8.8, h: 1, align: "center", fontSize: 32, fontFace: "Arial" }
    );
    addFooter(slide, study.clientName, year, false);
  }

  const fileSlug = study.clientName.trim().toLowerCase().replace(/\s+/g, "-") || "estudo";
  pptx.writeFile({ fileName: `naming-${fileSlug}.pptx` });
}
