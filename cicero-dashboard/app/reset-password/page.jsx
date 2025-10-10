import ResetPasswordClient from "./[token]/ResetPasswordClient";

export default function ResetPasswordPage({ searchParams }) {
  const tokenParam = Array.isArray(searchParams?.token)
    ? searchParams?.token?.[0] ?? ""
    : searchParams?.token ?? "";

  return <ResetPasswordClient token={tokenParam} />;
}
