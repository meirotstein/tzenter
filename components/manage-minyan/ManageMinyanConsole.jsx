import Image from "next/image";
import { useMemo, useState } from "react";

const CONFIG_FLAG_OPTIONS = [
  { value: 1, label: "להפעיל גם בחג" },
  { value: 2, label: "להפעיל גם בערב חג" },
];

const PRAYER_OPTIONS = [
  { value: 1, label: "שחרית" },
  { value: 2, label: "מנחה" },
  { value: 3, label: "ערבית" },
  { value: 4, label: "סליחות" },
];

const RELATIVE_OPTIONS = [
  { value: "", label: "ללא" },
  { value: "BEFORE_SUNSET", label: "לפני שקיעה" },
  { value: "AFTER_SUNSET", label: "אחרי שקיעה" },
  { value: "BEFORE_SUNRISE", label: "לפני זריחה" },
  { value: "AFTER_SUNRISE", label: "אחרי זריחה" },
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: "א'" },
  { value: 2, label: "ב'" },
  { value: 3, label: "ג'" },
  { value: 4, label: "ד'" },
  { value: 5, label: "ה'" },
  { value: 6, label: "ו'" },
  { value: 7, label: "שבת" },
];

const WEEKLY_REFERENCE_OPTIONS = [
  { value: "", label: "ללא" },
  { value: 1, label: "יום א'" },
  { value: 2, label: "יום ב'" },
  { value: 3, label: "יום ג'" },
  { value: 4, label: "יום ד'" },
  { value: 5, label: "יום ה'" },
  { value: 6, label: "יום ו'" },
  { value: 7, label: "שבת" },
];

function normalizeSchedule(schedule) {
  return {
    id: schedule.id,
    name: schedule.name || "",
    prayer: Number(schedule.prayer || 1),
    time: (schedule.time || "07:00:00").slice(0, 5),
    relative: schedule.relative || "",
    weeklyDetermineByDay:
      schedule.weeklyDetermineByDay === null ||
      schedule.weeklyDetermineByDay === undefined
        ? ""
        : String(schedule.weeklyDetermineByDay),
    startAt: schedule.startAt ? String(schedule.startAt).slice(0, 10) : "",
    endAt: schedule.endAt ? String(schedule.endAt).slice(0, 10) : "",
    config: Number(schedule.config || 0),
    enabled: schedule.enabled !== false,
    roundToNearestFiveMinutes: !!schedule.roundToNearestFiveMinutes,
    weekDays: Array.isArray(schedule.weekDays)
      ? schedule.weekDays.map((value) => String(value))
      : [],
  };
}

function buildSchedulePayload(schedule) {
  return {
    name: schedule.name,
    prayer: Number(schedule.prayer),
    time: schedule.time,
    relative: schedule.relative || "",
    weeklyDetermineByDay: schedule.weeklyDetermineByDay,
    startAt: schedule.startAt || "",
    endAt: schedule.endAt || "",
    config: Number(schedule.config || 0),
    enabled: schedule.enabled,
    roundToNearestFiveMinutes: schedule.roundToNearestFiveMinutes,
    weekDays: schedule.weekDays,
  };
}

function hasConfigFlag(config, flag) {
  return (Number(config || 0) & flag) === flag;
}

function toggleConfigFlag(config, flag) {
  const currentConfig = Number(config || 0);
  return hasConfigFlag(currentConfig, flag)
    ? currentConfig & ~flag
    : currentConfig | flag;
}

function StatusBanner({ status, onDismiss }) {
  if (!status) {
    return null;
  }

  return (
    <div
      className={`relative z-10 mx-auto mb-4 flex max-w-7xl items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-right ${
        status.type === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span>{status.message}</span>
      <button
        type="button"
        className="cursor-pointer bg-transparent font-bold transition hover:-translate-y-0.5"
        onClick={onDismiss}
      >
        סגור
      </button>
    </div>
  );
}

function ExpiredView() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,rgba(234,88,12,0.18),transparent_30%),linear-gradient(180deg,#f7ecdd_0%,#ebd8bc_100%)] px-6 py-10">
      <section className="w-full max-w-xl rounded-[28px] border border-[rgba(146,64,14,0.14)] bg-[rgba(255,251,245,0.92)] px-8 py-10 text-center shadow-[0_24px_48px_rgba(124,45,18,0.12)]" dir="rtl">
        <div className="mx-auto h-[112px] w-[112px] overflow-hidden rounded-[28px] border border-[rgba(146,64,14,0.18)] bg-[rgba(255,255,255,0.82)] p-2 shadow-[0_18px_30px_rgba(154,52,18,0.18)]">
          <Image
            src="/tzenter-logo.webp"
            alt="צענטר"
            width={96}
            height={96}
            className="h-full w-full rounded-[22px] object-cover"
            priority
          />
        </div>
        <h1 className="mt-6 text-4xl font-bold text-[#2d160a]">
          הקישור פג תוקף
        </h1>
        <p className="mt-4 text-lg leading-8 text-[#6b4d37]">
          כדי להיכנס שוב לממשק הניהול, יש לבקש קישור חדש דרך צענטר
          בוואטסאפ.
        </p>
      </section>
    </main>
  );
}

function ScheduleEditor({
  schedule,
  onChange,
  onSave,
  onDelete,
  saving,
  deleting,
  isNew,
}) {
  return (
    <section className="rounded-[24px] border border-[rgba(144,82,22,0.14)] bg-[rgba(255,251,245,0.92)] p-6 text-right shadow-[0_18px_42px_rgba(83,30,8,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#9a3412]">
            תזמון
          </p>
          <h3 className="m-0 text-2xl font-bold text-[#2d160a]">
            {isNew ? "תזמון חדש" : schedule.name || `תזמון #${schedule.id}`}
          </h3>
        </div>
        {!isNew ? (
          <span className="inline-flex min-w-14 items-center justify-center rounded-full bg-[rgba(249,115,22,0.12)] px-3 py-2 font-bold text-[#9a3412]">
            #{schedule.id}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="grid gap-2 font-bold text-[#4a3423]">
          <span>שם</span>
          <input
            className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
            value={schedule.name}
            onChange={(event) => onChange({ ...schedule, name: event.target.value })}
          />
        </label>

        <label className="grid gap-2 font-bold text-[#4a3423]">
          <span>תפילה</span>
          <select
            className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
            value={schedule.prayer}
            onChange={(event) =>
              onChange({ ...schedule, prayer: Number(event.target.value) })
            }
          >
            {PRAYER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 font-bold text-[#4a3423]">
          <span>שעה</span>
          <input
            className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
            type="time"
            value={schedule.time}
            onChange={(event) => onChange({ ...schedule, time: event.target.value })}
          />
        </label>

        <label className="grid gap-2 font-bold text-[#4a3423]">
          <span>זמן יחסי</span>
          <select
            className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
            value={schedule.relative}
            onChange={(event) =>
              onChange({ ...schedule, relative: event.target.value })
            }
          >
            {RELATIVE_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 font-bold text-[#4a3423]">
          <span>יום קובע שבועי</span>
          <select
            className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
            value={schedule.weeklyDetermineByDay}
            onChange={(event) =>
              onChange({
                ...schedule,
                weeklyDetermineByDay: event.target.value,
              })
            }
          >
            {WEEKLY_REFERENCE_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 font-bold text-[#4a3423]">
          <span>תאריך התחלה</span>
          <input
            className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
            type="date"
            value={schedule.startAt}
            onChange={(event) =>
              onChange({ ...schedule, startAt: event.target.value })
            }
          />
        </label>

        <label className="grid gap-2 font-bold text-[#4a3423]">
          <span>תאריך סיום</span>
          <input
            className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
            type="date"
            value={schedule.endAt}
            onChange={(event) => onChange({ ...schedule, endAt: event.target.value })}
          />
        </label>

      </div>

      <div className="mt-5">
        <span className="mb-3 block font-bold text-[#4a3423]">התנהגות בימים מיוחדים</span>
        <div className="flex flex-wrap gap-2.5">
          {CONFIG_FLAG_OPTIONS.map((option) => {
            const checked = hasConfigFlag(schedule.config, option.value);
            return (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,237,213,0.82)] px-3.5 py-2.5 font-bold text-[#7c2d12]"
              >
                <input
                  type="checkbox"
                  className="m-0"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      ...schedule,
                      config: toggleConfigFlag(schedule.config, option.value),
                    })
                  }
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <span className="mb-3 block font-bold text-[#4a3423]">ימי שבוע</span>
        <div className="flex flex-wrap gap-2.5">
          {WEEKDAY_OPTIONS.map((day) => {
            const checked = schedule.weekDays.includes(String(day.value));
            return (
              <label
                key={day.value}
                className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,237,213,0.82)] px-3.5 py-2.5 font-bold text-[#7c2d12]"
              >
                <input
                  type="checkbox"
                  className="m-0"
                  checked={checked}
                  onChange={() => {
                    const nextDays = checked
                      ? schedule.weekDays.filter((value) => value !== String(day.value))
                      : [...schedule.weekDays, String(day.value)];
                    onChange({ ...schedule, weekDays: nextDays });
                  }}
                />
                <span>{day.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-5">
        <label className="inline-flex items-center gap-2.5 font-bold text-[#4a3423]">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={(event) =>
              onChange({ ...schedule, enabled: event.target.checked })
            }
          />
          <span>פעיל</span>
        </label>

        <label className="inline-flex items-center gap-2.5 font-bold text-[#4a3423]">
          <input
            type="checkbox"
            checked={schedule.roundToNearestFiveMinutes}
            onChange={(event) =>
              onChange({
                ...schedule,
                roundToNearestFiveMinutes: event.target.checked,
              })
            }
          />
          <span>עיגול ל-5 דקות</span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-2xl bg-linear-to-br from-[#9a3412] to-[#ea580c] px-4 py-3 text-white shadow-[0_14px_28px_rgba(154,52,18,0.22)] transition hover:-translate-y-0.5"
          onClick={onSave}
        >
          {saving ? "שומר..." : isNew ? "הוספת תזמון" : "שמירת שינויים"}
        </button>
        {!isNew ? (
          <button
            type="button"
            className="cursor-pointer rounded-2xl bg-red-700 px-4 py-3 text-white transition hover:-translate-y-0.5"
            onClick={onDelete}
          >
            {deleting ? "מוחק..." : "מחיקת תזמון"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default function ManageMinyanConsole({
  expired,
  displayName,
  initialMinyan,
  initialSchedules,
}) {
  const [minyan, setMinyan] = useState(
    initialMinyan || {
      id: null,
      name: "",
      city: "",
      latitude: "",
      longitude: "",
    }
  );
  const [schedules, setSchedules] = useState(
    Array.isArray(initialSchedules)
      ? initialSchedules.map(normalizeSchedule)
      : []
  );
  const [draftSchedule, setDraftSchedule] = useState(
    normalizeSchedule({
      id: "new",
      prayer: 1,
      time: "07:00:00",
      enabled: true,
      roundToNearestFiveMinutes: false,
      weekDays: [],
    })
  );
  const [status, setStatus] = useState(null);
  const [savingMinyan, setSavingMinyan] = useState(false);
  const [busyScheduleId, setBusyScheduleId] = useState(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState(null);

  const subtitle = useMemo(() => {
    if (!minyan?.name) {
      return "ממשק ניהול מניין";
    }
    return `ממשק ניהול עבור ${minyan.name}`;
  }, [minyan]);

  if (expired) {
    return <ExpiredView />;
  }

  async function handleJsonResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "אירעה שגיאה בלתי צפויה");
    }
    return data;
  }

  async function saveMinyanDetails() {
    try {
      setSavingMinyan(true);
      const response = await fetch("/api/manage-minyan-details", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: minyan.name,
          city: minyan.city,
          latitude: minyan.latitude,
          longitude: minyan.longitude,
        }),
      });
      const data = await handleJsonResponse(response);
      setMinyan({
        id: data.minyan.id,
        name: data.minyan.name,
        city: data.minyan.city,
        latitude: data.minyan.latitude ?? "",
        longitude: data.minyan.longitude ?? "",
      });
      setStatus({ type: "success", message: "פרטי המניין נשמרו בהצלחה." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSavingMinyan(false);
    }
  }

  async function saveSchedule(schedule, isNew) {
    try {
      setBusyScheduleId(schedule.id);
      const response = await fetch(
        isNew
          ? "/api/manage-minyan-schedules"
          : `/api/manage-minyan-schedules?id=${encodeURIComponent(schedule.id)}`,
        {
          method: isNew ? "POST" : "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildSchedulePayload(schedule)),
        }
      );
      const data = await handleJsonResponse(response);
      const normalized = normalizeSchedule(data.schedule);

      if (isNew) {
        setSchedules((current) => [...current, normalized]);
        setDraftSchedule(
          normalizeSchedule({
            id: "new",
            prayer: 1,
            time: "07:00:00",
            enabled: true,
            roundToNearestFiveMinutes: false,
            weekDays: [],
          })
        );
      } else {
        setSchedules((current) =>
          current.map((item) => (item.id === normalized.id ? normalized : item))
        );
      }

      setStatus({ type: "success", message: "התזמון נשמר בהצלחה." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setBusyScheduleId(null);
    }
  }

  async function deleteSchedule(scheduleId) {
    if (!window.confirm("למחוק את התזמון הזה?")) {
      return;
    }

    try {
      setDeletingScheduleId(scheduleId);
      const response = await fetch(
        `/api/manage-minyan-schedules?id=${encodeURIComponent(scheduleId)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );
      await handleJsonResponse(response);
      setSchedules((current) => current.filter((item) => item.id !== scheduleId));
      setStatus({ type: "success", message: "התזמון נמחק." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setDeletingScheduleId(null);
    }
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(216,119,6,0.22),transparent_32%),linear-gradient(180deg,#f8f0e5_0%,#efe0c8_100%)] px-4 py-8 text-right md:px-6 md:py-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.65),transparent_88%)]" />
      <section className="relative z-10 mx-auto mb-6 flex max-w-7xl flex-col gap-5 rounded-[28px] border border-[rgba(157,90,25,0.18)] bg-[rgba(255,252,247,0.82)] p-6 shadow-[0_24px_50px_rgba(120,53,15,0.12)] backdrop-blur-[10px] lg:flex-row lg:items-start lg:justify-between">
        <div className="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[26px] border border-[rgba(157,90,25,0.18)] bg-[rgba(255,255,255,0.82)] p-2 shadow-[0_18px_32px_rgba(154,52,18,0.16)]">
          <Image
            src="/tzenter-logo.webp"
            alt="לוגו צענטר"
            width={76}
            height={76}
            className="h-full w-full rounded-[20px] object-cover"
            priority
          />
        </div>
        <div className="flex-1">
          <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#9a3412]">
            ממשק ניהול
          </p>
          <h1 className="m-0 text-4xl font-bold text-[#2d160a]">{subtitle}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[#6b4d37]">
            ניהול מהיר של פרטי המניין והתזמונים, עם חיבור ישיר לאותו סשן
            שמגיע מוואטסאפ.
          </p>
        </div>
        <form method="POST" action="/api/manage-minyan-logout">
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-[rgba(255,255,255,0.75)] px-4 py-3 text-[#7c2d12] shadow-[inset_0_0_0_1px_rgba(154,52,18,0.16)] transition hover:-translate-y-0.5"
          >
            התנתקות
          </button>
        </form>
      </section>

      <StatusBanner status={status} onDismiss={() => setStatus(null)} />

      <section className="relative z-10 mx-auto mb-6 grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-[rgba(144,82,22,0.14)] bg-[rgba(255,251,245,0.92)] p-6 text-right shadow-[0_18px_42px_rgba(83,30,8,0.08)]">
          <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#9a3412]">
            מניין פעיל
          </span>
          <strong>{minyan.name}</strong>
        </div>
        <div className="rounded-[24px] border border-[rgba(144,82,22,0.14)] bg-[rgba(255,251,245,0.92)] p-6 text-right shadow-[0_18px_42px_rgba(83,30,8,0.08)]">
          <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#9a3412]">
            מנהל מחובר
          </span>
          <strong>{displayName}</strong>
        </div>
        <div className="rounded-[24px] border border-[rgba(144,82,22,0.14)] bg-[rgba(255,251,245,0.92)] p-6 text-right shadow-[0_18px_42px_rgba(83,30,8,0.08)]">
          <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#9a3412]">
            תזמונים
          </span>
          <strong>{schedules.length}</strong>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)]">
        <section className="rounded-[24px] border border-[rgba(144,82,22,0.14)] bg-[rgba(255,251,245,0.92)] p-6 shadow-[0_18px_42px_rgba(83,30,8,0.08)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#9a3412]">
                פרטי מניין
              </p>
              <h2 className="m-0 text-3xl font-bold text-[#2d160a]">
                זהות ומיקום
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="grid gap-2 font-bold text-[#4a3423]">
              <span>שם</span>
              <input
                className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
                value={minyan.name}
                onChange={(event) =>
                  setMinyan((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 font-bold text-[#4a3423]">
              <span>עיר</span>
              <input
                className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
                value={minyan.city}
                onChange={(event) =>
                  setMinyan((current) => ({ ...current, city: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 font-bold text-[#4a3423]">
              <span>קו רוחב</span>
              <input
                className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
                type="number"
                step="0.000001"
                value={minyan.latitude}
                onChange={(event) =>
                  setMinyan((current) => ({
                    ...current,
                    latitude: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 font-bold text-[#4a3423]">
              <span>קו אורך</span>
              <input
                className="w-full rounded-2xl border border-[rgba(120,53,15,0.14)] bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[#1f2937] outline-none transition focus:border-[rgba(234,88,12,0.55)] focus:shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
                type="number"
                step="0.000001"
                value={minyan.longitude}
                onChange={(event) =>
                  setMinyan((current) => ({
                    ...current,
                    longitude: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-2xl bg-linear-to-br from-[#9a3412] to-[#ea580c] px-4 py-3 text-white shadow-[0_14px_28px_rgba(154,52,18,0.22)] transition hover:-translate-y-0.5"
              onClick={saveMinyanDetails}
            >
              {savingMinyan ? "שומר..." : "שמירת פרטי מניין"}
            </button>
          </div>
        </section>

        <section className="grid gap-4">
          <section className="rounded-[24px] border border-[rgba(144,82,22,0.14)] bg-[rgba(255,251,245,0.92)] p-6 text-right shadow-[0_18px_42px_rgba(83,30,8,0.08)]">
            <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#9a3412]">
              תזמונים
            </p>
            <h2 className="m-0 text-3xl font-bold text-[#2d160a]">
              ניהול לוח התפילות
            </h2>
            <p className="mt-3 text-lg leading-8 text-[#6b4d37]">
              עדכון תזמונים קבועים ויחסיים, הפעלה או השבתה, והוספת מסגרות זמן
              עתידיות למניין.
            </p>
          </section>

          {schedules.map((schedule) => (
            <ScheduleEditor
              key={schedule.id}
              schedule={schedule}
              onChange={(nextSchedule) =>
                setSchedules((current) =>
                  current.map((item) =>
                    item.id === nextSchedule.id ? nextSchedule : item
                  )
                )
              }
              onSave={() => saveSchedule(schedule, false)}
              onDelete={() => deleteSchedule(schedule.id)}
              saving={busyScheduleId === schedule.id}
              deleting={deletingScheduleId === schedule.id}
              isNew={false}
            />
          ))}

          <ScheduleEditor
            schedule={draftSchedule}
            onChange={setDraftSchedule}
            onSave={() => saveSchedule(draftSchedule, true)}
            saving={busyScheduleId === draftSchedule.id}
            deleting={false}
            isNew
          />
        </section>
      </section>
    </main>
  );
}
