export type Stats = { files: number; frames: number; segments: number; slides: number; duplicates: number };
export type Savings = { scenario: string; bytes_before: number; bytes_after: number };
export type StorageFile = { name: string; kind: string; size_bytes: number; source: string; sha256: string };
export type SearchResult = { kind: string; file: string; t_sec: number | null; frame_image: string | null; slide_id: string; snippet: string };
export type Duplicate = { kind: string; a: string; b: string; note?: string };

export const stats: Stats = { files: 7, frames: 3, segments: 12, slides: 16, duplicates: 5 };
export const savings: Savings[] = [
  { scenario: "video_distill", bytes_before: 1043234567, bytes_after: 2150000 },
  { scenario: "dedup", bytes_before: 52000000, bytes_after: 31000000 },
  { scenario: "offboarding", bytes_before: 8400000, bytes_after: 2100000 },
];
export const files: StorageFile[] = [
  { name: "talk.mp4", kind: "video", size_bytes: 1043234567, source: "play", sha256: "3fa9c0d1e2b4…" },
  { name: "deck_a.pdf", kind: "document", size_bytes: 41000, source: "sharepoint", sha256: "9b1c…" },
  { name: "deck_a (1).pdf", kind: "document", size_bytes: 41000, source: "sharepoint", sha256: "9b1c…" },
];
export const searchResults: SearchResult[] = [
  { kind: "segment", file: "talk.mp4", t_sec: 96.0, frame_image: "frames/3fa9c0d1e2b4/f0012.webp", slide_id: "3fa9c0d1e2b4:2:9f2c01ab", snippet: "As you see here, the [latency] drops from 12 ms to 4 ms" },
  { kind: "slide", file: "deck_a.pdf", t_sec: null, frame_image: null, slide_id: "9b1c22aa01ff:2:9f2c01ab", snippet: "Median [latency] dropped from 12 ms to 4 ms" },
];
export const duplicates: Duplicate[] = [
  { kind: "file_exact", a: "deck_a (1).pdf", b: "deck_a.pdf", note: "name hint: (1)" },
  { kind: "slide_text", a: "deck_b.pdf slide 1", b: "deck_a.pdf slide 1" },
  { kind: "revision", a: "deck_a_rev2.pdf", b: "deck_a.pdf" },
];