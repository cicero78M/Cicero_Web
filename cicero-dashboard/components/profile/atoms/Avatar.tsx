"use client";

export default function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={96}
      height={96}
      loading="lazy"
      className="w-24 h-24 rounded-full object-cover"
      onError={(e) => {
        e.currentTarget.src = "/file.svg";
      }}
    />
  );
}
