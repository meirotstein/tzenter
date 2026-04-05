import { Event, HebrewCalendar } from "@hebcal/core";

const cache: Record<string, Event[]> = {};

export async function getJewishEventsOnDateWrapper(
  date: Date
): Promise<Event[]> {
  const dateStr = date.toISOString();
  if (cache[dateStr]) {
    console.log("cache hit", dateStr);
    return cache[dateStr];
  }

  const holidays = HebrewCalendar.calendar({
    omer: true,
    il: true,
    start: date,
    end: date,
  }) as Event[];

  cache[dateStr] = holidays;
  return holidays;
}
