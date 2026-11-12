import type { Recording, Savings, SearchResult } from "@/mocks/data";

export const videoSavings = (savings: Savings[] | undefined) => savings?.find(s => s.scenario === "video_distill");
export const recordingSha = (result: SearchResult) => result.sha12 ?? result.frame_image?.match(/frames\/([^/]+)/)?.[1];
export const frameSegments = (recording: Recording, frameId: string) => recording.segments.filter(s => s.frame_id === frameId).sort((a, b) => a.start_sec - b.start_sec);
export function frameAtTime(recording: Recording, seconds: number) {
  const frames = [...recording.frames].sort((a, b) => a.t_sec - b.t_sec);
  return frames.filter(f => f.t_sec <= seconds).at(-1) ?? frames[0];
}