export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1000)), units.length - 1);
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: index < 2 ? 0 : 2 }).format(bytes / 1000 ** index)} ${units[index]}`;
}
export const percentSaved = (before: number, after: number) => before > 0 ? ((before - after) / before) * 100 : 0;
export const formatTimestamp = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map(n => n.toString().padStart(2, "0")).join(":");
};
export function totalStorage(
  files: { size_bytes: number }[] | undefined,
  savings: { scenario: string; bytes_before: number; bytes_after: number }[] | undefined,
) {
  if (!files?.length) return null;
  const original = files.reduce((sum, f) => sum + f.size_bytes, 0);
  const dedup = savings?.find(s => s.scenario === "dedup");
  const video = savings?.find(s => s.scenario === "video_distill");
  let reduced = dedup ? dedup.bytes_after : original;
  if (video) reduced = reduced - video.bytes_before + video.bytes_after;
  const savedPct = original > 0 ? ((original - reduced) / original) * 100 : 0;
  return { original, reduced, savedPct, hasSavings: !!savings?.length };
}
