import { getUserJabatan, getUserPolres } from "@/utils/userDirectoryDisplay";

type Props = {
  user: Record<string, any>;
  showDirectorateMeta: boolean;
  metaClassName?: string;
};

export default function UserIdentityDisplay({
  user,
  showDirectorateMeta,
  metaClassName = "mt-1 text-xs text-slate-500",
}: Props) {
  const name = (user?.title ? `${user.title} ` : "") + (user?.nama || "-");
  const polres = getUserPolres(user);
  const jabatan = getUserJabatan(user);
  const showMeta = showDirectorateMeta && (polres || jabatan);

  return (
    <>
      {name}
      {showMeta && (
        <span className={metaClassName}>
          {polres ? `Polres: ${polres}` : ""}
          {polres && jabatan ? " • " : ""}
          {jabatan ? `Jabatan: ${jabatan}` : ""}
        </span>
      )}
    </>
  );
}

