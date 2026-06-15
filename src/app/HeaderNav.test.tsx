import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/useAuth";
import { HeaderNav } from "./HeaderNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockUsePathname = vi.mocked(usePathname);
const mockUseAuth = vi.mocked(useAuth);

describe("HeaderNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/timeline");
    mockUseAuth.mockReturnValue({
      isLoading: false,
      signOut: vi.fn(),
      user: { email: "collector@example.com" },
    } as ReturnType<typeof useAuth>);
  });

  it("renders a dedicated timeline navigation item", () => {
    render(<HeaderNav />);

    const timelineLink = screen.getByRole("link", { name: /타임라인/ });

    expect(timelineLink).toHaveAttribute("href", "/timeline");
    expect(timelineLink).toHaveAttribute("aria-current", "page");
  });
});
