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
    expect(source).toContain("Simpan NRP di perangkat ini");
    expect(source).toContain("JSON.stringify({ username:");
  });

  it("leaves the authenticated cookie to the HttpOnly backend", () => {
    const source = fs.readFileSync(loginFormPath, "utf8");

    expect(source).toContain('credentials: "include"');
    expect(source).not.toContain("document.cookie");
    expect(source).not.toContain("encodeURIComponent(sessionToken)");
  });
});
