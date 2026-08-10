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
const CREAM = "#f7f0df";
const PAPER = "#fffaf0";
const INK = "#171713";
const MUTED = "#777265";
const YELLOW = "#ffd64a";
const ORANGE = "#ff6b35";
const GREEN = "#23844f";
const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) {
  const characters = Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const character of characters) {
    const candidate = line + character;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line.trim());
      line = character;
      if (lines.length === maxLines - 1) break;
    } else {
      line = candidate;
    }
  }
  const consumed = lines.join("").length;
  if (lines.length < maxLines && consumed < characters.length) {
    line = characters.slice(consumed).join("");
  }
  if (line.trim()) lines.push(line.trim());
  lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, centerX, startY + index * lineHeight));
  return Math.min(lines.length, maxLines);
}

function drawLeftLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = candidate;
    }
  }
  const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (lines.length < maxLines && consumedWords < words.length) line = words.slice(consumedWords).join(" ");
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, x, startY + index * lineHeight));
  return Math.min(lines.length, maxLines);
}

function drawChickFace(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, happy: boolean) {
  ctx.save();
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.strokeStyle = INK;
  ctx.fillStyle = YELLOW;

  ctx.beginPath();
  ctx.ellipse(x + size * 0.52, y + size * 0.12, size * 0.16, size * 0.14, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + size * 0.56, size * 0.43, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x + size * 0.36, y + size * 0.5, size * 0.035, 0, Math.PI * 2);
  ctx.arc(x + size * 0.66, y + size * 0.5, size * 0.035, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(234,83,65,.46)";
  ctx.beginPath();
  ctx.ellipse(x + size * 0.22, y + size * 0.63, size * 0.07, size * 0.045, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.79, y + size * 0.63, size * 0.07, size * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f09d47";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.43, y + size * 0.58);
  ctx.lineTo(x + size * 0.59, y + size * 0.54);
  ctx.lineTo(x + size * 0.53, y + size * 0.65);
  ctx.closePath();
  ctx.fill();

  if (happy) {
    ctx.beginPath();
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(2.5, size * 0.035);
    ctx.arc(x + size * 0.51, y + size * 0.66, size * 0.11, 0.12, Math.PI - 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOfficer(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  const scale = width / 164;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = "round";

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  roundedRect(ctx, 14, 111, 136, 94, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#cbd2da";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(27, 111);
  ctx.lineTo(82, 111);
  ctx.lineTo(67, 150);
  ctx.lineTo(48, 133);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(82, 111);
  ctx.lineTo(137, 111);
  ctx.lineTo(116, 133);
  ctx.lineTo(97, 150);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#193451";
  ctx.beginPath();
  ctx.moveTo(72, 125);
  ctx.lineTo(92, 125);
  ctx.lineTo(88, 139);
  ctx.lineTo(101, 196);
  ctx.lineTo(63, 196);
  ctx.lineTo(76, 139);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = YELLOW;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(80, 15, 13, 12, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(82, 74, 60, 59, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(55, 64, 3, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(109, 64, 3, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(234,83,65,.5)";
  ctx.beginPath();
  ctx.ellipse(42, 81, 7, 4.5, 0, 0, Math.PI * 2);
  ctx.ellipse(122, 81, 7, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f09d47";
  ctx.beginPath();
  ctx.moveTo(74, 73);
  ctx.lineTo(90, 69);
  ctx.lineTo(84, 81);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(82, 87, 10, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();
}

function drawBadge(ctx: CanvasRenderingContext2D, input: AchievementCardInput) {
  const centerX = WIDTH / 2;
  const centerY = 376;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = input.color;
  for (let index = 0; index < 24; index += 1) {
    ctx.rotate(Math.PI / 12);
    ctx.beginPath();
    ctx.moveTo(-10, -215);
    ctx.lineTo(10, -215);
    ctx.lineTo(3, -145);
    ctx.lineTo(-3, -145);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.shadowColor = "rgba(34,28,10,.2)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#e69719";
  ctx.beginPath();
  ctx.arc(0, 0, 154, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.arc(0, 0, 137, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8e5912";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = "#ffe88c";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(0, 0, 117, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 96px ${FONT}`;
  ctx.fillText(input.icon, 0, -2);

  ctx.fillStyle = input.color;
  ctx.fillRect(-126, 118, 252, 65);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(-126, 118, 252, 65);
  ctx.fillStyle = "#ffffff";
  ctx.font = `1000 24px ${FONT}`;
  ctx.fillText(input.rarity.toUpperCase(), 0, 151);
  ctx.restore();
}

function issuedLabel(date: Date) {
  const day = `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}`;
  const time = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }).format(date);
  return `${day} ${time}`;
}

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

export async function renderAchievementCard(input: AchievementCardInput, canvas: HTMLCanvasElement) {
  await document.fonts?.ready;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 제작 기능을 사용할 수 없습니다.");

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = ctx.createRadialGradient(WIDTH / 2, 330, 40, WIDTH / 2, 330, 500);
  glow.addColorStop(0, "rgba(255,253,241,1)");
  glow.addColorStop(0.42, "rgba(255,253,241,.72)");
  glow.addColorStop(1, "rgba(247,240,223,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 80, WIDTH, 760);

  drawChickFace(ctx, 55, 36, 82, false);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `800 24px ${FONT}`;
  ctx.fillText("오늘도", 151, 75);
  ctx.font = `1000 38px ${FONT}`;
  ctx.fillText("대단한 척", 151, 112);

  ctx.textAlign = "center";
  ctx.fillStyle = "#996d19";
  ctx.font = `1000 28px ${FONT}`;
  ctx.fillText(`✦  ${input.rarity} 등급 업적 달성  ✦`, WIDTH / 2, 177);

  drawBadge(ctx, input);

  ctx.fillStyle = MUTED;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText(input.action, WIDTH / 2, 617);

  let titleSize = 65;
  do {
    ctx.font = `1000 ${titleSize}px ${FONT}`;
    titleSize -= 2;
  } while (ctx.measureText(`「${input.title}」`).width > 940 && titleSize > 45);
  ctx.fillStyle = INK;
  const titleLines = drawCenteredLines(ctx, `「${input.title}」`, WIDTH / 2, 700, 950, titleSize * 1.16, 2);
  const titleBottom = 700 + (titleLines - 1) * titleSize * 1.16;

  ctx.fillStyle = "#5b7569";
  ctx.font = `900 24px ${FONT}`;
  ctx.fillText("오늘 달성 완료  ✓", WIDTH / 2, titleBottom + 56);

  const noteY = titleBottom + 91;
  const noteHeight = 252;
  ctx.shadowColor = INK;
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 9;
  ctx.fillStyle = "#ffffff";
  roundedRect(ctx, 58, noteY, 964, noteHeight, 30);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke();

  drawOfficer(ctx, 78, noteY + 27, 145);
  ctx.textAlign = "left";
  ctx.fillStyle = MUTED;
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText(`칭찬 공무원 공식 논평 · ${issuedLabel(input.issuedAt)}`, 250, noteY + 62);
  ctx.fillStyle = INK;
  ctx.font = `700 29px ${FONT}`;
  drawLeftLines(ctx, input.description, 250, noteY + 111, 710, 47, 3);

  const registrationY = noteY + noteHeight + 61;
  ctx.textAlign = "center";
  ctx.fillStyle = GREEN;
  ctx.font = `1000 26px ${FONT}`;
  ctx.fillText("✓", 345, registrationY);
  ctx.fillStyle = MUTED;
  ctx.font = `850 24px ${FONT}`;
  ctx.fillText("업적관리국에 정식 등록되었습니다.", 570, registrationY);
  ctx.fillStyle = MUTED;
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText("실제로는 별것 아닐 수 있습니다.", WIDTH / 2, registrationY + 48);

  canvas.dataset.achievementCard = `${input.title}|${input.issuedAt.getTime()}`;
  return canvas;
}

export async function createAchievementCard(input: AchievementCardInput, visibleCanvas?: HTMLCanvasElement | null): Promise<AchievementCardFile> {
  const cardKey = `${input.title}|${input.issuedAt.getTime()}`;
  const canvas = visibleCanvas?.dataset.achievementCard === cardKey ? visibleCanvas : document.createElement("canvas");
  if (canvas !== visibleCanvas) await renderAchievementCard(input, canvas);
  const blob = await canvasToBlob(canvas);
  const dataUrl = canvas.toDataURL("image/png", 1);
  return { blob, dataUrl, fileName: `오늘도-대단한-척-${safeFilePart(input.title)}-${fileTimestamp(new Date())}.png` };
}
