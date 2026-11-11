export function formatHourDecimal12h(hourDecimal: number): string {
  const normalized = ((hourDecimal % 24) + 24) % 24;
  const wholeHours = Math.floor(normalized);
  const roundedMinutes = Math.round((normalized - wholeHours) * 60);
  const adjustedHours = roundedMinutes === 60 ? (wholeHours + 1) % 24 : wholeHours;
  const adjustedMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
  const period = adjustedHours >= 12 ? 'PM' : 'AM';
  const displayHour = adjustedHours % 12 === 0 ? 12 : adjustedHours % 12;
  const displayMinute = String(adjustedMinutes).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}
