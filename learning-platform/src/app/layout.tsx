import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "학습 플랫폼",
  description: "문제집·강의·진도·로드맵 통합 관리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
