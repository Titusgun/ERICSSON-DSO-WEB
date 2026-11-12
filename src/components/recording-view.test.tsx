import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { RecordingView } from "./recording-view";
import { recording } from "@/mocks/data";

vi.mock("@/lib/api", () => ({ API_URL: "http://localhost:5000", getRecording: async () => recording, NotFoundError: class NotFoundError extends Error {} }));
afterEach(cleanup);
function open(initialTime = 0) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RecordingView sha12="sample" initialTime={initialTime} onBack={() => {}} /></QueryClientProvider>);
}
it("moves between chronological frames with buttons and stops at the boundaries", async () => {
  open();
  await screen.findByRole("button", { name: "Frame 00:00" });
  expect(screen.getByRole("button", { name: "Previous frame" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Next frame" }));
  expect(screen.getByRole("button", { name: "Frame 00:08" })).toHaveAttribute("aria-pressed", "true");
  const segment = recording.segments.find(segment => segment.frame_id === "f8");
  if (!segment) throw new Error("Missing frame 00:08 transcript fixture");
  expect(screen.getByText(segment.text)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next frame" }));
  expect(screen.getByRole("button", { name: "Frame 00:16" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Next frame" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Previous frame" }));
  expect(screen.getByRole("button", { name: "Frame 00:08" })).toHaveAttribute("aria-pressed", "true");
});
it("uses up/down arrows without wrapping or changing frames while typing", async () => {
  open(8);
  await screen.findByRole("button", { name: "Frame 00:08" });
  fireEvent.keyDown(window, { key: "ArrowDown" });
  expect(screen.getByRole("button", { name: "Frame 00:16" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.keyDown(window, { key: "ArrowDown" });
  expect(screen.getByRole("button", { name: "Frame 00:16" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.keyDown(window, { key: "ArrowUp" });
  expect(screen.getByRole("button", { name: "Frame 00:08" })).toHaveAttribute("aria-pressed", "true");
  const input = document.createElement("input");
  document.body.append(input);
  fireEvent.keyDown(input, { key: "ArrowUp" });
  expect(screen.getByRole("button", { name: "Frame 00:08" })).toHaveAttribute("aria-pressed", "true");
  input.remove();
  fireEvent.keyDown(window, { key: "ArrowUp" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Frame 00:00" })).toHaveAttribute("aria-pressed", "true"));
});