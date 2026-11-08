// Dates as the site writes them, with ordinal days
import dayjs from "dayjs";

export const ordinal = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
// "4th Jul"
export const dayMonth = (iso: string) => `${ordinal(dayjs(iso).date())} ${dayjs(iso).format("MMM")}`;
// "4th July 1923"
export const fullDate = (iso: string) => `${ordinal(dayjs(iso).date())} ${dayjs(iso).format("MMMM YYYY")}`;
// "Wednesday 4th July 1923"
export const weekdayDate = (iso: string) => `${dayjs(iso).format("dddd")} ${fullDate(iso)}`;
