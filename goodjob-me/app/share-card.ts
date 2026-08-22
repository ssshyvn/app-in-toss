export type AchievementCardInput = {
  title: string;
  action: string;
  description: string;
  rarity: string;
  icon: string;
  color: string;
  issuedAt: Date;
};

export type AchievementCardFile = {
  blob: Blob;
  dataUrl: string;
  fileName: string;
};

const WIDTH = 1440;
const HEIGHT = 1920;
const EXPORT_CSS_WIDTH = 420;
const EXPORT_CSS_HEIGHT = 560;
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("카드 이미지를 만들지 못했습니다.")), "image/png", 1);
  });
}

function safeFilePart(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "").trim() || "업적";
}

function fileTimestamp(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "-",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");
}

function pageStyles() {
  return Array.from(document.styleSheets).map((sheet) => {
    try {
      return Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
    } catch {
      return "";
    }
  }).join("\n");
}

function loadSvg(svg: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("CSS 결과 카드를 이미지로 변환하지 못했습니다."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function renderElementToCanvas(element: HTMLElement) {
  await document.fonts?.ready;

  const bounds = element.getBoundingClientRect();
  if (!bounds.width || !bounds.height) throw new Error("결과 카드의 크기를 확인할 수 없습니다.");

  const clone = element.cloneNode(true) as HTMLElement;
  clone.classList.add("achievement-card--export");
  clone.style.width = `${EXPORT_CSS_WIDTH}px`;
  clone.style.height = `${EXPORT_CSS_HEIGHT}px`;
  clone.style.maxWidth = "none";
  clone.style.margin = "0";

  const wrapper = document.createElementNS(XHTML_NAMESPACE, "div");
  wrapper.style.width = `${EXPORT_CSS_WIDTH}px`;
  wrapper.style.height = `${EXPORT_CSS_HEIGHT}px`;
  wrapper.style.margin = "0";
  wrapper.style.overflow = "hidden";

  const style = document.createElementNS(XHTML_NAMESPACE, "style");
  style.textContent = pageStyles();
  wrapper.append(style, clone);

  const serialized = new XMLSerializer().serializeToString(wrapper);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${EXPORT_CSS_WIDTH} ${EXPORT_CSS_HEIGHT}">`,
    `<foreignObject x="0" y="0" width="${EXPORT_CSS_WIDTH}" height="${EXPORT_CSS_HEIGHT}">`,
    serialized,
    "</foreignObject></svg>",
  ].join("");

  const image = await loadSvg(svg);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지 제작 기능을 사용할 수 없습니다.");
  context.drawImage(image, 0, 0, WIDTH, HEIGHT);
  return canvas;
}

export async function createAchievementCard(input: AchievementCardInput, visibleCard?: HTMLElement | null): Promise<AchievementCardFile> {
  if (!visibleCard) throw new Error("결과 카드가 아직 준비되지 않았습니다.");
  const canvas = await renderElementToCanvas(visibleCard);
  const blob = await canvasToBlob(canvas);
  const dataUrl = canvas.toDataURL("image/png", 1);
  return {
    blob,
    dataUrl,
    fileName: `오늘도-대단한-척-${safeFilePart(input.title)}-${fileTimestamp(new Date())}.png`,
  };
}
