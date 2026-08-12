/**
 * Holiday data source for Calendar app
 * Provides public holidays that can be auto-populated for users
 */

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  country: string; // ISO country code: "IN", "US", "UK", etc.
  type: "public" | "optional" | "bank";
}

// 🇮🇳 Indian Holidays 2024-2025
const INDIAN_HOLIDAYS_2024: Holiday[] = [
  { date: "2024-01-26", name: "Republic Day", country: "IN", type: "public" },
  { date: "2024-03-08", name: "Maha Shivaratri", country: "IN", type: "public" },
  { date: "2024-03-25", name: "Holi", country: "IN", type: "public" },
  { date: "2024-03-29", name: "Good Friday", country: "IN", type: "public" },
  { date: "2024-04-11", name: "Eid-ul-Fitr", country: "IN", type: "public" },
  { date: "2024-04-14", name: "Ambedkar Jayanti", country: "IN", type: "public" },
  { date: "2024-05-01", name: "Labour Day", country: "IN", type: "public" },
  { date: "2024-08-15", name: "Independence Day", country: "IN", type: "public" },
  { date: "2024-08-26", name: "Janmashtami", country: "IN", type: "public" },
  { date: "2024-10-02", name: "Gandhi Jayanti", country: "IN", type: "public" },
  { date: "2024-10-12", name: "Dussehra", country: "IN", type: "public" },
  { date: "2024-11-01", name: "Diwali", country: "IN", type: "public" },
  { date: "2024-11-15", name: "Guru Nanak Jayanti", country: "IN", type: "public" },
  { date: "2024-12-25", name: "Christmas", country: "IN", type: "public" },
];

const INDIAN_HOLIDAYS_2025: Holiday[] = [
  { date: "2025-01-26", name: "Republic Day", country: "IN", type: "public" },
  { date: "2025-02-26", name: "Maha Shivaratri", country: "IN", type: "public" },
  { date: "2025-03-14", name: "Holi", country: "IN", type: "public" },
  { date: "2025-03-31", name: "Eid-ul-Fitr", country: "IN", type: "public" },
  { date: "2025-04-14", name: "Ambedkar Jayanti", country: "IN", type: "public" },
  { date: "2025-08-15", name: "Independence Day", country: "IN", type: "public" },
  { date: "2025-10-02", name: "Gandhi Jayanti", country: "IN", type: "public" },
  { date: "2025-10-20", name: "Diwali", country: "IN", type: "public" },
  { date: "2025-12-25", name: "Christmas", country: "IN", type: "public" },
];

// 🇺🇸 US Holidays 2024-2025
const US_HOLIDAYS_2024: Holiday[] = [
  { date: "2024-01-01", name: "New Year's Day", country: "US", type: "public" },
  { date: "2024-01-15", name: "Martin Luther King Jr. Day", country: "US", type: "public" },
  { date: "2024-02-19", name: "Presidents' Day", country: "US", type: "public" },
  { date: "2024-05-27", name: "Memorial Day", country: "US", type: "public" },
  { date: "2024-06-19", name: "Juneteenth", country: "US", type: "public" },
  { date: "2024-07-04", name: "Independence Day", country: "US", type: "public" },
  { date: "2024-09-02", name: "Labor Day", country: "US", type: "public" },
  { date: "2024-10-14", name: "Columbus Day", country: "US", type: "public" },
  { date: "2024-11-11", name: "Veterans Day", country: "US", type: "public" },
  { date: "2024-11-28", name: "Thanksgiving", country: "US", type: "public" },
  { date: "2024-12-25", name: "Christmas", country: "US", type: "public" },
];

const US_HOLIDAYS_2025: Holiday[] = [
  { date: "2025-01-01", name: "New Year's Day", country: "US", type: "public" },
  { date: "2025-01-20", name: "Martin Luther King Jr. Day", country: "US", type: "public" },
  { date: "2025-02-17", name: "Presidents' Day", country: "US", type: "public" },
  { date: "2025-05-26", name: "Memorial Day", country: "US", type: "public" },
  { date: "2025-06-19", name: "Juneteenth", country: "US", type: "public" },
  { date: "2025-07-04", name: "Independence Day", country: "US", type: "public" },
  { date: "2025-09-01", name: "Labor Day", country: "US", type: "public" },
  { date: "2025-10-13", name: "Columbus Day", country: "US", type: "public" },
  { date: "2025-11-11", name: "Veterans Day", country: "US", type: "public" },
  { date: "2025-11-27", name: "Thanksgiving", country: "US", type: "public" },
  { date: "2025-12-25", name: "Christmas", country: "US", type: "public" },
];

// Combine all holidays
export const HOLIDAYS: Holiday[] = [
  ...INDIAN_HOLIDAYS_2024,
  ...INDIAN_HOLIDAYS_2025,
  ...US_HOLIDAYS_2024,
  ...US_HOLIDAYS_2025,
];

/**
 * Get holidays for a specific country and year
 */
export function getHolidays(country?: string, year?: number): Holiday[] {
  return HOLIDAYS.filter(h => {
    const holidayYear = parseInt(h.date.split("-")[0]);
    const matchesCountry = !country || h.country === country;
    const matchesYear = !year || holidayYear === year;
    return matchesCountry && matchesYear;
  });
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: string, country?: string): Holiday | undefined {
  return HOLIDAYS.find(h => 
    h.date === date && (!country || h.country === country)
  );
}

/**
 * Get holiday badge color based on holiday type
 */
export function getHolidayBadgeColor(type: Holiday["type"]): string {
  switch (type) {
    case "public":
      return "#FF3B30"; // Red
    case "optional":
      return "#FF9F0A"; // Orange
    case "bank":
      return "#30D158"; // Green
    default:
      return "#FF3B30";
  }
}
