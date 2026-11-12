import { afterEach, describe, expect, it, vi } from "vitest";
import { getStats, getSavings, getFiles, getDuplicates, search } from "./api";
import { formatTimestamp, percentSaved } from "./format";
import * as mock from "@/mocks/data";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("external API fallback", () => {
  const reads = [
    { name: "stats", read: getStats, expected: mock.stats },
    { name: "savings", read: getSavings, expected: mock.savings },
    { name: "files", read: getFiles, expected: mock.files },
    { name: "duplicates", read: getDuplicates, expected: mock.duplicates },
    { name: "search", read: () => search("latency"), expected: mock.searchResults },
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
    expect((await getSavings()).map(s => [s.bytes_before, s.bytes_after])).toEqual([[1043234567, 2150000], [52000000, 31000000], [8400000, 2100000]]);
    expect((await getFiles()).map(f => f.size_bytes)).toEqual([1043234567, 41000, 41000]);
  });
  it("retains the canonical duplicate copy in b", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await getDuplicates()).map(d => d.b)).toEqual(["deck_a.pdf", "deck_a.pdf slide 1", "deck_a.pdf"]);
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
it("calculates saved percent from before and after", () => expect(percentSaved(8400000, 2100000)).toBe(75));
it("formats 96 seconds as 01:36", () => expect(formatTimestamp(96)).toBe("01:36"));