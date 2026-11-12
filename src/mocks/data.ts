export type Stats = { files: number; frames: number; segments: number; slides: number; duplicates: number };
export type Savings = { scenario: string; bytes_before: number; bytes_after: number };
export type StorageFile = { name: string; kind: string; size_bytes: number; source: string; sha256: string; owner?: string };
export type Recording = { source: { file_name: string }; duration_sec: number; frames: { id: string; t_sec: number; image: string; slide_id: string }[]; segments: { id: string; start_sec: number; end_sec: number; speaker: string; text: string; frame_id: string }[] };
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
  { name: "deck_b.pdf", kind: "document", size_bytes: 52000, source: "sharepoint", sha256: "a31e…" },
  { name: "deck_a_rev2.pdf", kind: "document", size_bytes: 45000, source: "sharepoint", sha256: "7c2d…" },
  { name: "deck_b - Copy.pdf", kind: "document", size_bytes: 52000, source: "offboarding", owner: "jane", sha256: "a31e…" },
  { name: "my_notes.pdf", kind: "document", size_bytes: 18000, source: "offboarding", owner: "jane", sha256: "e43f…" },
];
export const searchResults: SearchResult[] = [
  { kind: "segment", file: "talk.mp4", t_sec: 96.0, frame_image: "frames/3fa9c0d1e2b4/f0012.webp", slide_id: "3fa9c0d1e2b4:2:9f2c01ab", snippet: "As you see here, the [latency] drops from 12 ms to 4 ms" },
  { kind: "slide", file: "deck_a.pdf", t_sec: null, frame_image: null, slide_id: "9b1c22aa01ff:2:9f2c01ab", snippet: "Median [latency] dropped from 12 ms to 4 ms" },
];
export const duplicates: Duplicate[] = [
  { kind: "file_exact", a: "deck_a (1).pdf", b: "deck_a.pdf", note: "name hint: (1)" },
  { kind: "slide_text", a: "deck_b.pdf slide 1", b: "deck_a.pdf slide 1" },
  { kind: "revision", a: "deck_a.pdf", b: "deck_a_rev2.pdf" },
];

export const recording: Recording = {
  source: { file_name: "talk.mp4" }, duration_sec: 120,
  frames: [
    { id: "f0", t_sec: 0, image: "/recording-frames/frame-0.svg", slide_id: "9b1c22aa01ff:1:overview" },
    { id: "f8", t_sec: 8, image: "/recording-frames/frame-8.svg", slide_id: "9b1c22aa01ff:2:9f2c01ab" },
    { id: "f16", t_sec: 16, image: "/recording-frames/frame-16.svg", slide_id: "9b1c22aa01ff:3:summary" },
  ],
  segments: [
    { id: "s1", start_sec: 0, end_sec: 4, speaker: "Presenter", text: "Today we will review the latency measurements from our latest test.", frame_id: "f0" },
    { id: "s2", start_sec: 4, end_sec: 8, speaker: "Presenter", text: "The baseline median response time was 12 milliseconds.", frame_id: "f0" },
    { id: "s3", start_sec: 8, end_sec: 11, speaker: "Presenter", text: "This slide compares the baseline with the optimized configuration.", frame_id: "f8" },
    { id: "s4", start_sec: 11, end_sec: 14, speaker: "Presenter", text: "As you see here, the latency drops from 12 ms to 4 ms.", frame_id: "f8" },
    { id: "s5", start_sec: 14, end_sec: 16, speaker: "Presenter", text: "That is a two-thirds reduction in median latency.", frame_id: "f8" },
    { id: "s6", start_sec: 16, end_sec: 20, speaker: "Presenter", text: "We can retain the key frames and their associated transcript.", frame_id: "f16" },
    { id: "s7", start_sec: 20, end_sec: 25, speaker: "Presenter", text: "The searchable text preserves the knowledge without keeping every video frame.", frame_id: "f16" },
  ],
};