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
jest.mock("@/utils/premium", () => {
  const actual = jest.requireActual("@/utils/premium");
  return {
    ...actual,
    isPremiumTierAllowedForAnev: jest.fn((tier, clientType, role) => {
      // Use actual implementation
      return actual.isPremiumTierAllowedForAnev(tier, clientType, role);
    }),
  };
});

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
    it("shows menu items for Org Operator without status flags", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
        profile: {},
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // Required menu items for Org + Operator without status
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("User Directory")).toBeInTheDocument();
      expect(screen.getByText("User Insight")).toBeInTheDocument();
      expect(screen.queryByText("Instagram Engagement Insight")).not.toBeInTheDocument();
      expect(screen.queryByText("TikTok Engagement Insight")).not.toBeInTheDocument();
      expect(screen.getByText("Mekanisme Sistem Absensi")).toBeInTheDocument();
      expect(screen.getByText("Panduan & SOP")).toBeInTheDocument();
    });

    it("shows Instagram Engagement Insight for Org Operator with instagram status enabled", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
        profile: {
          client_insta_status: "1",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.getByText("Instagram Engagement Insight")).toBeInTheDocument();
    });

    it("hides Instagram Engagement Insight for Org Operator when instagram status is disabled", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
        profile: {
          client_insta_status: "0",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.queryByText("Instagram Engagement Insight")).not.toBeInTheDocument();
    });

    it("shows TikTok Engagement Insight for Org Operator with tiktok status enabled", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
        profile: {
          client_tiktok_status: "1",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      expect(screen.getByText("TikTok Engagement Insight")).toBeInTheDocument();
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

    it("shows Anev Polres without Premium label for Org Operator", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "OPERATOR",
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // Should show "Anev Polres" without "(Premium)" label
      expect(screen.getByText("Anev Polres")).toBeInTheDocument();
      expect(screen.queryByText("Anev Polres (Premium)")).not.toBeInTheDocument();
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

  describe("Anev Polres menu visibility for original directorate scope", () => {
    it("hides Anev Polres (Premium) for DIREKTORAT client type with directorate role", () => {
      const authValue = createAuthValue({
        effectiveClientType: "DIREKTORAT",
        effectiveRole: "DITBINMAS",
        premiumTier: null,
        profile: {
          client_type: "DIREKTORAT",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // Should not show "Anev Polres (Premium)" for original directorate scope
      expect(screen.queryByText("Anev Polres (Premium)")).not.toBeInTheDocument();
      // Should also not show regular "Anev Polres" without premium access
      expect(screen.queryByText("Anev Polres")).not.toBeInTheDocument();
    });

    it("hides Anev Polres (Premium) for DIREKTORAT client type with BIDHUMAS role", () => {
      const authValue = createAuthValue({
        effectiveClientType: "DIREKTORAT",
        effectiveRole: "BIDHUMAS",
        premiumTier: null,
        profile: {
          client_type: "DIREKTORAT",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // Should not show "Anev Polres (Premium)" for original directorate scope
      expect(screen.queryByText("Anev Polres (Premium)")).not.toBeInTheDocument();
      // Should also not show regular "Anev Polres" without premium access
      expect(screen.queryByText("Anev Polres")).not.toBeInTheDocument();
    });

    it("shows Anev Polres (Premium) for ORG client type even with directorate role", () => {
      const authValue = createAuthValue({
        effectiveClientType: "ORG",
        effectiveRole: "BIDHUMAS",
        premiumTier: null,
        profile: {
          client_type: "ORG",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // Should show "Anev Polres (Premium)" for ORG clients (not original directorate scope)
      expect(screen.getByText("Anev Polres (Premium)")).toBeInTheDocument();
    });

    it("hides Anev Polres (Premium) when profile has parent.client_type = DIREKTORAT", () => {
      const authValue = createAuthValue({
        effectiveClientType: "DIREKTORAT",
        effectiveRole: "DITSAMAPTA",
        premiumTier: null,
        profile: {
          parent: {
            client_type: "DIREKTORAT",
          },
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // Should not show "Anev Polres (Premium)" for original directorate scope
      expect(screen.queryByText("Anev Polres (Premium)")).not.toBeInTheDocument();
      // Should also not show regular "Anev Polres" without premium access
      expect(screen.queryByText("Anev Polres")).not.toBeInTheDocument();
    });

    it("shows Anev Polres for DIREKTORAT with premium tier1", () => {
      const authValue = createAuthValue({
        effectiveClientType: "DIREKTORAT",
        effectiveRole: "DITBINMAS",
        premiumTier: "tier1",
        profile: {
          client_type: "DIREKTORAT",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // Should show "Anev Polres" without Premium label when user has premium access
      expect(screen.getByText("Anev Polres")).toBeInTheDocument();
      expect(screen.queryByText("Anev Polres (Premium)")).not.toBeInTheDocument();
    });

    it("hides Anev Polres menu for DIREKTORAT operator without premium (original directorate scope)", () => {
      const authValue = createAuthValue({
        effectiveClientType: "DIREKTORAT",
        effectiveRole: "OPERATOR",
        premiumTier: null,
        profile: {
          client_type: "DIREKTORAT",
        },
      });

      render(
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      );

      // DIREKTORAT operators without premium tier should not see any Anev Polres menu
      // because they are original directorate scope (not ORG operator)
      expect(screen.queryByText("Anev Polres")).not.toBeInTheDocument();
      expect(screen.queryByText("Anev Polres (Premium)")).not.toBeInTheDocument();
    });
  });
});
