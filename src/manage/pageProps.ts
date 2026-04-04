import { getMinyanById } from "../datasource/minyansRepository";
import { getSchedulesByMinyanId } from "../datasource/scheduleRepository";
import {
  exchangeManageMinyanTokenForSession,
  getManageSession,
  setManageSessionCookie,
} from "./auth";

function serializeMinyan(minyan: any) {
  return {
    id: minyan.id,
    name: minyan.name,
    city: minyan.city,
    locationName: minyan.locationName ?? "",
    latitude: minyan.latitude ?? "",
    longitude: minyan.longitude ?? "",
  };
}

function serializeSchedule(schedule: any) {
  return {
    id: schedule.id,
    name: schedule.name,
    prayer: schedule.prayer,
    time: schedule.time,
    enabled: schedule.enabled,
    relative: schedule.relative ?? "",
    weeklyDetermineByDay: schedule.weeklyDetermineByDay ?? "",
    roundToNearestFiveMinutes: !!schedule.roundToNearestFiveMinutes,
    startAt: schedule.startAt
      ? new Date(schedule.startAt).toISOString().slice(0, 10)
      : "",
    endAt: schedule.endAt
      ? new Date(schedule.endAt).toISOString().slice(0, 10)
      : "",
    weekDays: Array.isArray(schedule.weekDays) ? schedule.weekDays : [],
    config: schedule.config ?? "",
  };
}

export async function getManageMinyanPageProps(context: any) {
  const token =
    typeof context.query?.t === "string" ? context.query.t : undefined;

  if (token) {
    const sessionId = await exchangeManageMinyanTokenForSession(token);
    if (!sessionId) {
      return {
        props: {
          expired: true,
        },
      };
    }

    setManageSessionCookie(context.res, sessionId);
    return {
      redirect: {
        destination: "/manage-minyan",
        permanent: false,
      },
    };
  }

  const session = await getManageSession(context.req);
  if (!session) {
    return {
      props: {
        expired: true,
      },
    };
  }

  const minyan = await getMinyanById(session.activeMinyanId);
  if (
    !minyan ||
    !session.minyanIdsAdminOf.includes(session.activeMinyanId) ||
    !minyan.admins?.some((admin) => admin.id === session.userId)
  ) {
    return {
      props: {
        expired: true,
      },
    };
  }

  const schedules = await getSchedulesByMinyanId(minyan.id);

  return {
    props: {
      expired: false,
      displayName: session.displayName,
      initialMinyan: serializeMinyan(minyan),
      initialSchedules: schedules.map(serializeSchedule),
    },
  };
}
