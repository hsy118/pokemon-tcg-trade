"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, LayoutDashboard, LogOut, ShoppingBag } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";

const navItems = [
  { href: "/", label: "홈", icon: LayoutDashboard },
  { href: "/trades", label: "거래", icon: ShoppingBag },
  { href: "/timeline", label: "타임라인", icon: Clock3 },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();
  const { isLoading, signOut, user } = useAuth();
  const currentItem =
    navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0];

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="header-controls">
      <nav aria-label="주요 화면" className="nav">
        {navItems.map((item) => {
          const isActive = item.href === currentItem.href;
          const Icon = item.icon;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`nav__link${isActive ? " nav__link--active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="auth-status">
        <span className="auth-status__email">{user.email}</span>
        <button className="button button--ghost" type="button" onClick={signOut}>
          <LogOut aria-hidden="true" size={16} />
          로그아웃
        </button>
      </div>
    </div>
  );
}
