"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "theme:v2";
const LEGACY_KEY = "theme";

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");

    const legacyValue = localStorage.getItem(LEGACY_KEY);
    if (legacyValue) {
      localStorage.removeItem(LEGACY_KEY);
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") {
      setEnabled(true);
    } else {
      root.classList.remove("dark");
      if (stored !== "light") {
        localStorage.setItem(STORAGE_KEY, "light");
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (enabled) {
      root.classList.add("dark");
      localStorage.setItem(STORAGE_KEY, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(STORAGE_KEY, "light");
    }

    localStorage.removeItem(LEGACY_KEY);
  }, [enabled]);

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setEnabled(!enabled)}
      className="p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {enabled ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
