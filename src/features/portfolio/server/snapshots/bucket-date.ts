const DEFAULT_TIME_ZONE = "Europe/Warsaw";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DEFAULT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getBucketDate(date: Date, timeZone = DEFAULT_TIME_ZONE): string {
  if (timeZone === DEFAULT_TIME_ZONE) {
    return formatter.format(date);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
