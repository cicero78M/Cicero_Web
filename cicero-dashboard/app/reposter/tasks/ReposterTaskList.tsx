"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useReposterAuth from "@/hooks/useReposterAuth";
import {
  fetchPosts,
  getSpecialTasks,
  getReposterUserProfile,
  InstaPost,
  TaskItem,
} from "@/utils/api";
import {
  decodeJwtPayload,
  mergeReposterProfiles,
  normalizeReposterProfile,
  ReposterProfile,
} from "@/utils/reposterProfile";

type ReposterTaskListProps = {
  taskType: "official" | "special";
};

type TaskState = {
  tasks: Array<TaskItem | InstaPost>;
  loading: boolean;
  error: string;
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  in_progress: "Berjalan",
  done: "Selesai",
  completed: "Selesai",
  approved: "Disetujui",
};

export default function ReposterTaskList({ taskType }: ReposterTaskListProps) {
  const { token, isHydrating, profile, setAuth } = useReposterAuth();
  const [state, setState] = useState<TaskState>({
    tasks: [],
    loading: true,
    error: "",
  });
  const [remoteProfile, setRemoteProfile] = useState<ReposterProfile | null>(
    null,
  );
  const profileRef = useRef(profile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const sessionProfile = useMemo(() => {
    const tokenProfile = token ? decodeJwtPayload(token) : null;
    return mergeReposterProfiles([profile, tokenProfile]);
  }, [profile, token]);

  const combinedProfile = useMemo(
    () => mergeReposterProfiles([remoteProfile, sessionProfile]),
    [remoteProfile, sessionProfile],
  );

  const clientId = combinedProfile?.clientId ?? "";

  useEffect(() => {
    if (!token || !sessionProfile?.nrp) return;
    if (remoteProfile?.nrp === sessionProfile.nrp) return;
    let isActive = true;
    const controller = new AbortController();
    getReposterUserProfile(token, sessionProfile.nrp, controller.signal)
      .then((res) => {
        if (!isActive) return;
        const normalized = normalizeReposterProfile([
          res?.data?.user,
          res?.data?.profile,
          res?.data,
          res?.user,
          res?.profile,
          res,
        ]);
        if (!normalized) return;
        setRemoteProfile(normalized);
        setAuth(
          token,
          normalized.rawSources[0] ?? profileRef.current ?? null,
        );
      })
      .catch(() => {
        if (!isActive) return;
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [token, sessionProfile?.nrp, remoteProfile?.nrp, setAuth]);

  useEffect(() => {
    if (isHydrating || !token) return;

    const controller = new AbortController();

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        if (taskType === "official") {
          if (!clientId) {
            throw new Error("Client ID belum tersedia.");
          }
          const posts = await fetchPosts(token, clientId, {
            signal: controller.signal,
          });
          setState({ tasks: posts, loading: false, error: "" });
        } else {
          const res = await getSpecialTasks(token, {}, controller.signal);
          setState({ tasks: res.tasks, loading: false, error: "" });
        }
      } catch (error) {
        setState({
          tasks: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Gagal memuat tugas.",
        });
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [isHydrating, token, taskType, clientId]);

  const summary = useMemo(() => {
    if (taskType === "official") {
      const posts = state.tasks as InstaPost[];
      return posts.reduce(
        (totals, post) => {
          totals.total += 1;
          if (post.reported) totals.done += 1;
          else if (post.downloaded) totals.in_progress += 1;
          else totals.pending += 1;
          return totals;
        },
        { total: 0, pending: 0, in_progress: 0, done: 0 },
      );
    }
    const specialTasks = state.tasks.filter(
      (task): task is TaskItem => "status" in task,
    );
    const totals = {
      total: specialTasks.length,
      pending: 0,
      in_progress: 0,
      done: 0,
    };
    specialTasks.forEach((task) => {
      const statusKey = (task.status || "").toLowerCase();
      if (statusKey.includes("progress")) totals.in_progress += 1;
      else if (statusKey.includes("done") || statusKey.includes("complete")) {
        totals.done += 1;
      } else if (statusKey.includes("pending") || statusKey.includes("todo")) {
        totals.pending += 1;
      }
    });
    return totals;
  }, [state.tasks, taskType]);

  if (state.loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
        {state.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {(
          taskType === "official"
            ? [
                { label: "Total postingan", value: summary.total },
                { label: "Belum diunduh", value: summary.pending },
                { label: "Sudah diunduh", value: summary.in_progress },
                { label: "Sudah dilaporkan", value: summary.done },
              ]
            : [
                { label: "Total tugas", value: summary.total },
                { label: "Menunggu", value: summary.pending },
                { label: "Berjalan", value: summary.in_progress },
                { label: "Selesai", value: summary.done },
              ]
        ).map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {state.tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
          Belum ada tugas {taskType === "official" ? "official" : "khusus"} yang
          terdaftar.
        </div>
      ) : (
        <div className="space-y-3">
          {taskType === "official"
            ? (state.tasks as InstaPost[]).map((post) => {
                const statusBadge = (label: string, active: boolean) => (
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </span>
                );

                return (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 md:max-w-[220px]">
                        {post.isVideo && post.videoUrl ? (
                          <video
                            controls
                            className="h-full w-full object-cover"
                            src={post.videoUrl}
                          />
                        ) : post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt={post.caption || "Postingan official"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-40 items-center justify-center text-xs text-slate-400">
                            Tidak ada media
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                            <span>Tugas #{post.taskNumber}</span>
                            <span>•</span>
                            <span>
                              {post.createdAt.toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                            {post.isCarousel ? (
                              <>
                                <span>•</span>
                                <span>
                                  Carousel ({post.carouselImages.length})
                                </span>
                              </>
                            ) : null}
                            {post.isVideo ? (
                              <>
                                <span>•</span>
                                <span>Video</span>
                              </>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-200">
                            {post.caption || "Tidak ada caption."}
                          </p>
                          {post.sourceUrl ? (
                            <a
                              href={post.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-sky-600 hover:underline dark:text-cyan-300"
                            >
                              Lihat sumber
                            </a>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {statusBadge(
                            post.downloaded ? "Sudah diunduh" : "Belum diunduh",
                            post.downloaded,
                          )}
                          {statusBadge(
                            post.reported ? "Sudah dilaporkan" : "Belum dilaporkan",
                            post.reported,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            : (state.tasks as TaskItem[]).map((task) => {
                const statusKey = (task.status || "").toLowerCase();
                const statusLabel =
                  statusLabels[statusKey] || task.status || "Tidak diketahui";
                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                          {task.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          {task.description || "Tidak ada deskripsi."}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-300">
                          <span>Client: {task.clientName || "-"}</span>
                          <span>Assignee: {task.assignedTo || "-"}</span>
                          <span>Due: {task.dueDate || "-"}</span>
                        </div>
                      </div>
                      <span className="w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
}
