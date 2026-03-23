import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오디오 노멀라이저 - 소리 크기 자동 보정",
  description:
    "오디오/비디오 파일의 소리 크기를 유튜브 표준에 맞게 자동으로 보정해주는 무료 도구입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-text-primary">
        {/* Deep space background */}
        <div className="bg-space" />

        {/* Aurora bands */}
        <div className="aurora-band aurora-band-1" />
        <div className="aurora-band aurora-band-2" />
        <div className="aurora-band aurora-band-3" />

        {/* Film grain */}
        <div className="noise-overlay" />

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
