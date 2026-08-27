import fs from "node:fs";
import path from "node:path";

const loginFormPath = path.resolve(
  process.cwd(),
  "app/reposter/login/LoginForm.tsx",
);

describe("reposter credential storage boundary", () => {
  it("never persists the reposter password and removes legacy plaintext entries", () => {
    const source = fs.readFileSync(loginFormPath, "utf8");

    expect(source).not.toMatch(/setItem\([\s\S]{0,300}password:\s*password/);
    expect(source).not.toContain("Simpan username & password");
    expect(source).toContain("Simpan username");
    expect(source).toContain("Rewrite legacy entries");
  });

  it("uses a non-token marker for the navigation cookie", () => {
    const source = fs.readFileSync(loginFormPath, "utf8");

    expect(source).toContain("${SESSION_COOKIE}=1");
    expect(source).toContain("SameSite=Strict");
    expect(source).not.toContain("encodeURIComponent(sessionToken)");
  });
});
