const EMU_PER_INCH = 914400;
const inch = (n) => Math.round(n * EMU_PER_INCH);

const BLACK = "000000";
const WHITE = "FFFFFF";
const GREY_BG = "F1F1F1";
const BODY_GREY = "6B6B6B";
const MUTED_ON_DARK = "8A8A8A";
const MUTED_ON_LIGHT = "AFAFAF";

const ALIGN = { left: "START", center: "CENTER", right: "END" };

function rgb(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const bl = parseInt(hex.slice(4, 6), 16) / 255;
  return { opaqueColor: { rgbColor: { red: r, green: g, blue: bl } } };
}

class SlideBuilder {
  constructor() {
    this.requests = [];
    this.counter = 0;
  }

  nextId(prefix) {
    return `${prefix}${this.counter++}`;
  }

  addSlide() {
    const slideId = this.nextId("slide");
    this.requests.push({
      createSlide: { objectId: slideId, slideLayoutReference: { predefinedLayout: "BLANK" } },
    });
    return slideId;
  }

  setBackground(slideId, hex) {
    this.requests.push({
      updatePageProperties: {
        objectId: slideId,
        pageProperties: { pageBackgroundFill: { solidFill: { color: rgb(hex) } } },
        fields: "pageBackgroundFill.solidFill.color",
      },
    });
  }

  addText(slideId, { x, y, w, h, text, runs, fontSize = 12, bold = false, color = BLACK, align = "left", fontFamily = "Arial", valign }) {
    const boxId = this.nextId("box");
    this.requests.push({
      createShape: {
        objectId: boxId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: inch(w), unit: "EMU" }, height: { magnitude: inch(h), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: inch(x), translateY: inch(y), unit: "EMU" },
        },
      },
    });

    const parts = runs || [{ text, options: {} }];
    const fullText = parts.map((p) => p.text || "").join("");
    this.requests.push({ insertText: { objectId: boxId, insertionIndex: 0, text: fullText } });

    let idx = 0;
    parts.forEach((p) => {
      const len = (p.text || "").length;
      if (len > 0) {
        this.requests.push({
          updateTextStyle: {
            objectId: boxId,
            textRange: { type: "FIXED_RANGE", startIndex: idx, endIndex: idx + len },
            style: {
              fontSize: { magnitude: p.options?.fontSize || fontSize, unit: "PT" },
              bold: p.options?.bold ?? bold,
              foregroundColor: rgb(p.options?.color || color),
              fontFamily: p.options?.fontFamily || fontFamily,
            },
            fields: "fontSize,bold,foregroundColor,fontFamily",
          },
        });
      }
      idx += len;
    });

    this.requests.push({
      updateParagraphStyle: {
        objectId: boxId,
        textRange: { type: "ALL" },
        style: { alignment: ALIGN[align] || "START" },
        fields: "alignment",
      },
    });

    if (valign) {
      this.requests.push({
        updateShapeProperties: {
          objectId: boxId,
          shapeProperties: { contentAlignment: valign },
          fields: "contentAlignment",
        },
      });
    }

    return boxId;
  }

  addRoundRect(slideId, { x, y, w, h, fill, lineColor, lineWidth = 1 }) {
    const id = this.nextId("rect");
    this.requests.push({
      createShape: {
        objectId: id,
        shapeType: "ROUND_RECTANGLE",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: inch(w), unit: "EMU" }, height: { magnitude: inch(h), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: inch(x), translateY: inch(y), unit: "EMU" },
        },
      },
    });
    const fields = ["shapeBackgroundFill.solidFill.color"];
    const shapeProperties = { shapeBackgroundFill: { solidFill: { color: rgb(fill) } } };
    if (lineColor) {
      shapeProperties.outline = {
        outlineFill: { solidFill: { color: rgb(lineColor) } },
        weight: { magnitude: lineWidth, unit: "PT" },
      };
      fields.push("outline.outlineFill.solidFill.color", "outline.weight");
    }
    this.requests.push({
      updateShapeProperties: { objectId: id, shapeProperties, fields: fields.join(",") },
    });
    return id;
  }

  addEllipse(slideId, { x, y, w, h, fill }) {
    const id = this.nextId("ellipse");
    this.requests.push({
      createShape: {
        objectId: id,
        shapeType: "ELLIPSE",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: inch(w), unit: "EMU" }, height: { magnitude: inch(h), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: inch(x), translateY: inch(y), unit: "EMU" },
        },
      },
    });
    this.requests.push({
      updateShapeProperties: {
        objectId: id,
        shapeProperties: {
          shapeBackgroundFill: { solidFill: { color: rgb(fill) } },
          outline: { propertyState: "NOT_RENDERED" },
        },
        fields: "shapeBackgroundFill.solidFill.color,outline.propertyState",
      },
    });
    return id;
  }

  addLine(slideId, { x, y, w, h, color, weight = 1 }) {
    const id = this.nextId("line");
    this.requests.push({
      createLine: {
        objectId: id,
        lineCategory: "STRAIGHT",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: inch(w) || 1, unit: "EMU" }, height: { magnitude: inch(h) || 1, unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: inch(x), translateY: inch(y), unit: "EMU" },
        },
      },
    });
    this.requests.push({
      updateLineProperties: {
        objectId: id,
        lineProperties: { lineFill: { solidFill: { color: rgb(color) } }, weight: { magnitude: weight, unit: "PT" } },
        fields: "lineFill.solidFill.color,weight",
      },
    });
    return id;
  }
}

function addFooter(b, slideId, clientName, year, onDark) {
  const color = onDark ? MUTED_ON_DARK : MUTED_ON_LIGHT;
  b.addText(slideId, { x: 0.4, y: 5.15, w: 4, h: 0.3, text: clientName, fontSize: 10, color, align: "left" });
  b.addText(slideId, { x: 8.6, y: 5.15, w: 1, h: 0.3, text: String(year), fontSize: 10, color, align: "right" });
}

function addSectionBlock(b, slideId, x, y, title, text, titleSize = 16) {
  b.addText(slideId, { x, y, w: 4.3, h: 0.35, text: title, fontSize: titleSize, bold: true, color: BLACK });
  b.addText(slideId, { x, y: y + 0.38, w: 4.3, h: 0.9, text: text || "", fontSize: 11, color: BODY_GREY });
}

let gsiLoadPromise = null;
function loadGsi() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!gsiLoadPromise) {
    gsiLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Falha ao carregar o Google Identity Services."));
      document.head.appendChild(script);
    });
  }
  return gsiLoadPromise;
}

let cachedToken = null;
let cachedTokenExpiry = 0;

export async function getGoogleAccessToken() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Integração com o Google não configurada (faltando VITE_GOOGLE_CLIENT_ID)."
    );
  }
  if (cachedToken && Date.now() < cachedTokenExpiry - 60000) {
    return cachedToken;
  }
  await loadGsi();
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/presentations",
      callback: (response) => {
        if (response.error) {
          reject(new Error(`Autorização do Google falhou: ${response.error}`));
          return;
        }
        cachedToken = response.access_token;
        cachedTokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;
        resolve(cachedToken);
      },
    });
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

async function createPresentation(token, title) {
  const res = await fetch("https://slides.googleapis.com/v1/presentations", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      pageSize: {
        width: { magnitude: inch(10), unit: "EMU" },
        height: { magnitude: inch(5.63), unit: "EMU" },
      },
    }),
  });
  if (!res.ok) throw new Error(`Erro ao criar apresentação (${res.status}): ${await res.text()}`);
  return res.json();
}

async function runBatch(token, presentationId, requests) {
  const CHUNK = 200;
  for (let i = 0; i < requests.length; i += CHUNK) {
    const chunk = requests.slice(i, i + CHUNK);
    const res = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests: chunk }),
    });
    if (!res.ok) throw new Error(`Erro ao montar os slides (${res.status}): ${await res.text()}`);
  }
}

export async function createNamingGoogleSlides(study, options) {
  const token = await getGoogleAccessToken();
  const year = new Date().getFullYear();
  const created = await createPresentation(token, `Naming — ${study.clientName}`);
  const presentationId = created.presentationId;
  const firstSlideId = created.slides?.[0]?.objectId;

  const b = new SlideBuilder();

  // 1. Capa (reaproveita o slide criado por padrão)
  b.setBackground(firstSlideId, BLACK);
  b.addText(firstSlideId, { x: 0.6, y: 0.7, w: 8, h: 2.4, text: "Estudo\nnaming", fontSize: 48, bold: true, color: WHITE });
  addFooter(b, firstSlideId, study.clientName, year, true);

  // 2. Palavras-chave
  if (study.keywords) {
    const slideId = b.addSlide();
    b.setBackground(slideId, GREY_BG);
    b.addText(slideId, { x: 0, y: 0.35, w: 10, h: 0.5, text: "Palavras chave", fontSize: 18, color: "D8D8D8", align: "center" });
    b.addText(slideId, { x: 0.6, y: 2.25, w: 8.8, h: 1.1, text: study.keywords, fontSize: 32, color: BLACK, align: "center" });
    addFooter(b, slideId, study.clientName, year, false);
  }

  // 3. Dimensões da marca
  const dims = (study.dimensions || []).filter((d) => d.left && d.right);
  if (dims.length) {
    const slideId = b.addSlide();
    b.setBackground(slideId, BLACK);
    b.addText(slideId, { x: 0, y: 0.3, w: 10, h: 0.5, text: "Dimensões da marca", fontSize: 22, color: WHITE, align: "center" });
    const startY = 1.15;
    const rowH = 0.72;
    dims.forEach((d, i) => {
      const y = startY + i * rowH;
      b.addRoundRect(slideId, { x: 0.5, y, w: 1.9, h: 0.42, fill: BLACK, lineColor: "666666", lineWidth: 1 });
      b.addText(slideId, { x: 0.5, y, w: 1.9, h: 0.42, text: d.left, fontSize: 11, color: WHITE, align: "center", valign: "MIDDLE" });
      b.addLine(slideId, { x: 2.6, y: y + 0.21, w: 4.8, h: 0, color: "555555", weight: 1.5 });
      const value = typeof d.value === "number" ? d.value : 50;
      const dotX = 2.6 + (value / 100) * 4.8 - 0.07;
      b.addEllipse(slideId, { x: dotX, y: y + 0.14, w: 0.14, h: 0.14, fill: WHITE });
      b.addRoundRect(slideId, { x: 7.6, y, w: 1.9, h: 0.42, fill: BLACK, lineColor: "666666", lineWidth: 1 });
      b.addText(slideId, { x: 7.6, y, w: 1.9, h: 0.42, text: d.right, fontSize: 11, color: WHITE, align: "center", valign: "MIDDLE" });
    });
    addFooter(b, slideId, study.clientName, year, true);
  }

  // Por opção de nome
  options.forEach((opt) => {
    // Divisor
    let slideId = b.addSlide();
    b.setBackground(slideId, GREY_BG);
    b.addText(slideId, {
      x: 0.6,
      y: 2.35,
      w: 8.8,
      h: 1,
      align: "center",
      fontSize: 36,
      runs: [
        { text: opt.prefix ? opt.prefix + "   " : "", options: { color: BODY_GREY, bold: false } },
        { text: opt.name, options: { color: BLACK, bold: true } },
      ],
    });
    addFooter(b, slideId, study.clientName, year, false);

    // Significado
    if (opt.meaningConcepts?.length) {
      slideId = b.addSlide();
      b.setBackground(slideId, GREY_BG);
      b.addText(slideId, { x: 0.6, y: 2.3, w: 4, h: 0.6, text: "Significado", fontSize: 26, color: BLACK });
      let ry = 0.7;
      opt.meaningConcepts.forEach((c) => {
        addSectionBlock(b, slideId, 5.1, ry, c.title, c.text);
        ry += 1.5;
      });
      addFooter(b, slideId, study.clientName, year, false);
    }

    // Sonoridade
    if (opt.soundPoints?.length) {
      slideId = b.addSlide();
      b.setBackground(slideId, GREY_BG);
      b.addText(slideId, { x: 0.6, y: 2.5, w: 4, h: 0.6, text: "Sonoridade", fontSize: 26, color: BLACK });
      let ry = 0.55;
      opt.soundPoints.forEach((p) => {
        addSectionBlock(b, slideId, 5.1, ry, p.title, p.text, 14);
        ry += 1.15;
      });
      addFooter(b, slideId, study.clientName, year, false);
    }

    // Conexão
    if (opt.connectionText) {
      slideId = b.addSlide();
      b.setBackground(slideId, GREY_BG);
      b.addText(slideId, { x: 0.6, y: 2.2, w: 4, h: 0.6, text: "Conexão", fontSize: 26, color: BLACK });
      b.addText(slideId, { x: 5.1, y: 2.0, w: 4.3, h: 1.3, text: opt.connectionText, fontSize: 13, color: BLACK });
      addFooter(b, slideId, study.clientName, year, false);
    }

    // Tagline de fechamento
    if (opt.tagline) {
      slideId = b.addSlide();
      b.setBackground(slideId, BLACK);
      b.addText(slideId, { x: 0.8, y: 2.0, w: 8.4, h: 1.6, text: opt.tagline, fontSize: 26, bold: true, color: WHITE, align: "center" });
      addFooter(b, slideId, study.clientName, year, true);
    }
  });

  // Slide final de variações (feedback)
  if (options.length) {
    const slideId = b.addSlide();
    b.setBackground(slideId, GREY_BG);
    const prefixes = [...new Set(options.map((o) => o.prefix).filter(Boolean))];
    const label = prefixes.length ? prefixes.join(" / ") : "Instituto / Clínica / Estúdio";
    b.addText(slideId, {
      x: 0.6,
      y: 2.35,
      w: 8.8,
      h: 1,
      align: "center",
      fontSize: 32,
      runs: [
        { text: label + "   ", options: { color: BODY_GREY, bold: false } },
        { text: options[0].name, options: { color: BLACK, bold: true } },
      ],
    });
    addFooter(b, slideId, study.clientName, year, false);
  }

  await runBatch(token, presentationId, b.requests);

  return { presentationId, url: `https://docs.google.com/presentation/d/${presentationId}/edit` };
}
