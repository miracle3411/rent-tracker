import { addMonths } from 'date-fns';

export function calcNextDueDate(bookingDate: string): Date {
  let dueDate = addMonths(new Date(bookingDate), 1);
  dueDate.setUTCHours(0, 0, 0, 0);
  const now = new Date();
  while (dueDate <= now) {
    dueDate = addMonths(dueDate, 1);
  }
  return dueDate;
}

export function calcRemainingPayment(
  monthlyRent: number | null,
  advancedPayment: number | null
): number {
  const rent = monthlyRent ?? 0;
  const advance = advancedPayment ?? 0;
  return rent - advance;
}
