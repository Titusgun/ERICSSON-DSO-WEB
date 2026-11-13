export type Stats = { files: number; frames: number; segments: number; slides: number; duplicates: number };
export type Savings = { scenario: string; bytes_before: number; bytes_after: number };
export type StorageFile = { name: string; kind: string; size_bytes: number; source: string; sha256: string; owner?: string };
export type Recording = { source: { file_name: string }; duration_sec: number; frames: { id: string; t_sec: number; image: string; slide_id: string }[]; segments: { id: string; start_sec: number; end_sec: number; speaker: string; text: string; frame_id: string }[] };
export type SearchResult = { kind: string; file: string; t_sec: number | null; frame_image: string | null; slide_id: string | null; sha12?: string | null; snippet: string };
export type Duplicate = { kind: string; a: string; b: string; note?: string };
export type Offboarding = {
  dry_run: true;
  simulated: boolean;
  owners: string[];
  total_files: number;
  total_bytes: number;
  safe_files: number;
  keep_files: number;
  freeable_bytes: number;
  percent_freed: number;
  files: { name: string; path: string; owner: string; size_bytes: number; sha256: string; verdict: "safe to delete" | "keep"; copy_at: string | null }[];
};

export const stats: Stats = { files: 7, frames: 3, segments: 12, slides: 16, duplicates: 5 };
export const savings: Savings[] = [
  { scenario: "video_distill", bytes_before: 1043234567, bytes_after: 2150000 },
  { scenario: "dedup", bytes_before: 52000000, bytes_after: 31000000 },
  { scenario: "offboarding", bytes_before: 70000, bytes_after: 18000 },
];
export const files: StorageFile[] = [
  { name: "talk.mp4", kind: "video", size_bytes: 1043234567, source: "play", sha256: "3fa9c0d1e2b4a6f8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8" },
  { name: "deck_a.pdf", kind: "document", size_bytes: 41000, source: "sharepoint", sha256: "9b1c22aa01ff3e5d7a9c1e3f5a7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b" },
  { name: "deck_a (1).pdf", kind: "document", size_bytes: 41000, source: "sharepoint", sha256: "9b1c22aa01ff3e5d7a9c1e3f5a7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b" },
  { name: "deck_b.pdf", kind: "document", size_bytes: 52000, source: "sharepoint", sha256: "a31e5b7c9d2f4a6b8c1e3f5a7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d" },
  { name: "deck_a_rev2.pdf", kind: "document", size_bytes: 45000, source: "sharepoint", sha256: "7c2d4e6f8a1b3c5d7e9f2a4b6c8d1e3f5a7b9c2d4e6f8a1b3c5d7e9f2a4b6c8d" },
  { name: "deck_b - Copy.pdf", kind: "document", size_bytes: 52000, source: "offboarding", owner: "jane", sha256: "a31e5b7c9d2f4a6b8c1e3f5a7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d" },
  { name: "my_notes.pdf", kind: "document", size_bytes: 18000, source: "offboarding", owner: "jane", sha256: "e43f6a8b1c3d5e7f9a2b4c6d8e1f3a5b7c9d2e4f6a8b1c3d5e7f9a2b4c6d8e1f" },
];
export const searchResults: SearchResult[] = [
  { kind: "segment", file: "talk.mp4", t_sec: 96.0, frame_image: "frames/3fa9c0d1e2b4/f0012.webp", slide_id: "3fa9c0d1e2b4:2:9f2c01ab", sha12: "3fa9c0d1e2b4", snippet: "As you see here, the [latency] drops from 12 ms to 4 ms" },
  { kind: "slide", file: "deck_a.pdf", t_sec: null, frame_image: null, slide_id: "9b1c22aa01ff:2:9f2c01ab", snippet: "Median [latency] dropped from 12 ms to 4 ms" },
];
export const offboarding: Offboarding = {
  dry_run: true, simulated: true, owners: ["jane"],
  total_files: 2, total_bytes: 70000, safe_files: 1, keep_files: 1,
  freeable_bytes: 52000, percent_freed: 52000 / 70000 * 100,
  files: [
    { name: "deck_b - Copy.pdf", path: "offboarding/jane/deck_b - Copy.pdf", owner: "jane", size_bytes: 52000, sha256: files[5]?.sha256 ?? "", verdict: "safe to delete", copy_at: "sharepoint/deck_b.pdf" },
    { name: "my_notes.pdf", path: "offboarding/jane/my_notes.pdf", owner: "jane", size_bytes: 18000, sha256: files[6]?.sha256 ?? "", verdict: "keep", copy_at: null },
  ],
};
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