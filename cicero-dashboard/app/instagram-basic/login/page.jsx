"use client";
import Link from "next/link";

export default function InstagramBasicLogin() {
  const appId = process.env.NEXT_PUBLIC_IG_APP_ID || "";
  const redirectUri = process.env.NEXT_PUBLIC_IG_REDIRECT_URI || "";
  if (!appId || !redirectUri) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-600 text-center">
          Instagram OAuth env vars not configured
        </p>
      </main>
    );
  }
  const authUrl =
    "https://api.instagram.com/oauth/authorize?" +
    new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: "user_profile,user_media",
      response_type: "code",
    }).toString();
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm text-center">
        <h1 className="text-xl font-bold mb-6 text-pink-600">Instagram Login</h1>
        <Link
          href={authUrl}
          className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg"
        >
          Login with Instagram
        </Link>
      </div>
    </main>
  );
}
