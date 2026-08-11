import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import ComplaintHistoryCard from "@/components/claim/ComplaintHistoryCard";
import type { ClaimComplaintLifecycleDto } from "@/utils/api";

const complaint: ClaimComplaintLifecycleDto = {
  complaint_id: "complaint-1",
  platform: "instagram",
  content_id: "SHORTCODE-1",
  issue_type: "activity_not_recorded",
  status: "escalated",
  triage: {
    code: "ENGAGEMENT_NOT_IN_SNAPSHOT",
    quality: "medium",
    evidence: {
      activity_recorded: false,
      snapshot_available: true,
      last_collected_at: null,
      performed_at: null,
    },
  },
  created_at: "2026-08-10T00:00:00.000Z",
  updated_at: "2026-08-10T01:00:00.000Z",
  escalated_at: "2026-08-10T01:00:00.000Z",
  resolved_at: null,
};

describe("ComplaintHistoryCard", () => {
  it("menampilkan loading dan empty state", () => {
    const { rerender } = render(
      <ComplaintHistoryCard complaints={[]} loading error="" onRetry={jest.fn()} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Memuat riwayat komplain");
    rerender(<ComplaintHistoryCard complaints={[]} loading={false} error="" onRetry={jest.fn()} />);
    expect(screen.getByText("Belum ada riwayat komplain.")).toBeInTheDocument();
  });

  it("menampilkan nilai DTO backend dan label status presentasi yang stabil", () => {
    render(<ComplaintHistoryCard complaints={[complaint]} loading={false} error="" onRetry={jest.fn()} />);
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("SHORTCODE-1")).toBeInTheDocument();
    expect(screen.getAllByText("Dieskalasi")).not.toHaveLength(0);
    expect(screen.getByText("ENGAGEMENT_NOT_IN_SNAPSHOT")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("menampilkan error dan tombol coba lagi", () => {
    const onRetry = jest.fn();
    render(<ComplaintHistoryCard complaints={[]} loading={false} error="Backend gagal" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Backend gagal");
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
