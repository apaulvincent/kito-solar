export function formatHourParts12h(hourDecimal: number): {
  time12: string;
  period: 'AM' | 'PM';
} {
  const normalized = ((hourDecimal % 24) + 24) % 24;
  const totalMinutes = Math.round(normalized * 60);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const displayMinute = String(minutes).padStart(2, '0');
  return {
    time12: `${displayHour}:${displayMinute}`,
    period,
  };
}

export function formatHourDecimal12h(hourDecimal: number): string {
  const { time12, period } = formatHourParts12h(hourDecimal);
  return `${time12} ${period}`;
}
