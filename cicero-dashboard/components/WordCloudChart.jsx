"use client";
import WordCloud from "react-d3-cloud";

export default function WordCloudChart({ words = [] }) {
  if (typeof window === "undefined") return null;
  return (
    <div style={{ height: 300 }} className="w-full overflow-hidden">
      <WordCloud data={words} width={300} height={300} />
    </div>
  );
}
