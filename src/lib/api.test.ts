import { afterEach, describe, expect, it, vi } from "vitest";
import { getStats, getSavings, getFiles, getDuplicates, getOffboarding, getRecording, search, NotFoundError } from "./api";
import { videoSavings, frameSegments, frameAtTime, recordingSha } from "./workspace";
import { formatTimestamp, percentSaved } from "./format";
import * as mock from "@/mocks/data";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("external API fallback", () => {
  const reads = [
    { name: "stats", read: getStats, expected: mock.stats },
    { name: "savings", read: getSavings, expected: mock.savings },
    { name: "files", read: getFiles, expected: mock.files },
    { name: "duplicates", read: getDuplicates, expected: mock.duplicates },
    { name: "offboarding", read: getOffboarding, expected: mock.offboarding },
    { name: "search", read: () => search("latency"), expected: mock.searchResults },
    { name: "recording", read: () => getRecording("3fa9c0d1e2b4"), expected: mock.recording },
  ];
  it.each(reads)("returns $name fallback at 1.5 seconds, before the 2-second loading limit", async ({ read, expected }) => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    let settled = false;
    const result = read().then(value => { settled = true; return value; });
    await vi.advanceTimersByTimeAsync(1499);
    expect(settled).toBe(false);
    expect(fetchMock.mock.calls[0]?.[1].signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toEqual(expected);
    expect(settled).toBe(true);
    expect(fetchMock.mock.calls[0]?.[1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("bounds a stalled response body to 1.5 seconds too", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => new Promise(() => {}) }));
    const result = getStats();
    await vi.advanceTimersByTimeAsync(1500);
    expect(await result).toEqual(mock.stats);
  });
  it.each([
    { ok: false, status: 500 },
    { ok: true, json: async () => { throw new Error("Invalid JSON"); } },
  ])("falls back immediately on response errors", async response => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    expect(await getStats()).toEqual(mock.stats);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("returns the supplied counts when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await getStats()).toEqual({ files: 7, frames: 3, segments: 12, slides: 16, duplicates: 5 });
  });
  it("preserves all supplied storage values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await getSavings()).map(s => [s.bytes_before, s.bytes_after])).toEqual([[1043234567, 2150000], [52000000, 31000000], [70000, 18000]]);
    expect((await getFiles()).slice(0, 3).map(f => f.size_bytes)).toEqual([1043234567, 41000, 41000]);
  });
  it("retains the canonical duplicate copy in b", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await getDuplicates()).map(d => d.b)).toEqual(["deck_a.pdf", "deck_a.pdf slide 1", "deck_a_rev2.pdf"]);
    expect((await getDuplicates()).find(d => d.kind === "revision")?.a).toBe("deck_a.pdf");
  });
  it("filters mock search and encodes the query for the API", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await search("latency")).toHaveLength(2);
    expect(await search("notfound")).toHaveLength(0);
    await search("latency & frames");
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain("/api/search?q=latency%20%26%20frames");
  });
  it("uses a successful API response instead of mock data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ files: 99 }) }));
    expect(await getStats()).toEqual({ files: 99 });
  });
});
it("uses only video_distill for the summary without summing scenarios", () => {
  expect(videoSavings(mock.savings)).toEqual({ scenario: "video_distill", bytes_before: 1043234567, bytes_after: 2150000 });
  expect(videoSavings(mock.savings.filter(s => s.scenario !== "video_distill"))).toBeUndefined();
});
it("provides seven files including jane's offboarding notes", () => {
  expect(mock.files).toHaveLength(7);
  expect(mock.files.map(f => f.name)).toEqual(["talk.mp4", "deck_a.pdf", "deck_a (1).pdf", "deck_b.pdf", "deck_a_rev2.pdf", "deck_b - Copy.pdf", "my_notes.pdf"]);
  expect(mock.files.find(f => f.name === "deck_a_rev2.pdf")?.source).toBe("sharepoint");
  expect(mock.files.find(f => f.name === "my_notes.pdf")).toMatchObject({ source: "offboarding", owner: "jane" });
  expect(mock.files.find(f => f.name === "deck_b - Copy.pdf")).toMatchObject({ source: "offboarding", owner: "jane" });
});
it("provides frames at 0, 8, 16 seconds with two to three segments each", () => {
  expect(mock.recording.frames.map(f => f.t_sec)).toEqual([0, 8, 16]);
  expect(mock.recording.frames.map(f => frameSegments(mock.recording, f.id).length)).toEqual([2, 3, 2]);
  expect(frameSegments(mock.recording, "f8").map(s => s.id)).toEqual(["s3", "s4", "s5"]);
  expect(frameAtTime(mock.recording, 8)?.id).toBe("f8");
  expect(frameAtTime(mock.recording, 96)?.id).toBe("f16");
});
it("requests the recording by sha12", async () => {
  const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
  vi.stubGlobal("fetch", fetchMock);
  expect(await getRecording("3fa9c0d1e2b4")).toEqual(mock.recording);
  expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/recording/3fa9c0d1e2b4");
});
it("throws NotFoundError instead of mock data when the recording API returns 404", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
  await expect(getRecording("3fa9c0d1e2b4")).rejects.toBeInstanceOf(NotFoundError);
});
it("derives the recording sha from sha12 first, then frame_image, never slide_id", () => {
  expect(recordingSha(mock.searchResults[0]!)).toBe("3fa9c0d1e2b4");
  expect(recordingSha({ ...mock.searchResults[0]!, sha12: null })).toBe("3fa9c0d1e2b4");
  expect(recordingSha({ ...mock.searchResults[0]!, sha12: null, frame_image: "frames/aabbccddee11/f0001.webp", slide_id: "999999999999:2:xyz" })).toBe("aabbccddee11");
  expect(recordingSha({ ...mock.searchResults[0]!, sha12: null, frame_image: null })).toBeUndefined();
});
it("calculates saved percent from before and after", () => expect(percentSaved(8400000, 2100000)).toBe(75));
it("formats 96 seconds as 01:36", () => expect(formatTimestamp(96)).toBe("01:36"));
it("requests offboarding from its API endpoint and uses a successful review", async () => {
  const review = { ...mock.offboarding, simulated: false };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => review });
  vi.stubGlobal("fetch", fetchMock);
  expect(await getOffboarding()).toEqual(review);
  expect(fetchMock.mock.calls[0]?.[0]).toMatch(/\/api\/offboarding$/);
});
it("keeps Jane's byte-identical copy deletable and her unique notes retained in the dry run", () => {
  expect(mock.offboarding.dry_run).toBe(true);
  expect(mock.offboarding.simulated).toBe(true);
  expect(mock.offboarding.owners).toEqual(["jane"]);
  expect(mock.offboarding.files.map(f => [f.name, f.owner, f.size_bytes, f.verdict, f.copy_at])).toEqual([
    ["deck_b - Copy.pdf", "jane", 52000, "safe to delete", "sharepoint/deck_b.pdf"],
    ["my_notes.pdf", "jane", 18000, "keep", null],
  ]);
  expect(mock.offboarding.files[0]?.sha256).toBe(mock.files.find(f => f.name === "deck_b.pdf")?.sha256);
});
it("matches offboarding totals and savings to the two reviewed files", () => {
  const review = mock.offboarding;
  expect(review.total_files).toBe(2);
  expect(review.total_files).toBe(review.files.length);
  expect(review.total_bytes).toBe(70000);
  expect(review.total_bytes).toBe(review.files.reduce((sum, f) => sum + f.size_bytes, 0));
  expect(review.safe_files).toBe(1);
  expect(review.keep_files).toBe(1);
  expect(review.freeable_bytes).toBe(52000);
  expect(review.freeable_bytes).toBe(review.files.filter(f => f.verdict === "safe to delete").reduce((sum, f) => sum + f.size_bytes, 0));
  expect(review.percent_freed).toBeCloseTo(74.285714);
  expect(mock.savings.find(s => s.scenario === "offboarding")).toEqual({ scenario: "offboarding", bytes_before: 70000, bytes_after: 18000 });
});