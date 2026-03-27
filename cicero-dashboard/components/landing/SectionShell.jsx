export default function SectionShell({ id, className = "", children }) {
  return (
    <section id={id} className={`w-full ${className}`.trim()}>
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">{children}</div>
    </section>
  );
}
