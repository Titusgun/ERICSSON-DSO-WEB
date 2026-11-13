import { expect, it } from "vitest";
import { taggedFileCopies } from "./workspace";

it("targets tagged whole-file copies, not slide matches or older revisions", () => {
  expect(taggedFileCopies([
    { kind: "file_exact", a: "deck_a (1).pdf", b: "deck_a.pdf" },
    { kind: "file_content", a: "deck_b - Copy.pdf", b: "deck_b.pdf" },
    { kind: "slide_text", a: "deck_c.pdf slide 1", b: "deck_b.pdf slide 1" },
    { kind: "revision", a: "old.pdf", b: "new.pdf" },
  ])).toEqual(["deck_a (1).pdf", "deck_b - Copy.pdf"]);
});

it("never targets a kept copy and deduplicates file names", () => {
  expect(taggedFileCopies([
    { kind: "file_exact", a: "copy.pdf", b: "kept.pdf" },
    { kind: "file_exact", a: "copy.pdf", b: "kept.pdf" },
    { kind: "file_exact", a: "kept.pdf", b: "original.pdf" },
  ])).toEqual(["copy.pdf"]);
});