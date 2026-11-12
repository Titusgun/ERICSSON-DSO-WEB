import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUp, ArrowDown, Clock3, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL, getRecording } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { frameAtTime, frameSegments } from "@/lib/workspace";

export function RecordingImage({ image, alt }: { image: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = image.startsWith("/recording-frames/") || /^https?:\/\//.test(image) ? image : `${API_URL}/out/${image.replace(/^\//, "")}`;
  return <div className="frame-preview">{failed ? <div className="flex flex-col items-center gap-2"><ImageOff /><span className="text-sm">No preview available</span></div> : <img src={src} alt={alt} onError={() => setFailed(true)} />}</div>;
}

export function RecordingView({ sha12, initialTime, onBack }: { sha12: string; initialTime: number; onBack: () => void }) {
  const recording = useQuery({ queryKey: ["recording", sha12], queryFn: () => getRecording(sha12), networkMode: "always" });
  const [selectedId, setSelectedId] = useState<string>();
  const data = recording.data;
  const selected = data?.frames.find(f => f.id === selectedId) ?? (data ? frameAtTime(data, initialTime) : undefined);
  const segments = data && selected ? frameSegments(data, selected.id) : [];
  const frames = [...(data?.frames ?? [])].sort((a, b) => a.t_sec - b.t_sec);
  const selectedIndex = frames.findIndex(frame => frame.id === selected?.id);
  const listRef = useRef<HTMLDivElement>(null);
  function moveFrame(direction: number) {
    const frame = frames[selectedIndex + direction];
    if (frame) setSelectedId(frame.id);
  }
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"], [role="tablist"]')) return;
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      if (!data?.frames.length) return;
      event.preventDefault();
      const ordered = [...data.frames].sort((a, b) => a.t_sec - b.t_sec);
      const index = ordered.findIndex(frame => frame.id === selected?.id);
      const next = ordered[index + (event.key === "ArrowUp" ? -1 : 1)];
      if (next) setSelectedId(next.id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [data, selected?.id]);
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!list || !active) return;
    const listBounds = list.getBoundingClientRect();
    const activeBounds = active.getBoundingClientRect();
    if (activeBounds.top < listBounds.top) list.scrollTop -= listBounds.top - activeBounds.top;
    else if (activeBounds.bottom > listBounds.bottom) list.scrollTop += activeBounds.bottom - listBounds.bottom;
  }, [selected?.id]);
  return <section className="mt-7">
    <Button variant="ghost" onClick={onBack} className="mb-5"><ArrowLeft />Back to search</Button>
    {!data ? <div className="empty-state" role="status">Loading recording…</div> : <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="section-heading">{data.source.file_name}</h2><span className="flex items-center gap-2 font-mono text-sm text-muted-foreground"><Clock3 size={16} />{formatTimestamp(data.duration_sec)}</span></div>
      <div className="recording-layout"><section aria-label="Key frames" className="recording-frames-column"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="section-heading">Key frames</h3><div className="flex items-center gap-2"><span className="font-mono text-sm text-muted-foreground">{selectedIndex >= 0 ? selectedIndex + 1 : 0}/{frames.length}</span><Button variant="outline" size="icon" aria-label="Previous frame" title="Previous frame" disabled={selectedIndex <= 0} onClick={() => moveFrame(-1)}><ArrowUp /></Button><Button variant="outline" size="icon" aria-label="Next frame" title="Next frame" disabled={selectedIndex < 0 || selectedIndex >= frames.length - 1} onClick={() => moveFrame(1)}><ArrowDown /></Button></div></div><div className="recording-frame-list" ref={listRef}>{frames.map(frame => <Button key={frame.id} variant="outline" className="recording-frame" aria-pressed={selected?.id === frame.id} aria-label={`Frame ${formatTimestamp(frame.t_sec)}`} onClick={() => setSelectedId(frame.id)}>
        <RecordingImage image={frame.image} alt={`Key frame at ${formatTimestamp(frame.t_sec)}`} />
        <span className="min-w-0"><span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-mono">{formatTimestamp(frame.t_sec)}</span>{selected?.id === frame.id && <span className="text-sm text-primary">Selected</span>}</span>
        <span className="mt-2 block text-sm text-muted-foreground">Matched slide ID</span><span className="block break-all font-mono text-sm">{frame.slide_id || "No matched slide"}</span></span>
      </Button>)}</div>{data.frames.length === 0 && <p className="text-muted-foreground">No key frames available.</p>}</section>
      <section aria-label="Transcript" className="recording-transcript" tabIndex={0}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="section-heading">Transcript</h3>{selected && <span className="font-mono text-sm text-muted-foreground">Frame {formatTimestamp(selected.t_sec)} · {segments.length} segments</span>}</div>
        {segments.map(segment => <article key={segment.id} className="transcript-segment"><div className="mb-3 flex flex-wrap items-center gap-3"><a className="play-link font-mono text-sm text-primary" href={`${API_URL}/video/${data.source.file_name}#t=${segment.start_sec}`}>{formatTimestamp(segment.start_sec)}–{formatTimestamp(segment.end_sec)}</a><span className="text-sm text-muted-foreground">{segment.speaker}</span></div><p className="text-lg leading-relaxed">{segment.text}</p></article>)}
        {segments.length === 0 && <p className="text-muted-foreground">No transcript segments for this frame.</p>}
      </section></div>
    </>}
  </section>;
}