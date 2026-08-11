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

const WIDTH = 1080;
const HEIGHT = 1350;
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("ī�� �̹����� ������ ���߽��ϴ�.")), "image/png", 1);
  });
}

function safeFilePart(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "").trim() || "����";
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
    image.onerror = () => reject(new Error("CSS ��� ī�带 �̹����� ��ȯ���� ���߽��ϴ�."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function renderElementToCanvas(element: HTMLElement) {
  await document.fonts?.ready;

  const bounds = element.getBoundingClientRect();
  if (!bounds.width || !bounds.height) throw new Error("��� ī���� ũ�⸦ Ȯ���� �� �����ϴ�.");

  const clone = element.cloneNode(true) as HTMLElement;
  clone.classList.add("achievement-card--export");
  clone.style.width = `${bounds.width}px`;
  clone.style.height = `${bounds.height}px`;
  clone.style.maxWidth = "none";
  clone.style.margin = "0";

  const wrapper = document.createElementNS(XHTML_NAMESPACE, "div");
  wrapper.style.width = `${bounds.width}px`;
  wrapper.style.height = `${bounds.height}px`;
  wrapper.style.margin = "0";
  wrapper.style.overflow = "hidden";

  const style = document.createElementNS(XHTML_NAMESPACE, "style");
  style.textContent = pageStyles();
  wrapper.append(style, clone);

  const serialized = new XMLSerializer().serializeToString(wrapper);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${bounds.width} ${bounds.height}">`,
    `<foreignObject x="0" y="0" width="${bounds.width}" height="${bounds.height}">`,
    serialized,
    "</foreignObject></svg>",
  ].join("");

  const image = await loadSvg(svg);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("�̹��� ���� ����� ����� �� �����ϴ�.");
  context.drawImage(image, 0, 0, WIDTH, HEIGHT);
  return canvas;
}

export async function createAchievementCard(input: AchievementCardInput, visibleCard?: HTMLElement | null): Promise<AchievementCardFile> {
  if (!visibleCard) throw new Error("��� ī�尡 ���� �غ���� �ʾҽ��ϴ�.");
  const canvas = await renderElementToCanvas(visibleCard);
  const blob = await canvasToBlob(canvas);
  const dataUrl = canvas.toDataURL("image/png", 1);
  return {
    blob,
    dataUrl,
    fileName: `���õ�-�����-ô-${safeFilePart(input.title)}-${fileTimestamp(new Date())}.png`,
  };
}

