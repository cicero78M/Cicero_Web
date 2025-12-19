"use client";

import { useEffect, useMemo, useState } from "react";
import useReposterAuth from "@/hooks/useReposterAuth";
import {
  getOfficialTasks,
  getSpecialTasks,
  TaskItem,
} from "@/utils/api";

type ReposterTaskListProps = {
  taskType: "official" | "special";
};

type TaskState = {
  tasks: TaskItem[];
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
  const { token, isHydrating } = useReposterAuth();
  const [state, setState] = useState<TaskState>({
    tasks: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (isHydrating || !token) return;

    const controller = new AbortController();

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const res =
          taskType === "official"
            ? await getOfficialTasks(token, {}, controller.signal)
            : await getSpecialTasks(token, {}, controller.signal);
        setState({ tasks: res.tasks, loading: false, error: "" });
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
  }, [isHydrating, token, taskType]);

  const summary = useMemo(() => {
    const totals = {
      total: state.tasks.length,
      pending: 0,
      in_progress: 0,
      done: 0,
    };
    state.tasks.forEach((task) => {
      const statusKey = (task.status || "").toLowerCase();
      if (statusKey.includes("progress")) totals.in_progress += 1;
      else if (statusKey.includes("done") || statusKey.includes("complete")) {
        totals.done += 1;
      } else if (statusKey.includes("pending") || statusKey.includes("todo")) {
        totals.pending += 1;
      }
    });
    return totals;
  }, [state.tasks]);

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
        {[
          { label: "Total tugas", value: summary.total },
          { label: "Menunggu", value: summary.pending },
          { label: "Berjalan", value: summary.in_progress },
          { label: "Selesai", value: summary.done },
        ].map((item) => (
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
          {state.tasks.map((task) => {
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
