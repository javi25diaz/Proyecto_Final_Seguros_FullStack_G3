import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

function parseCalendarDay(value: unknown): CalendarDay | null {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return { year: value.getFullYear(), month: value.getMonth(), day: value.getDate() };
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!isoMatch) {
    return null;
  }

  const year = Number(isoMatch[1]);
  const month = Number(isoMatch[2]) - 1;
  const day = Number(isoMatch[3]);
  const candidate = new Date(year, month, day);

  if (candidate.getFullYear() !== year || candidate.getMonth() !== month || candidate.getDate() !== day) {
    return null;
  }

  return { year, month, day };
}

function compareCalendarDays(a: CalendarDay, b: CalendarDay): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function formatCalendarDay(day: CalendarDay): string {
  const month = String(day.month + 1).padStart(2, '0');
  const date = String(day.day).padStart(2, '0');
  return `${day.year}-${month}-${date}`;
}

export function notFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as unknown;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const selectedDay = parseCalendarDay(value);
    if (!selectedDay) {
      return null;
    }

    const now = new Date();
    const maximumDay: CalendarDay = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };

    if (compareCalendarDays(selectedDay, maximumDay) <= 0) {
      return null;
    }

    return {
      futureDate: {
        selectedDate: String(value),
        maximumDate: formatCalendarDay(maximumDay)
      }
    };
  };
}
