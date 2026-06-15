"use client";

import { LoginView } from "./LoginView";
import { useAuth } from "./useAuth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="empty-state">로그인 상태를 확인하는 중입니다.</div>;
  }

  if (!user) {
    return <LoginView />;
  }

  return <>{children}</>;
}
