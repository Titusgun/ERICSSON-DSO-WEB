import * as mock from "@/mocks/data";

export const API_URL = (import.meta.env['VITE_API_URL'] ?? "http://127.0.0.1:5000").replace(/\/$/, "");
let mockUsed = false;
const listeners = new Set<() => void>();
export const subscribeMock = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getMockStatus = () => mockUsed;

async function request<T>(path: string, fallback: T): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error("API timed out"));
        controller.abort();
      }, 1500);
    });
    const responseData = (async () => {
      const response = await fetch(`${API_URL}/api/${path}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      return await response.json() as T;
    })();
    return await Promise.race([responseData, deadline]);
  } catch {
    mockUsed = true;
    listeners.forEach((listener) => listener());
    return structuredClone(fallback);
  } finally {
    clearTimeout(timeout);
  }
}

export const getStats = () => request("stats", mock.stats);
export const getSavings = () => request("savings", mock.savings);
export const getFiles = () => request("files", mock.files);
export const getDuplicates = () => request("duplicates", mock.duplicates);
export const getRecording = (sha12: string) => request(`recording/${encodeURIComponent(sha12)}`, mock.recording);
export const search = (query: string) => request(`search?q=${encodeURIComponent(query)}`, mock.searchResults.filter((result) => `${result.snippet} ${result.file} ${result.slide_id}`.toLowerCase().includes(query.trim().toLowerCase())));