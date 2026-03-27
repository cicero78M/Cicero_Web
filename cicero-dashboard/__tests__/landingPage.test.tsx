import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import LandingPage from "@/app/page";

type LinkMockProps = React.PropsWithChildren<{
  href: string | { pathname?: string };
}> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

jest.mock("@/hooks/useAuthRedirect", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: LinkMockProps) => {
    const resolvedHref = typeof href === "string" ? href : href?.pathname ?? "";
    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

function expectLink(label: string, href: string) {
  const link = screen.getByRole("link", { name: label });
  expect(link).toHaveAttribute("href", href);
}

describe("LandingPage", () => {
  it("renders evaluator-focused hero and supported sections", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Koordinasikan evaluasi operasional digital tanpa memutus alur kerja tim\./i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/koordinator dan pengambil keputusan/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Fokus pada alur kerja yang memang tersedia hari ini\./i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Disusun untuk evaluator, koordinator, dan tim yang sedang menilai kesiapan Cicero\./i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Kredibilitas dibangun dari route nyata dan interaksi yang jujur\./i })).toBeInTheDocument();
  });

  it("removes unsupported pricing, testimonial, newsletter, and KPI proof", () => {
    render(<LandingPage />);

    expect(screen.queryByText("Paket Cicero")).not.toBeInTheDocument();
    expect(screen.queryByText("Most Popular")).not.toBeInTheDocument();
    expect(screen.queryByText(/Head of Digital Operations, Cicero Devs/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Berlangganan Knowledge Pulse")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kirim Ringkasan/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Akun Aktif")).not.toBeInTheDocument();
    expect(screen.queryByText("Engagement")).not.toBeInTheDocument();
    expect(screen.queryByText("SLA Respon")).not.toBeInTheDocument();
  });

  it("keeps consultation as the primary CTA while login and claim stay secondary", () => {
    render(<LandingPage />);

    expect(screen.getByRole("link", { name: "Jadwalkan konsultasi" })).toHaveAttribute(
      "href",
      "https://wa.me/6281235114745",
    );
    expectLink("Masuk dashboard", "/login");
    expectLink("Claim profil", "/claim");
  });

  it("preserves secondary public routes and legal links", () => {
    render(<LandingPage />);

    expectLink("Buka login dashboard", "/login");
    expectLink("Buka update akses login", "/login-update");
    expectLink("Buka portal claim", "/claim");
    expectLink("Lihat mekanisme absensi", "/mekanisme-absensi");
    expectLink("Lihat panduan SOP", "/panduan-sop");
    expectLink("Ketentuan Layanan", "/terms-of-service");
    expectLink("Kebijakan Privasi", "/privacy-policy");
  });

  it("shows honest trust copy instead of fake interaction states", () => {
    render(<LandingPage />);

    expect(screen.getByText(/tidak lagi menampilkan KPI promosi, paket harga tetap, testimonial internal, atau form sukses semu/i)).toBeInTheDocument();
    expect(screen.getByText(/Landing page publik ini sengaja menghindari klaim harga, KPI, dan testimoni/i)).toBeInTheDocument();
    expect(screen.queryByText("Terima kasih!")).not.toBeInTheDocument();
  });
});
