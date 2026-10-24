import type { CalendarCell, CalendarGrid, ContributionDay } from './types.js';
import { isContributionLevel, isRecord } from './validation.js';

const DAY_MS = 86_400_000;
const DAYS_PER_WEEK = 7;
const MAX_CALENDAR_SPAN_DAYS = 371;

/** Parse a date without silently accepting invalid days such as February 30. */
function parseDateTimestamp(value: string): number {
  const hasDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const time = hasDateFormat ? Date.parse(`${value}T00:00:00Z`) : NaN;

  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new Error('Invalid calendar date; expected a real YYYY-MM-DD date.');
  }

  return time;
}

/** Dense column-major calendar. Null dates represent positions absent in the source. */
export function normalizeDays(days: unknown): CalendarGrid {
  if (!Array.isArray(days) || days.length === 0) {
    throw new Error('The calendar contains no days.');
  }

  const sortedDays = validateAndSortDays(days);
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];
  const spanDays = (lastDay.time - firstDay.time) / DAY_MS;

  if (spanDays > MAX_CALENDAR_SPAN_DAYS) {
    throw new Error('Calendar must cover at most one year of contribution weeks.');
  }

  // Align partial weeks to Sunday before assigning their column positions.
  const firstWeekday = new Date(firstDay.time).getUTCDay();
  const firstSunday = firstDay.time - firstWeekday * DAY_MS;
  const width = Math.floor((lastDay.time - firstSunday) / (DAYS_PER_WEEK * DAY_MS)) + 1;
  const cells: CalendarCell[] = Array.from({ length: width * DAYS_PER_WEEK }, (_, position) => ({
    x: Math.floor(position / DAYS_PER_WEEK),
    y: position % DAYS_PER_WEEK,
    date: null,
    level: 0,
  }));

  for (const day of sortedDays) {
    const position = Math.round((day.time - firstSunday) / DAY_MS);
    const cell: CalendarCell = {
      x: Math.floor(position / DAYS_PER_WEEK),
      y: position % DAYS_PER_WEEK,
      date: day.date,
      level: day.level,
    };

    if (day.count !== undefined) {
      cell.count = day.count;
    }

    cells[position] = cell;
  }

  return {
    width,
    height: DAYS_PER_WEEK,
    cells,
    from: firstDay.date,
    to: lastDay.date,
  };
}

interface DatedContribution extends ContributionDay {
  time: number;
}

function validateAndSortDays(days: unknown[]): DatedContribution[] {
  const seenDates = new Set<string>();

  const validatedDays = days.map((day: unknown): DatedContribution => {
    if (!isRecord(day)) {
      throw new Error('Invalid calendar day.');
    }

    const { date, level, count } = day;
    if (typeof date !== 'string') {
      throw new Error('Invalid calendar date; expected a real YYYY-MM-DD date.');
    }
    const time = parseDateTimestamp(date);
    if (seenDates.has(date)) {
      throw new Error('Duplicate date in the calendar.');
    }
    seenDates.add(date);

    if (!isContributionLevel(level)) {
      throw new Error('Contribution level must be an integer from 0 to 4.');
    }

    if (count !== undefined && (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0)) {
      throw new Error('Contribution count must be a nonnegative integer.');
    }

    return { date, level, ...(count !== undefined ? { count } : {}), time };
  });

  return validatedDays.sort((a, b) => a.time - b.time);
}
