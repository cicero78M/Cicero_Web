import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

import EngagementInsightMobileScaffold from "@/components/insight/EngagementInsightMobileScaffold";

describe("EngagementInsightMobileScaffold analysis context", () => {
  it("explains the active period, data coverage, and engagement statuses", () => {
    render(
      <EngagementInsightMobileScaffold
        analysisContext={{
          platform: "Instagram Likes",
          periodLabel: "20 Agustus 2026 s.d. 27 Agustus 2026",
          scopeLabel: "POLRES CONTOH",
          totalPosts: 8,
          totalUsers: 100,
          validUsers: 92,
          actionNeeded: 17,
        }}
      />,
    );

    expect(screen.getByText(/Konteks analisis aktif/i)).toBeInTheDocument();
    expect(screen.getAllByText(/20 Agustus 2026 s.d. 27 Agustus 2026/i)).not.toHaveLength(0);
    expect(screen.getByText("8 posting")).toBeInTheDocument();
    expect(screen.getByText("92 dari 100 user")).toBeInTheDocument();
    expect(screen.getByText("17 akun")).toBeInTheDocument();
    expect(screen.getByText(/Data platform dapat mengalami jeda sinkronisasi/i)).toBeInTheDocument();
  });
});
