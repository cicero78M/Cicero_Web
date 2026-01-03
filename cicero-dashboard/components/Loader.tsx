type LoaderProps = {
  className?: string;
  containerClassName?: string;
  inline?: boolean;
  label?: string | null;
};

export default function Loader({
  className = "",
  containerClassName = "",
  inline = false,
  label = "Memuat data...",
}: LoaderProps) {
  const wrapperClasses = [
    inline ? "inline-flex items-center gap-2" : "flex items-center justify-center h-64",
    containerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const spinnerClasses = [
    "animate-spin rounded-full border-t-2 border-b-2 border-blue-500",
    inline ? "h-5 w-5" : "h-12 w-12",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const labelClasses = ["text-blue-700", inline ? "text-sm" : "ml-4"].filter(Boolean).join(" ");

  return (
    <div className={wrapperClasses}>
      <span className={spinnerClasses}></span>
      {label ? <span className={labelClasses}>{label}</span> : null}
    </div>
  );
}
