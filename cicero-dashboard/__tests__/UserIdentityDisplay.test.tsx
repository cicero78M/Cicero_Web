import { render, screen } from "@testing-library/react";
import UserIdentityDisplay from "@/components/users/UserIdentityDisplay";

describe("UserIdentityDisplay", () => {
  it("renders name with title", () => {
    render(<UserIdentityDisplay user={{ title: "AKP", nama: "Budi" }} showDirectorateMeta={false} />);
    expect(screen.getByText("AKP Budi")).toBeTruthy();
  });

  it("renders polres and jabatan when enabled", () => {
    render(
      <UserIdentityDisplay
        user={{ nama: "Budi", nama_polres: "Polres A", jabatan: "Kanit" }}
        showDirectorateMeta
      />,
    );
    expect(screen.getByText(/Polres: Polres A/)).toBeTruthy();
    expect(screen.getByText(/Jabatan: Kanit/)).toBeTruthy();
  });

  it("hides metadata when disabled", () => {
    render(
      <UserIdentityDisplay
        user={{ nama: "Budi", nama_polres: "Polres A", jabatan: "Kanit" }}
        showDirectorateMeta={false}
      />,
    );
    expect(screen.queryByText(/Polres:/)).toBeNull();
  });
});
