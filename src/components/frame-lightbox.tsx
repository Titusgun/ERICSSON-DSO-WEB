import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";

export type LightboxFrame = { id: string; t_sec: number; image: string; slide_id: string | null; slide_image?: string | null | undefined };

export function imageUrl(image: string) {
  return image.startsWith("/recording-frames/") || /^https?:\/\//.test(image) ? image : `${API_URL}/out/${image.replace(/^\//, "")}`;
}

function LightboxImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? <div className="lightbox-missing"><ImageOff /><span>No image available</span></div> : <img src={src} alt={alt} onError={() => setFailed(true)} />;
}

export function FrameLightbox({ frames, index, onIndexChange, onClose }: { frames: LightboxFrame[]; index: number; onIndexChange: (index: number) => void; onClose: () => void }) {
  const frame = frames[index];
  const [showSlide, setShowSlide] = useState(false);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      else if (event.key === "ArrowRight" && index < frames.length - 1) onIndexChange(index + 1);
      else if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    window.addEventListener("keydown", onKeyDown, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKeyDown, true); document.body.style.overflow = overflow; };
  }, [index, frames.length, onClose, onIndexChange]);
  if (!frame) return null;
  const slideSrc = frame.slide_image ? `${API_URL}/out/${frame.slide_image.replace(/^\//, "")}` : undefined;
  const slideSrcResolved = frame.slide_image?.startsWith("/recording-frames/") ? frame.slide_image : slideSrc;
  const split = showSlide && !!frame.slide_id;
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Frame ${formatTimestamp(frame.t_sec)}`}>
    <div className="lightbox-bar">
      <span className="font-mono text-lg">{formatTimestamp(frame.t_sec)}</span>
      <span className="min-w-0 break-all font-mono text-sm"><span className="font-sans opacity-80">Matched slide ID </span>{frame.slide_id ?? "No matched slide"}</span>
      <div className="ml-auto flex items-center gap-2">
        {frame.slide_id && <Button variant="secondary" aria-pressed={showSlide} onClick={() => setShowSlide(!showSlide)}>{showSlide ? "Hide slide" : "Show slide"}</Button>}
        {frames.length > 1 && <span className="font-mono text-sm">{index + 1}/{frames.length}</span>}
        <Button variant="secondary" size="icon" aria-label="Previous frame" disabled={index <= 0} onClick={() => onIndexChange(index - 1)}><ChevronLeft /></Button>
        <Button variant="secondary" size="icon" aria-label="Next frame" disabled={index >= frames.length - 1} onClick={() => onIndexChange(index + 1)}><ChevronRight /></Button>
        <Button variant="secondary" size="icon" aria-label="Close" autoFocus onClick={onClose}><X /></Button>
      </div>
    </div>
    <div className={split ? "lightbox-stage lightbox-split" : "lightbox-stage"} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <figure><LightboxImage src={imageUrl(frame.image)} alt={`Key frame at ${formatTimestamp(frame.t_sec)}`} />{split && <figcaption>Frame</figcaption>}</figure>
      {split && <figure>{slideSrcResolved ? <LightboxImage src={slideSrcResolved} alt={`Matched slide ${frame.slide_id}`} /> : <div className="lightbox-missing"><ImageOff /><span>No slide image available</span></div>}<figcaption>Matched slide</figcaption></figure>}
    </div>
  </div>;
}
