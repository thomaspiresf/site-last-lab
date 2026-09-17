// Builds a Monday-start 7-column week matrix for a "YYYY-MM" month string,
// including the leading/trailing days from adjacent months (grayed out).

export function buildMonthWeeks(monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    const date = new Date(year, month - 1, dayNum);
    cells.push({ date, key: toDateKey(date), inMonth: dayNum >= 1 && dayNum <= daysInMonth });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
