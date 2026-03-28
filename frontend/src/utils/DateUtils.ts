// 2026 Sri Lanka Public Holidays & Poya Days (YYYY-MM-DD)
export const GOVERNMENT_HOLIDAYS = [
  '2026-01-03', // Duruthu Full Moon Poya Day
  '2026-01-15', // Tamil Thai Pongal Day
  '2026-02-01', // Navam Full Moon Poya Day
  '2026-02-04', // National Day / Independence Day
  '2026-02-15', // Mahasivarathri Day
  '2026-03-02', // Madin Full Moon Poya Day
  '2026-03-21', // Eid al-Fitr (Ramazan Festival Day)
  '2026-04-01', // Bak Full Moon Poya Day
  '2026-04-03', // Good Friday
  '2026-04-13', // Sinhala and Tamil New Year's Eve
  '2026-04-14', // Sinhala and Tamil New Year's Day
  '2026-05-01', // Vesak Full Moon Poya Day & May Day
  '2026-05-02', // Day after Vesak Full Moon Poya Day
  '2026-05-28', // Eid al-Adha (Hadji Festival Day)
  '2026-05-30', // Adhi Poson Full Moon Poya Day
  '2026-06-29', // Poson Full Moon Poya Day
  '2026-07-29', // Esala Full Moon Poya Day
  '2026-08-26', // Milad-Un-Nabi (Holy Prophet's Birthday)
  '2026-08-27', // Nikini Full Moon Poya Day
  '2026-09-26', // Binara Full Moon Poya Day
  '2026-10-25', // Vap Full Moon Poya Day
  '2026-11-08', // Deepavali Festival Day
  '2026-11-24', // Il Full Moon Poya Day
  '2026-12-23', // Unduvap Full Moon Poya Day
  '2026-12-25', // Christmas Day
];

/**
 * Checks if a given date string (YYYY-MM-DD) is a school leave day 
 * (Weekend or Government Holiday)
 */
export const isSchoolLeaveDay = (dateStr: string): boolean => {
  const dateObj = new Date(dateStr);
  const day = dateObj.getDay();
  const isWeekend = day === 0 || day === 6;
  const isPublicHoliday = GOVERNMENT_HOLIDAYS.includes(dateStr);
  return isWeekend || isPublicHoliday;
};

/**
 * Format a Date object to YYYY-MM-DD string
 */
export const formatToISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
/**
 * Calculates total school leave days for a specific year and month
 */
export const getMonthlyLeaveCount = (year: number, month: number): number => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;
  
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = formatToISODate(date);
    if (isSchoolLeaveDay(dateStr)) {
      count++;
    }
  }
  return count;
};
