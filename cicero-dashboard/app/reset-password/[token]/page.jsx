import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage({ params }) {
  const tokenParam = Array.isArray(params?.token)
    ? params?.token?.[0] ?? ""
    : params?.token ?? "";

  return <ResetPasswordClient token={tokenParam} />;
}
