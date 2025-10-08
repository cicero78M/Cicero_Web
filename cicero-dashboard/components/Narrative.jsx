"use client";
export default function Narrative({ children }) {
  return (
    <p className="mt-2 text-sm italic leading-snug text-slate-600">
      {children}
    </p>
  );
}
