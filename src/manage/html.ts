import { Minyan } from "../datasource/entities/Minyan";
import {
  Prayer,
  RelativeTime,
  Schedule,
  WeekDay,
} from "../datasource/entities/Schedule";
import { prayerHebName } from "../utils";

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderWeekdayCheckboxes(selectedDays?: WeekDay[]) {
  const weekDays = [
    { value: WeekDay.Sunday, label: "א'" },
    { value: WeekDay.Monday, label: "ב'" },
    { value: WeekDay.Tuesday, label: "ג'" },
    { value: WeekDay.Wednesday, label: "ד'" },
    { value: WeekDay.Thursday, label: "ה'" },
    { value: WeekDay.Friday, label: "ו'" },
    { value: WeekDay.Saturday, label: "שבת" },
  ];

  return weekDays
    .map(
      ({ value, label }) => `
        <label class="checkbox">
          <input type="checkbox" name="weekDays" value="${value}" ${
            selectedDays?.includes(value) ? "checked" : ""
          } />
          <span>${label}</span>
        </label>
      `
    )
    .join("");
}

function renderPrayerOptions(selected?: Prayer) {
  return [
    { value: Prayer.Shacharit, label: prayerHebName(Prayer.Shacharit) },
    { value: Prayer.Mincha, label: prayerHebName(Prayer.Mincha) },
    { value: Prayer.Arvit, label: prayerHebName(Prayer.Arvit) },
    { value: Prayer.Slichot, label: prayerHebName(Prayer.Slichot) },
  ]
    .map(
      ({ value, label }) =>
        `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`
    )
    .join("");
}

function renderRelativeOptions(selected?: RelativeTime) {
  return [
    { value: "", label: "ללא" },
    { value: RelativeTime.BEFORE_SUNSET, label: "לפני שקיעה" },
    { value: RelativeTime.AFTER_SUNSET, label: "אחרי שקיעה" },
    { value: RelativeTime.BEFORE_SUNRISE, label: "לפני זריחה" },
    { value: RelativeTime.AFTER_SUNRISE, label: "אחרי זריחה" },
  ]
    .map(
      ({ value, label }) =>
        `<option value="${value}" ${
          selected === value ? "selected" : ""
        }>${label}</option>`
    )
    .join("");
}

function renderWeeklyDetermineOptions(selected?: WeekDay) {
  const options = [
    { value: "", label: "ללא" },
    { value: WeekDay.Sunday, label: "יום א'" },
    { value: WeekDay.Monday, label: "יום ב'" },
    { value: WeekDay.Tuesday, label: "יום ג'" },
    { value: WeekDay.Wednesday, label: "יום ד'" },
    { value: WeekDay.Thursday, label: "יום ה'" },
    { value: WeekDay.Friday, label: "יום ו'" },
    { value: WeekDay.Saturday, label: "שבת" },
  ];

  return options
    .map(
      ({ value, label }) =>
        `<option value="${value}" ${
          selected === value ? "selected" : ""
        }>${label}</option>`
    )
    .join("");
}

function renderScheduleForm(schedule?: Schedule) {
  const action = schedule
    ? `/manage-minyan-schedules?id=${schedule.id}`
    : "/manage-minyan-schedules";
  const method = schedule ? "PATCH" : "POST";
  const buttonText = schedule ? "שמירת שינויים" : "הוספת תזמון";

  return `
    <form class="panel form-grid js-json-form" action="${action}" data-method="${method}">
      <h3>${schedule ? `תזמון #${schedule.id}` : "תזמון חדש"}</h3>
      <label>
        <span>שם</span>
        <input name="name" value="${escapeHtml(schedule?.name)}" required />
      </label>
      <label>
        <span>תפילה</span>
        <select name="prayer" required>
          ${renderPrayerOptions(schedule?.prayer)}
        </select>
      </label>
      <label>
        <span>שעה</span>
        <input name="time" type="time" value="${escapeHtml(
          schedule?.time?.slice(0, 5)
        )}" required />
      </label>
      <label>
        <span>זמן יחסי</span>
        <select name="relative">
          ${renderRelativeOptions(schedule?.relative)}
        </select>
      </label>
      <label>
        <span>יום קובע שבועי</span>
        <select name="weeklyDetermineByDay">
          ${renderWeeklyDetermineOptions(schedule?.weeklyDetermineByDay)}
        </select>
      </label>
      <label>
        <span>תאריך התחלה</span>
        <input name="startAt" type="date" value="${escapeHtml(
          schedule?.startAt
            ? new Date(schedule.startAt).toISOString().slice(0, 10)
            : ""
        )}" />
      </label>
      <label>
        <span>תאריך סיום</span>
        <input name="endAt" type="date" value="${escapeHtml(
          schedule?.endAt ? new Date(schedule.endAt).toISOString().slice(0, 10) : ""
        )}" />
      </label>
      <label>
        <span>קונפיג</span>
        <input name="config" type="number" value="${escapeHtml(schedule?.config)}" />
      </label>
      <div class="field-group">
        <span>ימי שבוע</span>
        <div class="weekday-grid">
          ${renderWeekdayCheckboxes(schedule?.weekDays)}
        </div>
      </div>
      <label class="checkbox">
        <input type="checkbox" name="enabled" ${
          schedule?.enabled ?? !schedule ? "checked" : ""
        } />
        <span>פעיל</span>
      </label>
      <label class="checkbox">
        <input type="checkbox" name="roundToNearestFiveMinutes" ${
          schedule?.roundToNearestFiveMinutes ? "checked" : ""
        } />
        <span>עיגול ל-5 דקות</span>
      </label>
      <div class="actions">
        <button type="submit">${buttonText}</button>
        ${
          schedule
            ? `<button type="button" class="danger" data-delete-schedule="${schedule.id}">מחיקת תזמון</button>`
            : ""
        }
      </div>
    </form>
  `;
}

export function renderExpiredManageMinyanPage() {
  return `
    <!doctype html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>צענטר | הקישור פג תוקף</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f6f0e7; color: #1f2937; display: grid; place-items: center; min-height: 100vh; margin: 0; }
          main { background: white; border-radius: 16px; padding: 32px; max-width: 460px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
          h1 { margin-top: 0; }
          p { line-height: 1.6; }
        </style>
      </head>
      <body>
        <main>
          <h1>הקישור פג תוקף</h1>
          <p>כדי להיכנס שוב לממשק הניהול, יש לפתוח את הקישור מחדש דרך צענטר בוואטסאפ.</p>
        </main>
      </body>
    </html>
  `;
}

export function renderManageMinyanPage(input: {
  minyan: Minyan;
  schedules: Schedule[];
  displayName: string;
}) {
  const { minyan, schedules, displayName } = input;

  return `
    <!doctype html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>צענטר | ממשק ניהול</title>
        <style>
          :root {
            --bg: #f5efe5;
            --paper: #fffdf9;
            --ink: #1f2937;
            --muted: #6b7280;
            --accent: #9a3412;
            --accent-soft: #ffedd5;
            --border: #e5d7c2;
            --danger: #b91c1c;
          }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; background: radial-gradient(circle at top, #fff7ed, var(--bg)); color: var(--ink); }
          .shell { max-width: 1100px; margin: 0 auto; padding: 24px; }
          .header { display: flex; gap: 16px; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
          .brand { background: var(--paper); border: 1px solid var(--border); border-radius: 18px; padding: 18px 22px; box-shadow: 0 16px 40px rgba(154, 52, 18, 0.08); }
          .brand h1 { margin: 0 0 6px; font-size: 28px; }
          .brand p { margin: 0; color: var(--muted); }
          .logout-form button { background: transparent; border: 1px solid var(--border); border-radius: 999px; padding: 10px 16px; cursor: pointer; }
          .grid { display: grid; gap: 20px; }
          .panel { background: var(--paper); border: 1px solid var(--border); border-radius: 18px; padding: 18px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06); }
          .panel h2, .panel h3 { margin-top: 0; }
          .form-grid { display: grid; gap: 12px; }
          label, .field-group { display: grid; gap: 6px; font-weight: 600; }
          input, select, button { font: inherit; }
          input, select { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: white; }
          button { border: 0; border-radius: 12px; padding: 10px 16px; background: var(--accent); color: white; cursor: pointer; }
          button.danger { background: var(--danger); }
          .actions { display: flex; gap: 10px; flex-wrap: wrap; }
          .checkbox { display: flex; align-items: center; gap: 10px; font-weight: 500; }
          .checkbox input { width: 18px; height: 18px; }
          .weekday-grid { display: flex; gap: 10px; flex-wrap: wrap; }
          .helper { color: var(--muted); font-size: 14px; }
          .notice { margin-bottom: 18px; padding: 12px 14px; background: var(--accent-soft); border-radius: 12px; }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="header">
            <div class="brand">
              <h1>צענטר</h1>
              <p>ממשק ניהול עבור ${escapeHtml(minyan.name)}</p>
              <p class="helper">מחובר כעת בתור ${escapeHtml(displayName)}</p>
            </div>
            <form class="logout-form" method="POST" action="/manage-minyan?action=logout">
              <button type="submit">התנתקות</button>
            </form>
          </div>

          <div class="notice">העדכונים נשמרים ישירות עבור המניין הנבחר.</div>

          <div class="grid">
            <form class="panel form-grid js-json-form" action="/manage-minyan-details" data-method="PATCH">
              <h2>פרטי המניין</h2>
              <label>
                <span>שם</span>
                <input name="name" value="${escapeHtml(minyan.name)}" required />
              </label>
              <label>
                <span>עיר</span>
                <input name="city" value="${escapeHtml(minyan.city)}" required />
              </label>
              <label>
                <span>קו רוחב</span>
                <input name="latitude" type="number" step="0.000001" value="${escapeHtml(
                  minyan.latitude
                )}" />
              </label>
              <label>
                <span>קו אורך</span>
                <input name="longitude" type="number" step="0.000001" value="${escapeHtml(
                  minyan.longitude
                )}" />
              </label>
              <button type="submit">שמירת פרטי מניין</button>
            </form>

            <section class="grid">
              <div class="panel">
                <h2>תזמונים קיימים</h2>
                <p class="helper">ניתן לערוך, למחוק, או להוסיף תזמון חדש.</p>
              </div>
              ${schedules.map((schedule) => renderScheduleForm(schedule)).join("")}
              ${renderScheduleForm()}
            </section>
          </div>
        </div>
        <script>
          function serializeForm(form) {
            const payload = {};
            const elements = Array.from(form.elements || []);

            elements.forEach((element) => {
              if (!element.name || element.disabled) {
                return;
              }

              if (element.type === "checkbox") {
                if (element.name === "weekDays") {
                  if (!payload.weekDays) {
                    payload.weekDays = [];
                  }
                  if (element.checked) {
                    payload.weekDays.push(element.value);
                  }
                  return;
                }

                payload[element.name] = element.checked;
                return;
              }

              if (element.type === "button" || element.type === "submit") {
                return;
              }

              payload[element.name] = element.value;
            });

            if (Array.isArray(payload.weekDays) && payload.weekDays.length === 0) {
              payload.weekDays = [];
            }

            return payload;
          }

          async function handleSubmit(event) {
            event.preventDefault();
            const form = event.currentTarget;
            const method = form.dataset.method || form.method || "POST";
            const response = await fetch(form.action, {
              method,
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(serializeForm(form))
            });

            if (!response.ok) {
              const data = await response.json().catch(() => ({ error: "אירעה שגיאה" }));
              alert(data.error || "אירעה שגיאה");
              return;
            }

            window.location.reload();
          }

          document.querySelectorAll(".js-json-form").forEach((form) => {
            form.addEventListener("submit", handleSubmit);
          });

          document.querySelectorAll("[data-delete-schedule]").forEach((button) => {
            button.addEventListener("click", async () => {
              if (!confirm("למחוק את התזמון הזה?")) {
                return;
              }

              const response = await fetch("/manage-minyan-schedules?id=" + encodeURIComponent(button.dataset.deleteSchedule), {
                method: "DELETE",
                credentials: "same-origin"
              });

              if (!response.ok) {
                const data = await response.json().catch(() => ({ error: "אירעה שגיאה" }));
                alert(data.error || "אירעה שגיאה");
                return;
              }

              window.location.reload();
            });
          });
        </script>
      </body>
    </html>
  `;
}
