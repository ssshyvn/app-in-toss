import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const image = `${protocol}://${host}/og.png`;

  return {
    title: "오늘도 대단한 척",
    description: "아주 사소한 오늘의 행동을 거창한 RPG 업적으로 만들어주는 칭찬 앱",
    applicationName: "오늘도 대단한 척",
    openGraph: {
      title: "오늘도 대단한 척",
      description: "별것 아닌 일도 전설적인 업적으로 인정해 드립니다.",
      type: "website",
      images: [{ url: image, width: 1731, height: 909, alt: "오늘도 대단한 척 - 전설 등급 업적 달성" }],
    },
    twitter: { card: "summary_large_image", title: "오늘도 대단한 척", description: "오늘도 뭐라도 했다면, 이미 대단합니다.", images: [image] },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f0df",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
