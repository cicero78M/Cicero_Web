import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function POST(req: NextRequest) {
  try {
    const { client_id } = await req.json();
    const token = req.headers.get("authorization") || "";
    const ids: string[] = Array.isArray(client_id) ? client_id : [];
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    const entries = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const params = new URLSearchParams({ client_id: id });
          const res = await fetch(
            `${API_BASE_URL}/api/clients/profile?${params.toString()}`,
            {
              headers: {
                Authorization: token,
                "Content-Type": "application/json",
              },
            },
          );
          if (!res.ok) throw new Error("Failed to fetch profile");
          const json = await res.json();
          const profile =
            json?.data?.client ||
            json?.data ||
            json?.client ||
            json?.profile ||
            json ||
            {};
          const name =
            profile.nama ||
            profile.nama_client ||
            profile.client_name ||
            profile.client ||
            id;
          return [id, name] as [string, string];
        } catch {
          return [id, id] as [string, string];
        }
      }),
    );
    return NextResponse.json(Object.fromEntries(entries));
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to get client names" },
      { status: 500 },
    );
  }
}

