import type { Metadata } from "next";
import { AuthGate } from "@/features/auth/AuthGate";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { HeaderNav } from "./HeaderNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardfolio",
  description: "포켓몬 카드 재고와 판매 흐름을 관리하는 모바일 우선 장부",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <div className="app-shell">
            <header className="app-header">
              <div className="brand">
                <span className="brand__eyebrow">Collector portfolio</span>
                <h1 className="brand__title">Cardfolio</h1>
                <p className="brand__description">
                  카드 앨범처럼 재고를 넘기고, 판매 기록까지 빠르게 남기세요.
                </p>
              </div>
              <HeaderNav />
            </header>
            <AuthGate>{children}</AuthGate>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
