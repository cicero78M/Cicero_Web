"use client";
export default function Narrative({ children }) {
  return (
    <p className="mt-2 text-sm text-gray-500 italic leading-snug">
      {children}
    </p>
  );
}
