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

export function dateRangeValidator(startControlName: string, endControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const startControl = group.get(startControlName);
    const endControl = group.get(endControlName);
    if (!startControl || !endControl) {
      return null;
    }

    const startValue = startControl.value as unknown;
    const endValue = endControl.value as unknown;
    if (startValue === null || startValue === undefined || startValue === '' ||
        endValue === null || endValue === undefined || endValue === '') {
      return null;
    }

    const startDay = parseCalendarDay(startValue);
    const endDay = parseCalendarDay(endValue);
    if (!startDay || !endDay) {
      return null;
    }

    if (compareCalendarDays(endDay, startDay) > 0) {
      return null;
    }

    return {
      dateRange: {
        startDate: String(startValue),
        endDate: String(endValue)
      }
    };
  };
}
