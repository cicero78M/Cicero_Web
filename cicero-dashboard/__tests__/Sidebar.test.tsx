import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";
import { AuthContext } from "@/context/AuthContext";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/dashboard"),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// Mock shadcn/ui components
jest.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock premium utils
jest.mock("@/utils/premium", () => ({
  isPremiumTierAllowedForAnev: jest.fn(() => false),
}));

describe("Sidebar", () => {
  const createAuthValue = (overrides: any = {}) => ({
    token: "token",
    clientId: "test-client",
    userId: "user-id",
    username: "testuser",
    role: "operator",
    effectiveRole: "OPERATOR",
    effectiveClientType: "ORG",
    regionalId: null,
    premiumTier: null,
    premiumExpiry: null,
    profile: null,
    isHydrating: false,
    isProfileLoading: false,
    premiumTierReady: true,
    hasResolvedPremium: true,
    premiumResolutionError: false,
    setAuth: jest.fn(),
    ...overrides,
  });

  describe("Org + Operator Menu", () => {
    it("shows all required menu items for Org client with Operator role", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // Required menu items for Org + Operator
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("User Directory")).toBeInTheDocument();
      expect(screen.getByText("User Insight")).toBeInTheDocument();
      expect(screen.getByText("Instagram Engagement Insight")).toBeInTheDocument();
      expect(screen.getByText("TikTok Engagement Insight")).toBeInTheDocument();
      expect(screen.getByText("Mekanisme Sistem Absensi")).toBeInTheDocument();
      expect(screen.getByText("Panduan & SOP")).toBeInTheDocument();
    });

    it("does not show Instagram Post Analysis for Org Operator", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("Instagram Post Analysis")).not.toBeInTheDocument();
    });

    it("does not show TikTok Post Analysis for Org Operator", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("TikTok Post Analysis")).not.toBeInTheDocument();
    });

    it("does not show Premium menu for Org Operator", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("Premium")).not.toBeInTheDocument();
    });

    it("does not show Instagram Post Analysis for non-Operator Org clients", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "BIDHUMAS",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("Instagram Post Analysis")).not.toBeInTheDocument();
    });

    it("does not show TikTok Post Analysis for non-Operator Org clients", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "BIDHUMAS",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("TikTok Post Analysis")).not.toBeInTheDocument();
    });
  });

  describe("Org + Bidhumas Menu (existing behavior preserved)", () => {
    it("shows engagement insights for Org Bidhumas", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "BIDHUMAS",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("User Directory")).toBeInTheDocument();
      expect(screen.getByText("User Insight")).toBeInTheDocument();
      expect(screen.getByText("Instagram Engagement Insight")).toBeInTheDocument();
      expect(screen.getByText("TikTok Engagement Insight")).toBeInTheDocument();
      expect(screen.getByText("Mekanisme Sistem Absensi")).toBeInTheDocument();
      expect(screen.getByText("Panduan & SOP")).toBeInTheDocument();
    });
  });

  describe("Non-Org clients (existing behavior preserved)", () => {
    it("shows basic menu for DIREKTORAT Operator without status flags", () => {
      const authValue = createAuthValue({
        effectiveClientType: "DIREKTORAT",
        effectiveRole: "OPERATOR",
        profile: {},
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("User Directory")).toBeInTheDocument();
      expect(screen.getByText("User Insight")).toBeInTheDocument();
      expect(screen.queryByText("Instagram Engagement Insight")).not.toBeInTheDocument();
      expect(screen.queryByText("TikTok Engagement Insight")).not.toBeInTheDocument();
    });

    it("shows engagement insights for DIREKTORAT Operator with status flags", () => {
      const authValue = createAuthValue({
        effectiveClientType: "DIREKTORAT",
        effectiveRole: "OPERATOR",
        profile: {
          client_insta_status: "1",
          client_tiktok_status: "1",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.getByText("Instagram Engagement Insight")).toBeInTheDocument();
      expect(screen.getByText("TikTok Engagement Insight")).toBeInTheDocument();
    });

    it("does not show Premium menu for non-Org clients", () => {
      const authValue = createAuthValue({
        effectiveClientType: "DIREKTORAT",
        effectiveRole: "OPERATOR",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("Premium")).not.toBeInTheDocument();
    });
  });

  describe("Special access roles (existing behavior preserved)", () => {
    it("shows Executive Summary for DITBINMAS", () => {
      const authValue = createAuthValue({
        clientId: "ditbinmas",
        effectiveClientType: "ORG",
        effectiveRole: "DITBINMAS",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.getByText("Executive Summary")).toBeInTheDocument();
      expect(screen.getByText("Satbinmas Official")).toBeInTheDocument();
    });

    it("does not show Executive Summary for non-DITBINMAS", () => {
      const authValue = createAuthValue({
        clientId: "other-client",
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("Executive Summary")).not.toBeInTheDocument();
      expect(screen.queryByText("Satbinmas Official")).not.toBeInTheDocument();
    });
  });

  describe("Amplify access (existing behavior preserved)", () => {
    it("shows Diseminasi Insight when amplify is enabled", () => {
      const authValue = createAuthValue({
        profile: {
          client_amplify_status: "1",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.getByText("Diseminasi Insight")).toBeInTheDocument();
    });

    it("does not show Diseminasi Insight when amplify is disabled", () => {
      const authValue = createAuthValue({
        profile: {
          client_amplify_status: "0",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("Diseminasi Insight")).not.toBeInTheDocument();
    });
  });
});
