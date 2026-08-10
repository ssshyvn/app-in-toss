export const APPS_IN_TOSS_APP_NAME = "goodjob-me";
export const APPS_IN_TOSS_OG_IMAGE = "https://oneuldo-awesome.ssshyvn.chatgpt.site/og.png";

type ShareResult = "image" | "toss" | "toss-saved" | "web" | "clipboard";
type SaveResult = "toss" | "download";

async function loadBridge() {
  return import("@apps-in-toss/web-framework");
}

export async function detectTossApp(): Promise<string | null> {
  try {
    const { getTossAppVersion } = await loadBridge();
    return getTossAppVersion();
  } catch {
    return null;
  }
}

export async function triggerAchievementHaptic() {
  try {
    const { generateHapticFeedback } = await loadBridge();
    await generateHapticFeedback({ type: "confetti" });
  } catch {
    navigator.vibrate?.([35, 45, 80]);
  }
}

export async function readAppValue(key: string): Promise<string | null> {
  try {
    const { Storage } = await loadBridge();
    const value = await Storage.getItem(key);
    if (value !== null) return value;
  } catch { /* fall back to origin-scoped browser storage */ }
  return localStorage.getItem(key);
}

export async function writeAppValue(key: string, value: string) {
  localStorage.setItem(key, value);
  try {
    const { Storage } = await loadBridge();
    await Storage.setItem(key, value);
  } catch { /* browser storage has already been updated */ }
}

export async function shareAchievement(title: string, action: string, rarity: string): Promise<ShareResult> {
  const text = `${rarity} 등급 업적을 달성했습니다!\n「${title}」\n${action}`;

  try {
    const { getTossShareLink, share } = await loadBridge();
    const tossLink = await getTossShareLink(`intoss://${APPS_IN_TOSS_APP_NAME}`, APPS_IN_TOSS_OG_IMAGE);
    await share({ message: `${text}\n${tossLink}` });
    return "toss";
  } catch { /* continue with standards-based web sharing */ }

  if (navigator.share) {
    await navigator.share({ title: `오늘도 대단한 척 - ${title}`, text, url: window.location.href });
    return "web";
  }

  await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
  return "clipboard";
}

export async function shareAchievementImage(blob: Blob, dataUrl: string, fileName: string, title: string, action: string, rarity: string): Promise<ShareResult> {
  const file = new File([blob], fileName, { type: "image/png" });
  const payload: ShareData = { files: [file], title: `오늘도 대단한 척 - ${title}`, text: `${rarity} 등급 업적 달성! 「${title}」` };
  if (navigator.share && (!navigator.canShare || navigator.canShare(payload))) {
    try {
      await navigator.share(payload);
      return "image";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
    }
  }
  const data = dataUrl.split(",")[1];
  if (data && await saveWithTossBridge(data, fileName)) {
    await shareAchievement(title, action, rarity);
    return "toss-saved";
  }
  return shareAchievement(title, action, rarity);
}

function versionAtLeast(current: string, required: string) {
  const currentParts = current.split(".").map(Number);
  const requiredParts = required.split(".").map(Number);
  for (let index = 0; index < Math.max(currentParts.length, requiredParts.length); index += 1) {
    const currentPart = currentParts[index] || 0;
    const requiredPart = requiredParts[index] || 0;
    if (currentPart !== requiredPart) return currentPart > requiredPart;
  }
  return true;
}

async function saveWithTossBridge(data: string, fileName: string) {
  try {
    const { getTossAppVersion, saveBase64Data } = await loadBridge();
    const version = getTossAppVersion();
    const requiredVersion = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "5.216.0" : "5.218.0";
    if (!version || !versionAtLeast(version, requiredVersion)) return false;
    await saveBase64Data({ data, fileName, mimeType: "image/png" });
    return true;
  } catch {
    return false;
  }
}

export async function saveAchievementImage(dataUrl: string, fileName: string): Promise<SaveResult> {
  const data = dataUrl.split(",")[1];
  if (!data) throw new Error("저장할 이미지 데이터가 없습니다.");
  if (await saveWithTossBridge(data, fileName)) return "toss";

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return "download";
}
