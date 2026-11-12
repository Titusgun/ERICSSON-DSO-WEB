import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock3, ImageOff } from "lucide-react";
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
  return <section className="mt-7">
    <Button variant="ghost" onClick={onBack} className="mb-5"><ArrowLeft />Back to search</Button>
    {!data ? <div className="empty-state" role="status">Loading recording…</div> : <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="section-heading">{data.source.file_name}</h2><span className="flex items-center gap-2 font-mono text-sm text-muted-foreground"><Clock3 size={16} />{formatTimestamp(data.duration_sec)}</span></div>
      <div className="recording-layout"><section aria-label="Key frames"><h3 className="section-heading mb-4">Key frames</h3><div className="grid gap-4">{[...data.frames].sort((a, b) => a.t_sec - b.t_sec).map(frame => <Button key={frame.id} variant="outline" className="recording-frame" aria-pressed={selected?.id === frame.id} onClick={() => setSelectedId(frame.id)}>
        <RecordingImage image={frame.image} alt={`Key frame at ${formatTimestamp(frame.t_sec)}`} />
        <span className="mt-3 flex items-center justify-between gap-3"><span className="font-mono">{formatTimestamp(frame.t_sec)}</span>{selected?.id === frame.id && <span className="text-primary">Selected</span>}</span>
        <span className="mt-2 block text-sm text-muted-foreground">Matched slide ID</span><span className="block break-all font-mono text-sm">{frame.slide_id || "No matched slide"}</span>
      </Button>)}</div>{data.frames.length === 0 && <p className="text-muted-foreground">No key frames available.</p>}</section>
      <section aria-label="Transcript"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="section-heading">Transcript</h3>{selected && <span className="font-mono text-sm text-muted-foreground">Frame {formatTimestamp(selected.t_sec)} · {segments.length} segments</span>}</div>
        {segments.map(segment => <article key={segment.id} className="transcript-segment"><div className="mb-3 flex flex-wrap items-center gap-3"><a className="play-link font-mono text-sm text-primary" href={`${API_URL}/video/${data.source.file_name}#t=${segment.start_sec}`}>{formatTimestamp(segment.start_sec)}–{formatTimestamp(segment.end_sec)}</a><span className="text-sm text-muted-foreground">{segment.speaker}</span></div><p className="text-lg leading-relaxed">{segment.text}</p></article>)}
        {segments.length === 0 && <p className="text-muted-foreground">No transcript segments for this frame.</p>}
      </section></div>
    </>}
  </section>;
}