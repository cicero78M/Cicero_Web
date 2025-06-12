"use client";
import { useEffect, useState } from "react";
import CardStat from "@/components/CardStat";
import Loader from "@/components/Loader";
import {
  getInstagramProfileViaBackend,
  getInstagramInfoViaBackend,
  getClientProfile,
} from "@/utils/api";

export default function InstagramInfoPage() {
  const [profile, setProfile] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("cicero_token")
        : null;
    const clientId =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

    if (!token || !clientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const clientProfileRes = await getClientProfile(token, clientId);
        const clientData =
          clientProfileRes.client || clientProfileRes.profile || clientProfileRes;

        const username =
          clientData.client?.client_insta?.replace(/^@/, "") ||
          clientData.client_insta?.replace(/^@/, "") ||
          process.env.NEXT_PUBLIC_INSTAGRAM_USER ||
          "instagram";

        const profileRes = await getInstagramProfileViaBackend(token, username);
        setProfile(profileRes);

        const infoRes = await getInstagramInfoViaBackend(token, username);
        const infoData = infoRes.data || infoRes.info || infoRes;
        setInfo(infoData);

      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  if (!profile) return null;

  const stats = [
    { title: "Followers", value: profile.followers },
    { title: "Following", value: profile.following },
    { title: "Total Posts", value: info?.media_count ?? info?.post_count },
    { title: "Category", value: info?.category || "-" },
  ];

  const profilePic =
    profile.profile_pic_url ||
    info?.hd_profile_pic_url_info?.url ||
    info?.profile_pic_url_hd ||
    info?.profile_pic_url ||
    "";

  const biography = profile.bio || info?.biography || "";

  const bioLink =
    (info?.bio_links && (info.bio_links[0]?.link || info.bio_links[0]?.url)) ||
    info?.external_url ||
    "";

  const profileDetails = [
    { label: "Full Name", value: info?.full_name || "-" },
    { label: "User ID", value: info?.id || "-" },
    { label: "Verified", value: info?.is_verified ? "Yes" : "No" },
    { label: "Business Email", value: info?.public_email || "-" },
    { label: "Phone", value: info?.public_phone_number || "-" },
  ];


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-blue-700">Instagram Info</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <CardStat key={s.title} title={s.title} value={s.value ?? "-"} />
          ))}
        </div>
        <div className="bg-white p-4 rounded-xl shadow flex items-start gap-4">
          {profilePic && (
            <img
              src={profilePic}
              alt="profile"
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <div className="font-semibold">{profile.username}</div>
            {biography && (
              <p className="mt-1 text-sm whitespace-pre-line">{biography}</p>
            )}
            {bioLink && (
              <a
                href={bioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm break-all"
              >
                {bioLink}
              </a>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Profile Details</h2>
          <div className="flex flex-col gap-1 text-sm">
            {profileDetails.map((row) => (
              <Row key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow overflow-x-auto text-sm">
          <h2 className="font-semibold mb-2">Raw Info</h2>
          <pre>{JSON.stringify(info, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start py-1 gap-2">
      <div className="w-24 text-gray-500 flex-shrink-0">{label}</div>
      <div className="text-gray-300 select-none">:</div>
      <div className="flex-1 break-all">{value}</div>
    </div>
  );
}
