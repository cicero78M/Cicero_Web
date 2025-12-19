"use client";

import { useContext } from "react";
import { ReposterAuthContext } from "@/context/ReposterAuthContext";

export default function useReposterAuth() {
  const ctx = useContext(ReposterAuthContext);
  if (!ctx) {
    throw new Error("useReposterAuth must be used within ReposterAuthProvider");
  }
  return ctx;
}
