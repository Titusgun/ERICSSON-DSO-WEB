export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1000)), units.length - 1);
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: index < 2 ? 0 : 2 }).format(bytes / 1000 ** index)} ${units[index]}`;
}
export const percentSaved = (before: number, after: number) => before > 0 ? ((before - after) / before) * 100 : 0;
export const formatTimestamp = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;