"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { readAppValue, saveAchievementImage, shareAchievementImage, triggerAchievementHaptic, writeAppValue } from "./apps-in-toss";
import { createAchievementCard } from "./share-card";

type Rarity = "일반" | "희귀" | "영웅" | "전설" | "신화";
type Category = "생존" | "생활" | "사회생활" | "공부·일" | "미스터리";
type View = "home" | "pick" | "judging" | "result" | "collection";

type Achievement = {
  id: string;
  action: string;
  title: string;
  description: string;
  rarity: Rarity;
  category: Category;
  icon: string;
  color: string;
  hidden?: boolean;
};

type AchievementStats = {
  visits: number;
  totalStored: number;
  actionCounts: Record<string, number>;
};

type DailyAchievements = {
  dateKey: string;
  ids: string[];
};

const coreAchievements: Achievement[] = [
  { id: "wake", action: "침대에서 일어났다", title: "중력을 이겨낸 자", description: "지구가 온 힘을 다해 당신을 붙잡았지만, 끝내 수직 상태로 전환하는 데 성공했습니다.", rarity: "전설", category: "생존", icon: "🛏️", color: "#ff6b35" },
  { id: "water", action: "물을 마셨다", title: "수분 섭취 전문가", description: "생존에 필수적인 액체 자원을 직접 확보하여 체내에 공급했습니다. 매우 전략적인 판단입니다.", rarity: "희귀", category: "생존", icon: "💧", color: "#38a8ff" },
  { id: "meal", action: "밥을 먹었다", title: "영양분 확보 작전", description: "오늘의 생명 활동에 필요한 자원을 성공적으로 조달했습니다. 당분간 생존이 가능할 것으로 전망됩니다.", rarity: "영웅", category: "생존", icon: "🍚", color: "#00a878" },
  { id: "wash", action: "씻었다", title: "청결의 수호자", description: "물과 세정제를 활용하여 개인 위생 수준을 크게 향상시켰습니다. 문명사회 유지에 기여했습니다.", rarity: "영웅", category: "생활", icon: "🚿", color: "#7c6bf2" },
  { id: "brush", action: "양치했다", title: "구강 방어 체계 가동", description: "치아 방어 시스템을 직접 가동했습니다. 구강 내 평화가 당분간 유지될 것으로 예상됩니다.", rarity: "영웅", category: "생활", icon: "🪥", color: "#6b8de3" },
  { id: "dishes", action: "설거지했다", title: "그릇 해방군", description: "싱크대에 장기간 억류되어 있던 그릇들을 구조했습니다. 주방의 질서가 회복되었습니다.", rarity: "전설", category: "생활", icon: "🍽️", color: "#f09b3d" },
  { id: "trash", action: "쓰레기를 버렸다", title: "공간 정화사", description: "불필요한 물체를 생활권 밖으로 성공적으로 이동시켰습니다. 가용 면적이 소폭 증가했습니다.", rarity: "영웅", category: "생활", icon: "🗑️", color: "#6c8374" },
  { id: "laundry", action: "빨래했다", title: "섬유 관리 전문가", description: "사용 불가능 상태의 의류를 다시 착용 가능한 자원으로 복구했습니다. 지속 가능한 의생활에 기여했습니다.", rarity: "전설", category: "생활", icon: "🧺", color: "#af72d6" },
  { id: "reply", action: "답장을 했다", title: "인간관계 수호자", description: "읽고 지나칠 수도 있었지만, 생각을 문장으로 구성하여 실제로 전송했습니다. 관계 유지에 중대한 기여를 했습니다.", rarity: "전설", category: "사회생활", icon: "💬", color: "#5865f2" },
  { id: "answer-call", action: "전화를 받았다", title: "통신 대응 전문가", description: "화면에 표시된 수신 버튼을 외면하지 않았습니다. 실시간 인간관계에 정면으로 대응했습니다.", rarity: "전설", category: "사회생활", icon: "📞", color: "#e46d3a" },
  { id: "outside", action: "밖에 나갔다", title: "생활권 확장 개척자", description: "익숙한 실내 공간을 벗어나 외부 세계에 실제 모습을 드러냈습니다. 활동 반경이 크게 확장되었습니다.", rarity: "전설", category: "사회생활", icon: "🚪", color: "#4aa66e" },
  { id: "contact-first", action: "먼저 연락했다", title: "관계 개척자", description: "상대방의 선제 행동을 기다리지 않고 직접 대화를 개시했습니다. 매우 이례적인 사회적 주도성이 관측되었습니다.", rarity: "신화", category: "사회생활", icon: "👋", color: "#ec4f7a" },
  { id: "study-five", action: "공부를 5분 했다", title: "지식 흡수 시도자", description: "무려 5분 동안 새로운 정보를 뇌와 접촉시켰습니다. 학문적 진전 가능성이 확인되었습니다.", rarity: "영웅", category: "공부·일", icon: "📚", color: "#7c6bf2" },
  { id: "open-file", action: "과제/업무 파일을 열었다", title: "시작이 반인 자", description: "파일을 열어 과업과 최초로 대면했습니다. 완료 여부와 관계없이 이미 절반에 도달했다는 분석입니다.", rarity: "전설", category: "공부·일", icon: "📂", color: "#d17c2f" },
  { id: "finish-task", action: "할 일 하나를 끝냈다", title: "생산성의 화신", description: "계획으로만 존재하던 일을 현실 세계에서 하나 제거했습니다. 오늘의 생산성이 공식적으로 입증되었습니다.", rarity: "신화", category: "공부·일", icon: "✅", color: "#e44f6f" },
  { id: "check-mail", action: "메일/알림을 확인했다", title: "사회생활 관찰자", description: "쌓여가는 숫자를 더 이상 외면하지 않고 직접 확인했습니다. 아직 답장은 하지 않았지만 상당한 진전입니다.", rarity: "희귀", category: "공부·일", icon: "📧", color: "#38a8ff" },
  { id: "alarm", action: "알람 끄고 다시 자지 않았다", title: "유혹을 물리친 자", description: "알람을 종료한 뒤 침대로 복귀하지 않는 고난도 판단을 수행했습니다. 강력한 자제력이 확인되었습니다.", rarity: "신화", category: "생존", icon: "⏰", color: "#d64c3e" },
  { id: "charge", action: "휴대폰을 충전했다", title: "에너지 공급 책임자", description: "방전 위기에 놓인 핵심 통신 장비에 전력을 공급했습니다. 미래의 자신을 위한 선제적 조치입니다.", rarity: "희귀", category: "생활", icon: "🔋", color: "#5c86e8" },
  { id: "window", action: "창문을 열었다", title: "대기 순환 관리자", description: "실내와 외부의 공기 교환을 직접 개시했습니다. 거주 환경의 대기 정책에 중요한 변화가 발생했습니다.", rarity: "희귀", category: "생활", icon: "🪟", color: "#55a7c4" },
  { id: "make-bed", action: "침대를 정리했다", title: "수면 시설 관리관", description: "사용을 마친 수면 시설을 정상 운영 상태로 복구했습니다. 다음 이용자를 위한 준비까지 완료되었습니다.", rarity: "영웅", category: "생활", icon: "🛌", color: "#8a6cc3" },
  { id: "nothing", action: "아무것도 안 했다", title: "존재만으로 하루를 채운 자", description: "별도의 생산 활동 없이도 오늘이라는 시간을 여기까지 이끌고 왔습니다. 존재 자체만으로 하루의 연속성을 유지하는 데 성공했습니다.", rarity: "신화", category: "미스터리", icon: "🫥", color: "#222222" },
];

const hiddenAchievements: Achievement[] = [
  { id: "returner", action: "앱에 세 번 방문했다", title: "딱히 할 일은 없지만 돌아온 자", description: "칭찬부의 문을 세 번이나 두드렸습니다. 지속적인 관심으로 분류합니다.", rarity: "희귀", category: "미스터리", icon: "🐾", color: "#d97b29", hidden: true },
  { id: "night", action: "새벽 3시에 앱을 열었다", title: "밤을 지배하지 못한 자", description: "모두가 잠든 시각에도 업적 심사를 요청했습니다.", rarity: "신화", category: "미스터리", icon: "🌙", color: "#5146a8", hidden: true },
  { id: "specialist", action: "같은 행동을 다섯 번 보관했다", title: "한 우물만 파는 자", description: "반복은 실력입니다. 같은 분야에서 압도적인 전문성을 확보했습니다.", rarity: "영웅", category: "미스터리", icon: "⛏️", color: "#a86b2d", hidden: true },
  { id: "addicted", action: "업적을 받고 바로 하나 더 달성했다", title: "칭찬에 중독된 자", description: "한 번의 인정으로 만족하지 못하고 즉시 추가 심사를 요청했습니다.", rarity: "전설", category: "미스터리", icon: "💥", color: "#ec4f7a", hidden: true },
  { id: "ten", action: "업적을 열 번 보관했다", title: "이 정도면 정말 대단한 자", description: "사소한 하루들이 모여 부정하기 어려운 규모의 성과가 되었습니다.", rarity: "신화", category: "미스터리", icon: "👑", color: "#d59a11", hidden: true },
];

const catalogAchievements = [...coreAchievements, ...hiddenAchievements];
const initialStats: AchievementStats = { visits: 0, totalStored: 0, actionCounts: {} };
const judgingMessages = ["오늘의 활동을 심사하고 있습니다...", "국가적 성과 여부 확인 중...", "성과 확인."] as const;

const rarityLabel: Record<string, string> = {
  일반: "COMMON",
  희귀: "RARE",
  영웅: "EPIC",
  전설: "LEGENDARY",
  신화: "MYTHIC",
};

function todayLabel() {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function issuedTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }).format(date);
}

function issuedCardLabel(date: Date) {
  const day = `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}`;
  return `${day} ${issuedTimeLabel(date)}`;
}

function earnedDateLabel(value?: string) {
  if (!value) return "마지막 달성 기록 확인 중";
  return `마지막 달성: ${new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(value))}`;
}

function parseStoredJson<T>(value: string | null, fallback: T): T {
  try { return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}

function playFanfare(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.1);
  master.connect(ctx.destination);

  [261.63, 329.63, 392, 523.25, 659.25].forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = index < 3 ? "sawtooth" : "triangle";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.13);
    gain.gain.exponentialRampToValueAtTime(index === 4 ? 0.45 : 0.2, ctx.currentTime + index * 0.13 + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.13 + 0.65);
    osc.connect(gain).connect(master);
    osc.start(ctx.currentTime + index * 0.13);
    osc.stop(ctx.currentTime + index * 0.13 + 0.7);
  });

  const noiseLength = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLength);
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  noise.buffer = buffer;
  noiseGain.gain.value = 0.09;
  noise.connect(noiseGain).connect(master);
  noise.start(ctx.currentTime + 0.48);
  window.setTimeout(() => ctx.close(), 2400);
}

function StampOfficer({ mood = "neutral", small = false }: { mood?: "neutral" | "happy"; small?: boolean }) {
  return (
    <div className={`officer ${small ? "officer--small" : ""}`} aria-label="칭찬 공무원 병아리 캐릭터">
      <div className="officer__figure">
        <div className="officer__hair" />
        <div className="officer__hair-bridge" />
        <div className="officer__face">
          <span className="officer__eye officer__eye--left" />
          <span className="officer__eye officer__eye--right" />
          <span className={`officer__mouth ${mood === "happy" ? "officer__mouth--happy" : ""}`} />
        </div>
        <div className="officer__body">
          <i className="officer__collar officer__collar--left" />
          <i className="officer__collar officer__collar--right" />
          <b className="officer__tie" />
          <span>칭찬부</span>
        </div>
      </div>
    </div>
  );
}

function Badge({ item, locked = false, large = false }: { item: Achievement; locked?: boolean; large?: boolean }) {
  return (
    <div className={`badge ${large ? "badge--large" : ""} ${locked ? "badge--locked" : ""}`} style={{ "--badge-color": item.color } as React.CSSProperties}>
      <span className="badge__rays" />
      <span className="badge__ring"><b>{locked ? "🔒" : item.icon}</b></span>
      <span className="badge__ribbon">{locked ? "미획득" : rarityLabel[item.rarity]}</span>
    </div>
  );
}

function Confetti() {
  return <div className="confetti" aria-hidden="true">{Array.from({ length: 34 }).map((_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [selected, setSelected] = useState<Achievement>(coreAchievements[0]);
  const [issuedAt, setIssuedAt] = useState(() => new Date());
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [earnedDates, setEarnedDates] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<AchievementStats>(initialStats);
  const [dailyAchievements, setDailyAchievements] = useState<DailyAchievements>(() => ({ dateKey: localDateKey(), ids: [] }));
  const [hiddenNotice, setHiddenNotice] = useState("");
  const [resultCardReady, setResultCardReady] = useState(false);
  const [chainStartedAt, setChainStartedAt] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [category, setCategory] = useState<"전체" | Category>("전체");
  const [notice, setNotice] = useState("");
  const [cardBusy, setCardBusy] = useState<"share" | "save" | null>(null);
  const [secretQueue, setSecretQueue] = useState<Achievement[]>([]);
  const [judgingStep, setJudgingStep] = useState(0);
  const initialized = useRef(false);
  const resultCard = useRef<HTMLElement>(null);

  const navigateTo = (nextView: View, mode: "push" | "replace" = "push") => {
    if (typeof window !== "undefined") {
      const nextState = { ...(window.history.state ?? {}), goodjobMeView: nextView };
      if (mode === "replace") window.history.replaceState(nextState, "", window.location.href);
      else window.history.pushState(nextState, "", window.location.href);
    }
    setView(nextView);
  };

  useEffect(() => {
    window.history.replaceState(
      { ...(window.history.state ?? {}), goodjobMeView: "home" },
      "",
      window.location.href,
    );
    const handlePopState = (event: PopStateEvent) => {
      const previousView = event.state?.goodjobMeView;
      setView(previousView === "pick" || previousView === "result" || previousView === "collection" ? previousView : "home");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [savedAchievements, savedDates, savedStats, savedSound, savedDaily] = await Promise.all([
          readAppValue("great-today-unlocked"),
          readAppValue("great-today-earned-dates"),
          readAppValue("great-today-stats"),
          readAppValue("great-today-sound"),
          readAppValue("great-today-daily"),
        ]);
        const savedIds = parseStoredJson<string[]>(savedAchievements, []);
        const savedEarnedDates = parseStoredJson<Record<string, string>>(savedDates, {});
        const savedAchievementStats = parseStoredJson<AchievementStats>(savedStats, initialStats);
        const availableIds = new Set(catalogAchievements.map((item) => item.id));
        const nextUnlocked = savedIds.filter((id) => availableIds.has(id));
        const migratedCounts = { ...(savedAchievementStats.actionCounts || {}) };
        nextUnlocked.forEach((id) => { migratedCounts[id] ||= 1; });
        const countedTotal = coreAchievements.reduce((total, item) => total + (migratedCounts[item.id] || 0), 0);
        const nextStats = { ...initialStats, ...savedAchievementStats, visits: (savedAchievementStats.visits || 0) + 1, totalStored: Math.max(savedAchievementStats.totalStored || 0, countedTotal), actionCounts: migratedCounts };
        const storedDaily = parseStoredJson<DailyAchievements>(savedDaily, { dateKey: localDateKey(), ids: [] });
        const today = localDateKey();
        const nextDaily = storedDaily.dateKey === today
          ? { dateKey: today, ids: storedDaily.ids.filter((id) => coreAchievements.some((item) => item.id === id)) }
          : { dateKey: today, ids: [] };
        const automaticUnlocks: string[] = [];
        if (nextStats.visits >= 3 && !nextUnlocked.includes("returner")) automaticUnlocks.push("returner");
        if (new Date().getHours() === 3 && !nextUnlocked.includes("night")) automaticUnlocks.push("night");
        const unlockedNow = [...nextUnlocked, ...automaticUnlocks];
        const now = new Date().toISOString();
        const nextDates = { ...savedEarnedDates };
        nextUnlocked.forEach((id) => { nextDates[id] ||= now; });
        automaticUnlocks.forEach((id) => { nextDates[id] = now; });
        automaticUnlocks.forEach((id) => { nextStats.actionCounts[id] ||= 1; });
        setUnlocked(unlockedNow);
        setEarnedDates(nextDates);
        setStats(nextStats);
        setDailyAchievements(nextDaily);
        if (automaticUnlocks.length) {
          const secrets = automaticUnlocks
            .map((id) => hiddenAchievements.find((item) => item.id === id))
            .filter((item): item is Achievement => Boolean(item));
          setHiddenNotice(`숨겨진 업적 ${automaticUnlocks.length}개가 조용히 승인되었습니다.`);
          window.setTimeout(() => setSecretQueue((current) => [...current, ...secrets]), 450);
        }
        setSoundOn(savedSound !== "off");
      } catch { /* device storage may be unavailable */ }
      initialized.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    void writeAppValue("great-today-unlocked", JSON.stringify(unlocked));
  }, [unlocked]);

  useEffect(() => {
    if (!initialized.current) return;
    void writeAppValue("great-today-earned-dates", JSON.stringify(earnedDates));
  }, [earnedDates]);

  useEffect(() => {
    if (!initialized.current) return;
    void writeAppValue("great-today-stats", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (!initialized.current) return;
    void writeAppValue("great-today-daily", JSON.stringify(dailyAchievements));
  }, [dailyAchievements]);

  useEffect(() => {
    const refreshDailyState = () => {
      const today = localDateKey();
      setDailyAchievements((current) => current.dateKey === today ? current : { dateKey: today, ids: [] });
    };
    const timer = window.setInterval(refreshDailyState, 60_000);
    document.addEventListener("visibilitychange", refreshDailyState);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshDailyState);
    };
  }, []);

  useEffect(() => {
    if (view !== "judging") return;
    const timers = [
      window.setTimeout(() => setJudgingStep(1), 600),
      window.setTimeout(() => setJudgingStep(2), 1200),
      window.setTimeout(() => {
        window.history.replaceState(
          { ...(window.history.state ?? {}), goodjobMeView: "result" },
          "",
          window.location.href,
        );
        setView("result");
        playFanfare(soundOn);
        void triggerAchievementHaptic();
      }, 1900),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [view, soundOn]);

  const registerAchievement = (item: Achievement, now: Date) => {
    const nextActionCount = (stats.actionCounts[item.id] || 0) + 1;
    const nextStats: AchievementStats = {
      ...stats,
      totalStored: stats.totalStored + 1,
      actionCounts: { ...stats.actionCounts, [item.id]: nextActionCount },
    };
    const bonusIds: string[] = [];
    if (nextActionCount >= 5 && !unlocked.includes("specialist")) bonusIds.push("specialist");
    if (chainStartedAt && now.getTime() - chainStartedAt < 5 * 60 * 1000 && !unlocked.includes("addicted")) bonusIds.push("addicted");
    if (nextStats.totalStored >= 10 && !unlocked.includes("ten")) bonusIds.push("ten");
    bonusIds.forEach((id) => { nextStats.actionCounts[id] ||= 1; });
    const nextUnlocked = Array.from(new Set([...unlocked, item.id, ...bonusIds]));
    const storedAt = now.toISOString();
    setUnlocked(nextUnlocked);
    setEarnedDates((current) => {
      const next = { ...current, [item.id]: storedAt };
      bonusIds.forEach((id) => { next[id] = storedAt; });
      return next;
    });
    setStats(nextStats);
    setDailyAchievements((current) => {
      const today = localDateKey(now);
      const ids = current.dateKey === today ? current.ids : [];
      return { dateKey: today, ids: Array.from(new Set([...ids, item.id])) };
    });
    setHiddenNotice(bonusIds.length ? `숨겨진 업적 ${bonusIds.length}개를 추가 발견했습니다.` : "업적이 도감에 정식 보관되었습니다.");
    if (bonusIds.length) {
      const secrets = bonusIds
        .map((id) => hiddenAchievements.find((hidden) => hidden.id === id))
        .filter((hidden): hidden is Achievement => Boolean(hidden));
      window.setTimeout(() => setSecretQueue((current) => [...current, ...secrets]), 2350);
    }
    setChainStartedAt(null);
  };

  const earn = (item: Achievement) => {
    const now = new Date();
    const today = localDateKey(now);
    const completedToday = dailyAchievements.dateKey === today ? dailyAchievements.ids : [];
    if (completedToday.includes(item.id)) {
      setDailyAchievements({ dateKey: today, ids: completedToday });
      setNotice("해당 분야의 금일 실적은 충분합니다.");
      window.setTimeout(() => setNotice(""), 2400);
      return;
    }
    setSelected(item);
    setIssuedAt(now);
    registerAchievement(item, now);
    setJudgingStep(0);
    navigateTo("judging");
  };

  useEffect(() => {
    if (view !== "result" || !resultCard.current) {
      setResultCardReady(false);
      return;
    }
    let active = true;
    setResultCardReady(false);
    void (document.fonts?.ready ?? Promise.resolve()).then(() => {
      window.requestAnimationFrame(() => { if (active && resultCard.current) setResultCardReady(true); });
    });
    return () => { active = false; };
  }, [issuedAt, selected, view]);

  const handleShare = async () => {
    setCardBusy("share");
    try {
      const card = await createAchievementCard({ ...selected, issuedAt }, resultCard.current);
      const method = await shareAchievementImage(card.blob, card.dataUrl, card.fileName, selected.title, selected.action, selected.rarity);
      setNotice(method === "image" ? "업적 이미지 공유창을 열었습니다." : method === "toss-saved" ? "카드를 저장하고 토스 공유창을 열었습니다." : method === "toss" ? "토스 공유창을 열었습니다." : method === "web" ? "공유창을 열었습니다." : "업적 문구를 복사했습니다.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setNotice("공유하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCardBusy(null);
    }
    window.setTimeout(() => setNotice(""), 2400);
  };

  const handleSaveCard = async () => {
    setCardBusy("save");
    try {
      const card = await createAchievementCard({ ...selected, issuedAt }, resultCard.current);
      const method = await saveAchievementImage(card.dataUrl, card.fileName);
      setNotice(method === "toss" ? "업적 카드를 기기에 저장했습니다." : "업적 카드 다운로드를 시작했습니다.");
    } catch {
      setNotice("카드를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCardBusy(null);
    }
    window.setTimeout(() => setNotice(""), 2400);
  };

  const todayIds = dailyAchievements.dateKey === localDateKey() ? dailyAchievements.ids : [];
  const filtered = useMemo(() => category === "전체" ? catalogAchievements : catalogAchievements.filter((item) => item.category === category), [category]);
  const progress = Math.round((unlocked.length / catalogAchievements.length) * 100);

  return (
    <main className={`app-shell view-${view} ${view === "result" && selected.id === "nothing" ? "view-result--mythic" : ""} ${secretQueue.length ? "is-secret-reveal" : ""}`}>
      <div className="grain" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" onClick={() => navigateTo("home")} aria-label="홈으로 이동">
          <span className="brand__seal" aria-hidden="true">
            <i className="brand__eye brand__eye--left" />
            <i className="brand__eye brand__eye--right" />
            <i className="brand__beak" />
          </span>
          <span><b>오늘도</b><strong>대단한 척</strong></span>
        </button>
      </header>

      {view === "home" && (
        <section className="home-screen screen-enter" aria-labelledby="home-title">
          <div className="date-pill"><span />{todayLabel()} · 업적 심사 가능</div>
          <div className="hero-copy">
            <p className="eyebrow">칭찬부 공식 일일 심사</p>
            <h1 id="home-title">오늘<br /><em>뭐라도</em> 했나요?</h1>
            <p>대단하지 않아도 됩니다.<br />저희가 대단하게 만들어 드립니다.</p>
          </div>
          <div className="hero-stage">
            <span className="orbit orbit--one">+</span><span className="orbit orbit--two">✦</span>
            <StampOfficer />
            <div className="speech-bubble">흠… 본인이 해낸 일을<br /><strong>숨김없이 진술하세요.</strong></div>
          </div>
          <div className="home-actions">
            <button className="primary-button" onClick={() => navigateTo("pick")}><span>네, 무려 뭔가 했습니다.</span><b>→</b></button>
            <button className="text-button" onClick={() => earn(coreAchievements.find((item) => item.id === "nothing")!)}>아무것도 안했습니다.</button>
          </div>
          <div className="today-proof"><span>{todayIds.length}</span><p>오늘 인정받은<br /><b>대단한 업적</b></p><i>칭찬부<br />확인</i></div>
        </section>
      )}

      {view === "judging" && (
        <section className="judging-screen" aria-live="assertive" aria-label="업적 심사 중">
          <div className="judging-screen__scanner" aria-hidden="true"><i /><i /><i /></div>
          <p className="judging-screen__code">ACHIEVEMENT REVIEW SYSTEM</p>
          <p className="judging-screen__message" key={judgingStep}>{judgingMessages[judgingStep]}</p>
          <div className="judging-screen__progress" aria-hidden="true">
            {judgingMessages.map((_, index) => <i className={index <= judgingStep ? "active" : ""} key={index} />)}
          </div>
        </section>
      )}

      {view === "pick" && (
        <section className="pick-screen screen-enter" aria-labelledby="pick-title">
          <div className="section-heading">
            <p className="eyebrow">오늘의 업적 신고서</p>
            <h1 id="pick-title">무슨 대단한 일을<br />해내셨나요?</h1>
            <p>하나만 고르세요. 겸손은 심사에 반영되지 않습니다.</p>
          </div>
          <div className="action-list">
            {coreAchievements.filter((item) => item.id !== "nothing").map((item, index) => {
              const completedToday = todayIds.includes(item.id);
              return (
              <button className={`action-card ${completedToday ? "action-card--completed" : ""}`} aria-label={completedToday ? `${item.action}, 오늘 달성 완료` : item.action} key={item.id} onClick={() => earn(item)} style={{ "--delay": `${index * 35}ms`, "--accent": item.color } as React.CSSProperties}>
                <span className="action-card__number">{String(index + 1).padStart(2, "0")}</span>
                <span><b>{item.action}</b><small>{completedToday ? "해당 분야의 금일 실적은 충분합니다." : `${item.category} 업적 · ${item.rarity} 후보`}</small></span>
                <i>{completedToday ? "✓" : "→"}</i>
              </button>
            );})}
          </div>
        </section>
      )}

      {view === "result" && (
        <section className="result-screen result-screen--card screen-enter" aria-live="polite" aria-label={`${selected.rarity} 등급 업적 ${selected.title} 달성 결과`}>
          <Confetti />
          <article
            className="achievement-card"
            ref={resultCard}
            style={{ "--achievement-color": selected.color } as React.CSSProperties}
          >
            <div className="achievement-card__grain" aria-hidden="true" />
            <header className="achievement-card__header">
              <div className="brand achievement-card__brand" aria-label="오늘도 대단한 척">
                <span className="brand__seal" aria-hidden="true">
                  <i className="brand__eye brand__eye--left" />
                  <i className="brand__eye brand__eye--right" />
                  <i className="brand__beak" />
                </span>
                <span><b>오늘도</b><strong>대단한 척</strong></span>
              </div>
            </header>

            <p className="achievement-card__rarity">✦ {selected.rarity} 등급 업적 달성 ✦</p>
            <div className="achievement-card__medal"><Badge item={selected} large /></div>

            <div className="achievement-card__info">
              <span>{selected.action}</span>
              <h1>「{selected.title}」</h1>
              <p>오늘 달성 완료 <b>✓</b></p>
            </div>

            <section className="official-note achievement-card__official-note">
              <StampOfficer mood="happy" small />
              <p>
                <span>칭찬 공무원 공식 논평 · {issuedCardLabel(issuedAt)}</span>
                {selected.description}
              </p>
            </section>

            <footer className="achievement-card__footer">
              <p><span>✓</span> 업적관리국에 정식 등록되었습니다.</p>
              <small>실제로는 별것 아닐 수 있습니다.</small>
            </footer>
          </article>
          <div className="result-actions">
            <button className="secondary-button" onClick={handleShare} disabled={cardBusy !== null || !resultCardReady}>{!resultCardReady ? "카드 준비 중…" : cardBusy === "share" ? "카드 제작 중…" : "친구에게 자랑하기"}</button>
            <button className="secondary-button secondary-button--more" onClick={() => { setChainStartedAt(Date.now()); navigateTo("pick"); }}>하나 더 달성하기</button>
          </div>
          <button className="card-save-button" onClick={handleSaveCard} disabled={cardBusy !== null || !resultCardReady}>{!resultCardReady ? "카드 준비 중…" : cardBusy === "save" ? "고화질 카드를 만드는 중…" : "PNG 카드 이미지 저장 ↓"}</button>
        </section>
      )}

      {view === "collection" && (
        <section className="collection-screen screen-enter" aria-labelledby="collection-title">
          <div className="section-heading collection-heading">
            <p className="eyebrow">국가 공인 아님 · 기기 내 저장</p>
            <h1 id="collection-title">나의 대단한<br />업적 도감</h1>
            <div className="progress-card"><span><b>{unlocked.length}</b> / {catalogAchievements.length} 획득</span><div><i style={{ width: `${progress}%` }} /></div><em>{progress}%</em></div>
          </div>
          {hiddenNotice && <div className="collection-notice" role="status"><span>칭찬부 속보</span>{hiddenNotice}<button onClick={() => setHiddenNotice("")} aria-label="알림 닫기">×</button></div>}
          <div className="category-tabs" role="tablist" aria-label="업적 카테고리">
            {(["전체", "생존", "생활", "사회생활", "공부·일", "미스터리"] as const).map((item) => <button role="tab" aria-selected={category === item} className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="badge-grid">
            {filtered.map((item) => {
              const isUnlocked = unlocked.includes(item.id);
              const achievementCount = stats.actionCounts[item.id] || (isUnlocked ? 1 : 0);
              return <article className={`collection-card ${isUnlocked ? "" : "locked"} ${item.hidden ? "collection-card--hidden" : ""}`} key={item.id}><Badge item={item} locked={!isUnlocked} /><span>{item.hidden ? "숨겨진 업적" : item.category} · {isUnlocked ? "획득 완료" : "미획득"}</span><h2>{isUnlocked ? item.title : "아직 대단해지지 않은 업적입니다."}</h2><p>{isUnlocked ? `총 ${achievementCount}회 달성` : "첫 달성을 기다리고 있습니다."}</p>{isUnlocked && <time dateTime={earnedDates[item.id]}>{earnedDateLabel(earnedDates[item.id])}</time>}</article>;
            })}
          </div>
        </section>
      )}

      {secretQueue[0] && (
        <div className="secret-reveal" role="dialog" aria-modal="true" aria-labelledby="secret-title">
          <Confetti />
          <div className="secret-reveal__panel">
            <p className="secret-reveal__warning">⚠️ 예상하지 못한 성과가 감지되었습니다.</p>
            <p className="secret-reveal__label">SECRET ACHIEVEMENT</p>
            <Badge item={secretQueue[0]} large />
            <span className="secret-reveal__grade">{secretQueue[0].rarity} 등급 · 숨겨진 업적</span>
            <h2 id="secret-title">「{secretQueue[0].title}」</h2>
            <p className="secret-reveal__description">{secretQueue[0].description}</p>
            <button onClick={() => setSecretQueue((current) => current.slice(1))}>성과 확인 완료</button>
            {secretQueue.length > 1 && <small>대기 중인 비정상 성과 {secretQueue.length - 1}건</small>}
          </div>
        </div>
      )}

      {notice && <div className="toast" role="status">{notice}</div>}

      <nav className="bottom-nav" aria-label="주요 메뉴">
        <button className={view !== "collection" ? "active" : ""} onClick={() => navigateTo("home")}><i>✦</i><span>오늘</span></button>
        <button className={view === "collection" ? "active" : ""} onClick={() => navigateTo("collection")}><i>▦</i><span>업적 도감</span>{unlocked.length > 0 && <b>{unlocked.length}</b>}</button>
      </nav>
    </main>
  );
}
