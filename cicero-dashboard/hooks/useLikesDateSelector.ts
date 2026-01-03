"use client";

import { useMemo, useState } from "react";
import {
  VIEW_OPTIONS,
  getWeekRangeFromValue,
} from "@/components/ViewDataSelector";

type DateRange = { startDate?: string; endDate?: string };

type ViewOption = (typeof VIEW_OPTIONS)[number];
type ViewValue = ViewOption["value"];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalMonthString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

export function formatDisplayDate(value?: string) {
  if (!value || typeof value !== "string") return "-";
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  return fullDateFormatter.format(date);
}

export function formatDisplayMonth(value?: string) {
  if (!value || typeof value !== "string") return "-";
  const [year, month] = value.split("-").map((part) => Number(part));
  if (!year || !month) return value;
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return monthFormatter.format(date);
}

export function formatDisplayRange(start?: string, end?: string) {
  if (!start) return "-";
  if (!end || start === end) {
    return formatDisplayDate(start);
  }
  return `${formatDisplayDate(start)} s.d. ${formatDisplayDate(end)}`;
}

export function useLikesDateSelector({
  options = VIEW_OPTIONS,
}: { options?: ViewOption[] } = {}) {
  const viewOptions = options?.length ? options : VIEW_OPTIONS;
  const defaultView =
    viewOptions.find((option) => option.value === "today")?.value ||
    viewOptions[0]?.value ||
    "today";

  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();
  const [viewBy, setViewBy] = useState<ViewValue>(defaultView);
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyDate, setMonthlyDate] = useState(currentMonth);
  const [weeklyDate, setWeeklyDate] = useState(
    getWeekRangeFromValue(undefined, new Date(today)).weekKey,
  );
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: today,
    endDate: today,
  });

  const normalizedViewBy = viewOptions.some((option) => option.value === viewBy)
    ? viewBy
    : defaultView;

  const handleViewChange = (nextView: ViewValue) => {
    if (!viewOptions.some((option) => option.value === nextView)) {
      setViewBy(defaultView);
      return;
    }

    setViewBy((prevView) => {
      const currentView = viewOptions.some((option) => option.value === prevView)
        ? prevView
        : defaultView;

      if (nextView === "today") {
        setDailyDate(today);
      }
      if (nextView === "date" && currentView !== "date") {
        setDailyDate(today);
      }
      if (nextView === "month" && currentView !== "month") {
        setMonthlyDate(currentMonth);
      }
      if (nextView === "week" && currentView !== "week") {
        setWeeklyDate(getWeekRangeFromValue(undefined, new Date(today)).weekKey);
      }
      if (nextView === "custom_range" && currentView !== "custom_range") {
        setDateRange({
          startDate: today,
          endDate: today,
        });
      }
      return nextView;
    });
  };

  const handleDateChange = (val: string | DateRange) => {
    if (normalizedViewBy === "custom_range") {
      if (!val || typeof val !== "object") {
        return;
      }
      setDateRange((prev) => {
        const nextRange: DateRange = {
          startDate: val.startDate ?? prev.startDate ?? today,
          endDate: val.endDate ?? prev.endDate ?? prev.startDate ?? today,
        };
        if (!nextRange.startDate) {
          nextRange.startDate = today;
        }
        if (!nextRange.endDate) {
          nextRange.endDate = nextRange.startDate;
        }
        if (nextRange.startDate && nextRange.endDate) {
          const start = new Date(nextRange.startDate);
          const end = new Date(nextRange.endDate);
          if (start > end) {
            return {
              startDate: nextRange.endDate,
              endDate: nextRange.startDate,
            };
          }
        }
        return nextRange;
      });
      return;
    }
    if (normalizedViewBy === "month") {
      setMonthlyDate((val as string) || currentMonth);
      return;
    }
    if (normalizedViewBy === "week") {
      setWeeklyDate((val as string) || getWeekRangeFromValue(undefined, new Date(today)).weekKey);
      return;
    }
    setDailyDate((val as string) || today);
  };

  const normalizedDailyDate = dailyDate || today;
  const normalizedMonthlyDate = monthlyDate || currentMonth;
  const normalizedWeeklyDate =
    weeklyDate || getWeekRangeFromValue(undefined, new Date(today)).weekKey;
  const normalizedRangeStart = dateRange.startDate || today;
  const normalizedRangeEnd = dateRange.endDate || normalizedRangeStart;
  const normalizedRange = {
    startDate: normalizedRangeStart,
    endDate: normalizedRangeEnd,
  };

  const normalizedCustomDate =
    normalizedViewBy === "month"
      ? normalizedMonthlyDate
      : normalizedViewBy === "week"
        ? normalizedWeeklyDate
        : normalizedDailyDate;

  const reportPeriodeLabel = useMemo(() => {
    if (normalizedViewBy === "custom_range") {
      return formatDisplayRange(normalizedRangeStart, normalizedRangeEnd);
    }
    if (normalizedViewBy === "month") {
      return formatDisplayMonth(normalizedMonthlyDate);
    }
    if (normalizedViewBy === "week") {
      const { startDate, endDate } = getWeekRangeFromValue(
        normalizedWeeklyDate,
        new Date(normalizedDailyDate),
      );
      return formatDisplayRange(startDate, endDate);
    }
    return formatDisplayDate(normalizedDailyDate);
  }, [
    normalizedViewBy,
    normalizedRangeStart,
    normalizedRangeEnd,
    normalizedMonthlyDate,
    normalizedWeeklyDate,
    normalizedDailyDate,
  ]);

  const selectorDateValue =
    normalizedViewBy === "custom_range"
      ? dateRange
      : normalizedViewBy === "month"
        ? monthlyDate
        : normalizedViewBy === "week"
          ? normalizedWeeklyDate
        : dailyDate;

  return {
    viewBy: normalizedViewBy,
    viewOptions,
    selectorDateValue,
    handleViewChange,
    handleDateChange,
    normalizedCustomDate,
    normalizedRange,
    normalizedDailyDate,
    normalizedMonthlyDate,
    normalizedWeeklyDate,
    reportPeriodeLabel,
  };
}

export default useLikesDateSelector;
