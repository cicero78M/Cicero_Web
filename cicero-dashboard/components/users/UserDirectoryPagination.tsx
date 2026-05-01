type Props = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function UserDirectoryPagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <button
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 shadow-sm transition hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={page === 1}
        onClick={onPrev}
        type="button"
      >
        Prev
      </button>
      <span>
        Halaman <b>{page}</b> dari <b>{totalPages}</b>
      </span>
      <button
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 shadow-sm transition hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={page === totalPages}
        onClick={onNext}
        type="button"
      >
        Next
      </button>
    </div>
  );
}

