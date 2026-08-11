"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { readAppValue, saveAchievementImage, shareAchievementImage, triggerAchievementHaptic, writeAppValue } from "./apps-in-toss";
import { createAchievementCard } from "./share-card";

type Rarity = "�Ϲ�" | "���" | "����" | "����" | "��ȭ";
type Category = "����" | "��Ȱ" | "��ȸ��Ȱ" | "���Ρ���" | "�̽��͸�";
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
  { id: "wake", action: "ħ�뿡�� �Ͼ��", title: "�߷��� �̰ܳ� ��", description: "������ �� ���� ���� ����� ���������, ���� ���� ���·� ��ȯ�ϴ� �� �����߽��ϴ�.", rarity: "����", category: "����", icon: "???", color: "#ff6b35" },
  { id: "water", action: "���� ���̴�", title: "���� ���� ������", description: "������ �ʼ����� ��ü �ڿ��� ���� Ȯ���Ͽ� ü���� �����߽��ϴ�. �ſ� �������� �Ǵ��Դϴ�.", rarity: "���", category: "����", icon: "??", color: "#38a8ff" },
  { id: "meal", action: "���� �Ծ���", title: "����� Ȯ�� ����", description: "������ ���� Ȱ���� �ʿ��� �ڿ��� ���������� �����߽��ϴ�. ��а� ������ ������ ������ �����˴ϴ�.", rarity: "����", category: "����", icon: "??", color: "#00a878" },
  { id: "wash", action: "�ľ���", title: "û���� ��ȣ��", description: "���� �������� Ȱ���Ͽ� ���� ���� ������ ũ�� �����׽��ϴ�. ������ȸ ������ �⿩�߽��ϴ�.", rarity: "����", category: "��Ȱ", icon: "??", color: "#7c6bf2" },
  { id: "brush", action: "��ġ�ߴ�", title: "���� ��� ü�� ����", description: "ġ�� ��� �ý����� ���� �����߽��ϴ�. ���� �� ��ȭ�� ��а� ������ ������ ����˴ϴ�.", rarity: "����", category: "��Ȱ", icon: "??", color: "#6b8de3" },
  { id: "dishes", action: "�������ߴ�", title: "�׸� �ع決", description: "��ũ�뿡 ��Ⱓ ����Ǿ� �ִ� �׸����� �����߽��ϴ�. �ֹ��� ������ ȸ���Ǿ����ϴ�.", rarity: "����", category: "��Ȱ", icon: "???", color: "#f09b3d" },
  { id: "trash", action: "�����⸦ ���ȴ�", title: "���� ��ȭ��", description: "���ʿ��� ��ü�� ��Ȱ�� ������ ���������� �̵����׽��ϴ�. ���� ������ ���� �����߽��ϴ�.", rarity: "����", category: "��Ȱ", icon: "???", color: "#6c8374" },
  { id: "laundry", action: "�����ߴ�", title: "���� ���� ������", description: "��� �Ұ��� ������ �Ƿ��� �ٽ� ���� ������ �ڿ����� �����߽��ϴ�. ���� ������ �ǻ�Ȱ�� �⿩�߽��ϴ�.", rarity: "����", category: "��Ȱ", icon: "??", color: "#af72d6" },
  { id: "reply", action: "������ �ߴ�", title: "�ΰ����� ��ȣ��", description: "�а� ����ĥ ���� �־�����, ������ �������� �����Ͽ� ������ �����߽��ϴ�. ���� ������ �ߴ��� �⿩�� �߽��ϴ�.", rarity: "����", category: "��ȸ��Ȱ", icon: "??", color: "#5865f2" },
  { id: "answer-call", action: "��ȭ�� �޾Ҵ�", title: "��� ���� ������", description: "ȭ�鿡 ǥ�õ� ���� ��ư�� �ܸ����� �ʾҽ��ϴ�. �ǽð� �ΰ����迡 �������� �����߽��ϴ�.", rarity: "����", category: "��ȸ��Ȱ", icon: "??", color: "#e46d3a" },
  { id: "outside", action: "�ۿ� ������", title: "��Ȱ�� Ȯ�� ��ô��", description: "�ͼ��� �ǳ� ������ ��� �ܺ� ���迡 ���� ����� �巯�½��ϴ�. Ȱ�� �ݰ��� ũ�� Ȯ��Ǿ����ϴ�.", rarity: "����", category: "��ȸ��Ȱ", icon: "??", color: "#4aa66e" },
  { id: "contact-first", action: "���� �����ߴ�", title: "���� ��ô��", description: "������ ���� �ൿ�� ��ٸ��� �ʰ� ���� ��ȭ�� �����߽��ϴ�. �ſ� �̷����� ��ȸ�� �ֵ����� �����Ǿ����ϴ�.", rarity: "��ȭ", category: "��ȸ��Ȱ", icon: "??", color: "#ec4f7a" },
  { id: "study-five", action: "���θ� 5�� �ߴ�", title: "���� ���� �õ���", description: "���� 5�� ���� ���ο� ������ ���� ���˽��׽��ϴ�. �й��� ���� ���ɼ��� Ȯ�εǾ����ϴ�.", rarity: "����", category: "���Ρ���", icon: "??", color: "#7c6bf2" },
  { id: "open-file", action: "����/���� ������ ������", title: "������ ���� ��", description: "������ ���� ������ ���ʷ� ����߽��ϴ�. �Ϸ� ���ο� ������� �̹� ���ݿ� �����ߴٴ� �м��Դϴ�.", rarity: "����", category: "���Ρ���", icon: "??", color: "#d17c2f" },
  { id: "finish-task", action: "�� �� �ϳ��� ���´�", title: "���꼺�� ȭ��", description: "��ȹ���θ� �����ϴ� ���� ���� ���迡�� �ϳ� �����߽��ϴ�. ������ ���꼺�� ���������� �����Ǿ����ϴ�.", rarity: "��ȭ", category: "���Ρ���", icon: "?", color: "#e44f6f" },
  { id: "check-mail", action: "����/�˸��� Ȯ���ߴ�", title: "��ȸ��Ȱ ������", description: "�׿����� ���ڸ� �� �̻� �ܸ����� �ʰ� ���� Ȯ���߽��ϴ�. ���� ������ ���� �ʾ����� ����� �����Դϴ�.", rarity: "���", category: "���Ρ���", icon: "??", color: "#38a8ff" },
  { id: "alarm", action: "�˶� ���� �ٽ� ���� �ʾҴ�", title: "��Ȥ�� ����ģ ��", description: "�˶��� ������ �� ħ��� �������� �ʴ� ������ �Ǵ��� �����߽��ϴ�. ������ �������� Ȯ�εǾ����ϴ�.", rarity: "��ȭ", category: "����", icon: "?", color: "#d64c3e" },
  { id: "charge", action: "�޴����� �����ߴ�", title: "������ ���� å����", description: "���� ���⿡ ���� �ٽ� ��� ��� ������ �����߽��ϴ�. �̷��� �ڽ��� ���� ������ ��ġ�Դϴ�.", rarity: "���", category: "��Ȱ", icon: "??", color: "#5c86e8" },
  { id: "window", action: "â���� ������", title: "��� ��ȯ ������", description: "�ǳ��� �ܺ��� ���� ��ȯ�� ���� �����߽��ϴ�. ���� ȯ���� ��� ��å�� �߿��� ��ȭ�� �߻��߽��ϴ�.", rarity: "���", category: "��Ȱ", icon: "??", color: "#55a7c4" },
  { id: "make-bed", action: "ħ�븦 �����ߴ�", title: "���� �ü� ������", description: "����� ��ģ ���� �ü��� ���� � ���·� �����߽��ϴ�. ���� �̿��ڸ� ���� �غ���� �Ϸ�Ǿ����ϴ�.", rarity: "����", category: "��Ȱ", icon: "??", color: "#8a6cc3" },
  { id: "nothing", action: "�ƹ��͵� �� �ߴ�", title: "���縸���� �Ϸ縦 ä�� ��", description: "������ ���� Ȱ�� ���̵� �����̶�� �ð��� ������� �̲��� �Խ��ϴ�. ���� ��ü������ �Ϸ��� ���Ӽ��� �����ϴ� �� �����߽��ϴ�.", rarity: "��ȭ", category: "�̽��͸�", icon: "??", color: "#222222" },
];

const hiddenAchievements: Achievement[] = [
  { id: "returner", action: "�ۿ� �� �� �湮�ߴ�", title: "���� �� ���� ������ ���ƿ� ��", description: "Ī������ ���� �� ���̳� �ε�Ƚ��ϴ�. �������� �������� �з��մϴ�.", rarity: "���", category: "�̽��͸�", icon: "??", color: "#d97b29", hidden: true },
  { id: "night", action: "���� 3�ÿ� ���� ������", title: "���� �������� ���� ��", description: "��ΰ� ��� �ð����� ���� �ɻ縦 ��û�߽��ϴ�.", rarity: "��ȭ", category: "�̽��͸�", icon: "??", color: "#5146a8", hidden: true },
  { id: "specialist", action: "���� �ൿ�� �ټ� �� �����ߴ�", title: "�� �칰�� �Ĵ� ��", description: "�ݺ��� �Ƿ��Դϴ�. ���� �о߿��� �е����� �������� Ȯ���߽��ϴ�.", rarity: "����", category: "�̽��͸�", icon: "??", color: "#a86b2d", hidden: true },
  { id: "addicted", action: "������ �ް� �ٷ� �ϳ� �� �޼��ߴ�", title: "Ī���� �ߵ��� ��", description: "�� ���� �������� �������� ���ϰ� ��� �߰� �ɻ縦 ��û�߽��ϴ�.", rarity: "����", category: "�̽��͸�", icon: "??", color: "#ec4f7a", hidden: true },
  { id: "ten", action: "������ �� �� �����ߴ�", title: "�� ������ ���� ����� ��", description: "����� �Ϸ���� �� �����ϱ� ����� �Ը��� ������ �Ǿ����ϴ�.", rarity: "��ȭ", category: "�̽��͸�", icon: "??", color: "#d59a11", hidden: true },
];

const catalogAchievements = [...coreAchievements, ...hiddenAchievements];
const initialStats: AchievementStats = { visits: 0, totalStored: 0, actionCounts: {} };
const judgingMessages = ["������ Ȱ���� �ɻ��ϰ� �ֽ��ϴ�...", "������ ���� ���� Ȯ�� ��...", "���� Ȯ��."] as const;

const rarityLabel: Record<string, string> = {
  �Ϲ�: "COMMON",
  ���: "RARE",
  ����: "EPIC",
  ����: "LEGENDARY",
  ��ȭ: "MYTHIC",
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
  if (!value) return "������ �޼� ��� Ȯ�� ��";
  return `������ �޼�: ${new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(value))}`;
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
    <div className={`officer ${small ? "officer--small" : ""}`} aria-label="Ī�� ������ ���Ƹ� ĳ����">
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
          <span>Ī����</span>
        </div>
      </div>
    </div>
  );
}

function Badge({ item, locked = false, large = false }: { item: Achievement; locked?: boolean; large?: boolean }) {
  return (
    <div className={`badge ${large ? "badge--large" : ""} ${locked ? "badge--locked" : ""}`} style={{ "--badge-color": item.color } as React.CSSProperties}>
      <span className="badge__rays" />
      <span className="badge__ring"><b>{locked ? "??" : item.icon}</b></span>
      <span className="badge__ribbon">{locked ? "��ȹ��" : rarityLabel[item.rarity]}</span>
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
  const [category, setCategory] = useState<"��ü" | Category>("��ü");
  const [notice, setNotice] = useState("");
  const [cardBusy, setCardBusy] = useState<"share" | "save" | null>(null);
  const [secretQueue, setSecretQueue] = useState<Achievement[]>([]);
  const [judgingStep, setJudgingStep] = useState(0);
  const initialized = useRef(false);
  const resultCard = useRef<HTMLElement>(null);

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
          setHiddenNotice(`������ ���� ${automaticUnlocks.length}���� ������ ���εǾ����ϴ�.`);
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
      window.setTimeout(() => setJudgingStep(1), 400),
      window.setTimeout(() => setJudgingStep(2), 800),
      window.setTimeout(() => {
        setView("result");
        playFanfare(soundOn);
        void triggerAchievementHaptic();
      }, 1250),
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
    setHiddenNotice(bonusIds.length ? `������ ���� ${bonusIds.length}���� �߰� �߰��߽��ϴ�.` : "������ ������ ���� �����Ǿ����ϴ�.");
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
      setNotice("�ش� �о��� ���� ������ ����մϴ�.");
      window.setTimeout(() => setNotice(""), 2400);
      return;
    }
    setSelected(item);
    setIssuedAt(now);
    registerAchievement(item, now);
    setJudgingStep(0);
    setView("judging");
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
      setNotice(method === "image" ? "���� �̹��� ����â�� �������ϴ�." : method === "toss-saved" ? "ī�带 �����ϰ� �佺 ����â�� �������ϴ�." : method === "toss" ? "�佺 ����â�� �������ϴ�." : method === "web" ? "����â�� �������ϴ�." : "���� ������ �����߽��ϴ�.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setNotice("�������� ���߽��ϴ�. ��� �� �ٽ� �õ��� �ּ���.");
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
      setNotice(method === "toss" ? "���� ī�带 ��⿡ �����߽��ϴ�." : "���� ī�� �ٿ�ε带 �����߽��ϴ�.");
    } catch {
      setNotice("ī�带 �������� ���߽��ϴ�. ��� �� �ٽ� �õ��� �ּ���.");
    } finally {
      setCardBusy(null);
    }
    window.setTimeout(() => setNotice(""), 2400);
  };

  const todayIds = dailyAchievements.dateKey === localDateKey() ? dailyAchievements.ids : [];
  const filtered = useMemo(() => category === "��ü" ? catalogAchievements : catalogAchievements.filter((item) => item.category === category), [category]);
  const progress = Math.round((unlocked.length / catalogAchievements.length) * 100);

  return (
    <main className={`app-shell view-${view} ${view === "result" && selected.id === "nothing" ? "view-result--mythic" : ""} ${secretQueue.length ? "is-secret-reveal" : ""}`}>
      <div className="grain" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")} aria-label="Ȩ���� �̵�">
          <span className="brand__seal" aria-hidden="true">
            <i className="brand__eye brand__eye--left" />
            <i className="brand__eye brand__eye--right" />
            <i className="brand__beak" />
          </span>
          <span><b>���õ�</b><strong>����� ô</strong></span>
        </button>
      </header>

      {view === "home" && (
        <section className="home-screen screen-enter" aria-labelledby="home-title">
          <div className="date-pill"><span />{todayLabel()} �� ���� �ɻ� ����</div>
          <div className="hero-copy">
            <p className="eyebrow">Ī���� ���� ���� �ɻ�</p>
            <h1 id="home-title">����<br /><em>����</em> �߳���?</h1>
            <p>������� �ʾƵ� �˴ϴ�.<br />���� ����ϰ� ����� �帳�ϴ�.</p>
          </div>
          <div className="hero-stage">
            <span className="orbit orbit--one">+</span><span className="orbit orbit--two">?</span>
            <StampOfficer />
            <div className="speech-bubble">�졦 ������ �س� ����<br /><strong>������� �����ϼ���.</strong></div>
          </div>
          <div className="home-actions">
            <button className="primary-button" onClick={() => setView("pick")}><span>��, ���� ���� �߽��ϴ�.</span><b>��</b></button>
            <button className="text-button" onClick={() => earn(coreAchievements.find((item) => item.id === "nothing")!)}>�ƹ��͵� ���߽��ϴ�.</button>
          </div>
          <div className="today-proof"><span>{todayIds.length}</span><p>���� ��������<br /><b>����� ����</b></p><i>Ī����<br />Ȯ��</i></div>
        </section>
      )}

      {view === "judging" && (
        <section className="judging-screen" aria-live="assertive" aria-label="���� �ɻ� ��">
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
          <button className="back-button" onClick={() => setView("home")}>�� ���ư���</button>
          <div className="section-heading">
            <p className="eyebrow">������ ���� �Ű���</p>
            <h1 id="pick-title">���� ����� ����<br />�س��̳���?</h1>
            <p>�ϳ��� ��������. ����� �ɻ翡 �ݿ����� �ʽ��ϴ�.</p>
          </div>
          <div className="action-list">
            {coreAchievements.filter((item) => item.id !== "nothing").map((item, index) => {
              const completedToday = todayIds.includes(item.id);
              return (
              <button className={`action-card ${completedToday ? "action-card--completed" : ""}`} aria-label={completedToday ? `${item.action}, ���� �޼� �Ϸ�` : item.action} key={item.id} onClick={() => earn(item)} style={{ "--delay": `${index * 35}ms`, "--accent": item.color } as React.CSSProperties}>
                <span className="action-card__number">{String(index + 1).padStart(2, "0")}</span>
                <span><b>{item.action}</b><small>{completedToday ? "�ش� �о��� ���� ������ ����մϴ�." : `${item.category} ���� �� ${item.rarity} �ĺ�`}</small></span>
                <i>{completedToday ? "?" : "��"}</i>
              </button>
            );})}
          </div>
        </section>
      )}

      {view === "result" && (
        <section className="result-screen result-screen--card screen-enter" aria-live="polite" aria-label={`${selected.rarity} ��� ���� ${selected.title} �޼� ���`}>
          <Confetti />
          <article
            className="achievement-card"
            ref={resultCard}
            style={{ "--achievement-color": selected.color } as React.CSSProperties}
          >
            <div className="achievement-card__grain" aria-hidden="true" />
            <header className="achievement-card__header">
              <div className="brand achievement-card__brand" aria-label="���õ� ����� ô">
                <span className="brand__seal" aria-hidden="true">
                  <i className="brand__eye brand__eye--left" />
                  <i className="brand__eye brand__eye--right" />
                  <i className="brand__beak" />
                </span>
                <span><b>���õ�</b><strong>����� ô</strong></span>
              </div>
            </header>

            <p className="achievement-card__rarity">? {selected.rarity} ��� ���� �޼� ?</p>
            <div className="achievement-card__medal"><Badge item={selected} large /></div>

            <div className="achievement-card__info">
              <span>{selected.action}</span>
              <h1>��{selected.title}��</h1>
              <p>���� �޼� �Ϸ� <b>?</b></p>
            </div>

            <section className="official-note achievement-card__official-note">
              <StampOfficer mood="happy" small />
              <p>
                <span>Ī�� ������ ���� ���� �� {issuedCardLabel(issuedAt)}</span>
                {selected.description}
              </p>
            </section>

            <footer className="achievement-card__footer">
              <p><span>?</span> ������������ ���� ��ϵǾ����ϴ�.</p>
              <small>�����δ� ���� �ƴ� �� �ֽ��ϴ�.</small>
            </footer>
          </article>
          <div className="result-actions">
            <button className="secondary-button" onClick={handleShare} disabled={cardBusy !== null || !resultCardReady}>{!resultCardReady ? "ī�� �غ� �ߡ�" : cardBusy === "share" ? "ī�� ���� �ߡ�" : "ģ������ �ڶ��ϱ�"}</button>
            <button className="secondary-button secondary-button--more" onClick={() => { setChainStartedAt(Date.now()); setView("pick"); }}>�ϳ� �� �޼��ϱ�</button>
          </div>
          <button className="card-save-button" onClick={handleSaveCard} disabled={cardBusy !== null || !resultCardReady}>{!resultCardReady ? "ī�� �غ� �ߡ�" : cardBusy === "save" ? "��ȭ�� ī�带 ����� �ߡ�" : "PNG ī�� �̹��� ���� ��"}</button>
        </section>
      )}

      {view === "collection" && (
        <section className="collection-screen screen-enter" aria-labelledby="collection-title">
          <div className="section-heading collection-heading">
            <p className="eyebrow">���� ���� �ƴ� �� ��� �� ����</p>
            <h1 id="collection-title">���� �����<br />���� ����</h1>
            <div className="progress-card"><span><b>{unlocked.length}</b> / {catalogAchievements.length} ȹ��</span><div><i style={{ width: `${progress}%` }} /></div><em>{progress}%</em></div>
          </div>
          {hiddenNotice && <div className="collection-notice" role="status"><span>Ī���� �Ӻ�</span>{hiddenNotice}<button onClick={() => setHiddenNotice("")} aria-label="�˸� �ݱ�">��</button></div>}
          <div className="category-tabs" role="tablist" aria-label="���� ī�װ���">
            {(["��ü", "����", "��Ȱ", "��ȸ��Ȱ", "���Ρ���", "�̽��͸�"] as const).map((item) => <button role="tab" aria-selected={category === item} className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="badge-grid">
            {filtered.map((item) => {
              const isUnlocked = unlocked.includes(item.id);
              const achievementCount = stats.actionCounts[item.id] || (isUnlocked ? 1 : 0);
              return <article className={`collection-card ${isUnlocked ? "" : "locked"} ${item.hidden ? "collection-card--hidden" : ""}`} key={item.id}><Badge item={item} locked={!isUnlocked} /><span>{item.hidden ? "������ ����" : item.category} �� {isUnlocked ? "ȹ�� �Ϸ�" : "��ȹ��"}</span><h2>{isUnlocked ? item.title : "���� ��������� ���� �����Դϴ�."}</h2><p>{isUnlocked ? `�� ${achievementCount}ȸ �޼�` : "ù �޼��� ��ٸ��� �ֽ��ϴ�."}</p>{isUnlocked && <time dateTime={earnedDates[item.id]}>{earnedDateLabel(earnedDates[item.id])}</time>}</article>;
            })}
          </div>
        </section>
      )}

      {secretQueue[0] && (
        <div className="secret-reveal" role="dialog" aria-modal="true" aria-labelledby="secret-title">
          <Confetti />
          <div className="secret-reveal__panel">
            <p className="secret-reveal__warning">?? �������� ���� ������ �����Ǿ����ϴ�.</p>
            <p className="secret-reveal__label">SECRET ACHIEVEMENT</p>
            <Badge item={secretQueue[0]} large />
            <span className="secret-reveal__grade">{secretQueue[0].rarity} ��� �� ������ ����</span>
            <h2 id="secret-title">��{secretQueue[0].title}��</h2>
            <p className="secret-reveal__description">{secretQueue[0].description}</p>
            <button onClick={() => setSecretQueue((current) => current.slice(1))}>���� Ȯ�� �Ϸ�</button>
            {secretQueue.length > 1 && <small>��� ���� ������ ���� {secretQueue.length - 1}��</small>}
          </div>
        </div>
      )}

      {notice && <div className="toast" role="status">{notice}</div>}

      <nav className="bottom-nav" aria-label="�ֿ� �޴�">
        <button className={view !== "collection" ? "active" : ""} onClick={() => setView("home")}><i>?</i><span>����</span></button>
        <button className={view === "collection" ? "active" : ""} onClick={() => setView("collection")}><i>��</i><span>���� ����</span>{unlocked.length > 0 && <b>{unlocked.length}</b>}</button>
      </nav>
    </main>
  );
}

