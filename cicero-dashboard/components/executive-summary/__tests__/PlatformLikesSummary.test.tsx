import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PlatformLikesSummary from "../PlatformLikesSummary";

const formatNumber = (value: number) => value.toLocaleString("id-ID");
const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

class ResizeObserverMock implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    const entry = {
      target,
      contentRect: {
        width: 1200,
        height: 480,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 480,
        right: 1200,
      },
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry;

    this.callback([entry], this);
  }

  unobserve(): void {}

  disconnect(): void {}
}

describe("PlatformLikesSummary", () => {
  beforeAll(() => {
    (global as any).ResizeObserver = ResizeObserverMock;
    (SVGElement.prototype as any).getBBox = () => ({
      x: 0,
      y: 0,
      width: 1200,
      height: 480,
    });
  });

  it("renders every satfung entry and keeps tooltip interactive for large datasets", async () => {
    const clients = Array.from({ length: 16 }, (_, index) => ({
      key: `client-${index}`,
      clientId: `client-${index}`,
      clientName: `Satfung ${index + 1}`,
      totalLikes: 1000 - index * 10,
      totalComments: 800 - index * 5,
      activePersonnel: 40 - index,
      totalPersonnel: 60,
      complianceRate: 0.45 + index * 0.01,
      averageLikesPerUser: 10,
      averageCommentsPerUser: 2,
    }));

    const data = {
      totals: {
        totalClients: clients.length,
        totalLikes: clients.reduce((sum, client) => sum + client.totalLikes, 0),
        totalComments: clients.reduce((sum, client) => sum + client.totalComments, 0),
        totalPersonnel: clients.length * 60,
        activePersonnel: clients.reduce((sum, client) => sum + client.activePersonnel, 0),
        complianceRate: 0.5,
        averageComplianceRate: 0.5,
      },
      clients,
      topPersonnel: [],
      lastUpdated: null,
    };

    const { container } = render(
      <div style={{ width: "1200px", height: "640px" }}>
        <PlatformLikesSummary
          data={data as any}
          formatNumber={formatNumber}
          formatPercent={formatPercent}
        />
      </div>,
    );

    const renderedLabels = await screen.findAllByText("Satfung 16");
    expect(renderedLabels.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(
        container.querySelectorAll<SVGElement>(".recharts-rectangle").length,
      ).toBeGreaterThanOrEqual(clients.length);
    });

    const bars = container.querySelectorAll<SVGElement>(".recharts-rectangle");

    fireEvent.mouseEnter(bars[0]);
    fireEvent.mouseMove(bars[0], { clientX: 100, clientY: 200 });

    await waitFor(() => {
      const tooltip = container.querySelector<HTMLDivElement>(
        ".recharts-tooltip-wrapper",
      );
      expect(tooltip).toBeTruthy();
      expect(tooltip?.style.visibility).not.toBe("hidden");
    });
  });
});
