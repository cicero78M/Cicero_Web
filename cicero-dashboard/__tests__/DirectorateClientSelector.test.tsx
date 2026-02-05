import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DirectorateClientSelector from "@/components/DirectorateClientSelector";

describe("DirectorateClientSelector", () => {
  const mockClients = [
    { client_id: "CLIENT_A", nama_client: "Client Alpha" },
    { client_id: "CLIENT_B", nama_client: "Client Beta" },
    { client_id: "CLIENT_C", nama_client: "Client Gamma" },
  ];

  const mockOnClientChange = jest.fn();

  beforeEach(() => {
    mockOnClientChange.mockClear();
  });

  it("should render selector with clients", () => {
    render(
      <DirectorateClientSelector
        clients={mockClients}
        selectedClientId=""
        onClientChange={mockOnClientChange}
      />
    );

    const selector = screen.getByLabelText(/Pilih Client/i);
    expect(selector).toBeInTheDocument();

    // Check if all options are rendered
    expect(screen.getByText("Semua Client / Satker")).toBeInTheDocument();
    expect(screen.getByText("Client Alpha")).toBeInTheDocument();
    expect(screen.getByText("Client Beta")).toBeInTheDocument();
    expect(screen.getByText("Client Gamma")).toBeInTheDocument();
  });

  it("should call onClientChange when a client is selected", () => {
    render(
      <DirectorateClientSelector
        clients={mockClients}
        selectedClientId=""
        onClientChange={mockOnClientChange}
      />
    );

    const selector = screen.getByLabelText(/Pilih Client/i);
    fireEvent.change(selector, { target: { value: "CLIENT_A" } });

    expect(mockOnClientChange).toHaveBeenCalledWith("CLIENT_A");
  });

  it("should show selected value", () => {
    render(
      <DirectorateClientSelector
        clients={mockClients}
        selectedClientId="CLIENT_B"
        onClientChange={mockOnClientChange}
      />
    );

    const selector = screen.getByLabelText(
      /Pilih Client/i
    ) as HTMLSelectElement;
    expect(selector.value).toBe("CLIENT_B");
  });

  it("should render nothing when clients array is empty", () => {
    const { container } = render(
      <DirectorateClientSelector
        clients={[]}
        selectedClientId=""
        onClientChange={mockOnClientChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should use custom label when provided", () => {
    render(
      <DirectorateClientSelector
        clients={mockClients}
        selectedClientId=""
        onClientChange={mockOnClientChange}
        label="Custom Label"
      />
    );

    expect(screen.getByText(/Custom Label/i)).toBeInTheDocument();
  });

  it("should sort clients alphabetically", () => {
    const unsortedClients = [
      { client_id: "CLIENT_C", nama_client: "Zebra" },
      { client_id: "CLIENT_A", nama_client: "Alpha" },
      { client_id: "CLIENT_B", nama_client: "Beta" },
    ];

    render(
      <DirectorateClientSelector
        clients={unsortedClients}
        selectedClientId=""
        onClientChange={mockOnClientChange}
      />
    );

    const selector = screen.getByLabelText(/Pilih Client/i);
    const options = Array.from(selector.querySelectorAll("option")).slice(1); // Skip "Semua" option

    expect(options[0].textContent).toBe("Alpha");
    expect(options[1].textContent).toBe("Beta");
    expect(options[2].textContent).toBe("Zebra");
  });
});
