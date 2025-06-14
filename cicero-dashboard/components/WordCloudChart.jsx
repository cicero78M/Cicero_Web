"use client";
import dynamic from "next/dynamic";

const ReactWordcloud = dynamic(() => import("react-wordcloud"), { ssr: false });

export default function WordCloudChart({ words = [] }) {
  const options = { rotations: 2, rotationAngles: [0, 0], fontSizes: [12, 40] };
  return (
    <div style={{ height: 300 }} className="w-full">
      <ReactWordcloud words={words} options={options} />
    </div>
  );
}
