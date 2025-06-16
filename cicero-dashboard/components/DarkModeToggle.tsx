"use client";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") setEnabled(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [enabled]);

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setEnabled(!enabled)}
      className="text-sm px-2 py-1 border rounded"
    >
      {enabled ? "Light" : "Dark"}
    </button>
  );
}
