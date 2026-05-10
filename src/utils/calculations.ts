export function calcRemainingPayment(
  monthlyRent: number | null,
  advancedPayment: number | null
): number {
  const rent = monthlyRent ?? 0;
  const advance = advancedPayment ?? 0;
  return rent - advance;
}
