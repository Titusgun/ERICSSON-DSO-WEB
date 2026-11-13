import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUp, Check, CheckCheck, ChevronRight, Clock3, Copy, File, FileText, Film, ImageOff, Images, Layers3, LayoutDashboard, ListVideo, Maximize2, Search as SearchIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordingView } from "@/components/recording-view";
import { FrameLightbox } from "@/components/frame-lightbox";
import { OffboardingView } from "@/components/offboarding-view";
import { recordingSha, videoSavings } from "@/lib/workspace";
import { API_URL, getStats, getSavings, getFiles, getDuplicates, getOffboarding, search, subscribeMock, getMockStatus } from "@/lib/api";
import { formatBytes, formatTimestamp, percentSaved, totalStorage } from "@/lib/format";
import type { SearchResult, StorageFile } from "@/mocks/data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Storage overview" },
    { name: "description", content: "Explore storage savings, search recordings, inspect duplicates, and review offboarding files without deleting anything in the dso workspace." },
    { property: "og:title", content: "Storage overview" },
    { property: "og:description", content: "A clear view of your files, storage savings, duplicates, and dry-run offboarding review." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const tabs = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Search", icon: SearchIcon },
  { name: "Duplicates", icon: Copy },
  { name: "Offboarding", icon: ShieldCheck },
  { name: "Files", icon: FileText },
] as const;
const scenarios: Record<string, { name: string }> = {
  video_distill: { name: "Video distillation" },
  dedup: { name: "Deduplication" },
  offboarding: { name: "Offboarding" },
};
const duplicateKinds: Record<string, { title: string; subtitle: string }> = {
  file_exact: { title: "Exact file matches", subtitle: "Identical content, different files" },
  slide_text: { title: "Matching slide text", subtitle: "Repeated content across documents" },
  revision: { title: "File revisions", subtitle: "Related versions of the same document" },
};

function Index() {
  const [tab, setTab] = useState<(typeof tabs)[number]["name"]>("Dashboard");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const mock = useSyncExternalStore(subscribeMock, getMockStatus, () => false);
  const stats = useQuery({ queryKey: ["stats"], queryFn: getStats, enabled: ready, networkMode: "always" });
  const savings = useQuery({ queryKey: ["savings"], queryFn: getSavings, enabled: ready, networkMode: "always" });
  const files = useQuery({ queryKey: ["files"], queryFn: getFiles, enabled: ready, networkMode: "always" });
  const duplicates = useQuery({ queryKey: ["duplicates"], queryFn: getDuplicates, enabled: ready, networkMode: "always" });
  const offboarding = useQuery({ queryKey: ["offboarding"], queryFn: getOffboarding, enabled: ready && tab === "Offboarding", networkMode: "always" });
  const video = videoSavings(savings.data);
  const before = video?.bytes_before ?? 0;
  const after = video?.bytes_after ?? 0;
  const metrics = [
    { label: "Files", value: stats.data?.files, icon: File },
    { label: "Key frames", value: stats.data?.frames, icon: Images },
    { label: "Transcript segments", value: stats.data?.segments, icon: ListVideo },
    { label: "Slides", value: stats.data?.slides, icon: Layers3 },
    { label: "Duplicate pairs", value: stats.data?.duplicates, icon: Copy },
  ];
  return <div className="min-h-screen">
    <header className="app-header">
      <div className="workspace header-inner">
        <div className="flex items-center gap-3"><button type="button" className="brand-logo-button" aria-label="Go to Dashboard" onClick={() => setTab("Dashboard")}><picture><source srcSet="/ericsson-logo-white.png" media="(prefers-color-scheme: dark)" /><img src="/ericsson-logo.png" alt="Ericsson" className="brand-logo" /></picture></button><span className="brand-descriptor">Data Storage Optimization</span></div>
        <div className="flex items-center gap-4">{mock && <span className="mock-badge" role="status"><span className="status-dot" />MOCK DATA</span>}</div>
      </div>
      <nav className="workspace tabs-bar" aria-label="Workspace tabs" role="tablist">{tabs.map(({ name }) => <Button key={name} variant="ghost" className="tab-button" role="tab" id={`tab-${name}`} aria-controls="workspace-panel" aria-selected={tab === name} data-active={tab === name} onClick={() => setTab(name)}>{name}</Button>)}</nav>
    </header>
    <main className="workspace page-body" key={tab} id="workspace-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      <div className="flex items-start justify-between gap-4"><div><h1 className="page-title">{tab === "Dashboard" ? "Storage overview" : tab === "Search" ? "Search" : tab === "Duplicates" ? "Duplicates" : tab === "Offboarding" ? "Offboarding review" : "File inventory"}</h1><p className="page-subtitle">{tab === "Dashboard" ? "Across scanned folders" : tab === "Search" ? "" : tab === "Duplicates" ? "" : tab === "Offboarding" ? "Files of a departing employee, compared with copies kept elsewhere." : ""}</p></div></div>
      {tab === "Dashboard" && <>
        <section className="total-storage" aria-label="Total storage">
          {(() => { const totals = totalStorage(files.data, savings.data); return totals ? <>
            <div className="total-storage-figures">
              <div><div className="text-sm text-muted-foreground">Original size</div><div className="metric-number">{formatBytes(totals.original)}</div></div>
              <div><div className="text-sm text-muted-foreground">Reduced size</div><div className="metric-number">{formatBytes(totals.reduced)}</div></div>
              <div><div className="text-sm text-muted-foreground">Saved</div><div className="metric-number">{totals.savedPct.toFixed(1)}%</div><div className="total-storage-saved-amount">{formatBytes(totals.original - totals.reduced)} saved</div></div>
            </div>
            <div className="total-storage-bar" role="img" aria-label={`Reduced size is ${formatBytes(totals.reduced)} of ${formatBytes(totals.original)} original`}><div className="total-storage-bar-fill" style={{ width: `${Math.min(100, Math.max(0, (totals.reduced / totals.original) * 100))}%` }} /></div>
            {!totals.hasSavings && <p className="total-storage-note">Savings not calculated yet.</p>}
          </> : <div className="total-storage-figures">
            <div><div className="text-sm text-muted-foreground">Original size</div><div className="metric-number">—</div></div>
            <div><div className="text-sm text-muted-foreground">Reduced size</div><div className="metric-number">—</div></div>
            <div><div className="text-sm text-muted-foreground">Saved</div><div className="metric-number">—</div></div>
          </div>; })()}
        </section>
        <div className="metric-grid">{metrics.map(({ label, value }) => <div key={label} className="metric-card"><div className="text-sm text-muted-foreground">{label}</div><div className="metric-number">{value ?? "—"}</div></div>)}</div>
        <section className="video-savings" aria-label="Video storage savings">
          <h2 className="section-heading">Video → text + key frames</h2>
          {video ? <div className="table-wrap"><table className="data-table savings-table"><thead><tr><th>Before</th><th>After</th><th>Storage saved</th><th>Reduction</th></tr></thead><tbody><tr><td>{formatBytes(before)}</td><td>{formatBytes(after)}</td><td>{formatBytes(before - after)}</td><td>{percentSaved(before, after).toFixed(1)}%</td></tr></tbody></table></div> : <p className="mt-4 text-muted-foreground">No savings data yet. Run <code>dso savings</code>.</p>}
        </section>
        <section className="mt-9"><div className="flex items-center justify-between gap-3"><h2 className="section-heading">Savings by scenario</h2><span className="text-sm text-muted-foreground">{savings.data?.length ?? 0} optimization scenarios</span></div><div className="table-wrap"><table className="data-table scenario-table"><thead><tr><th>Scenario</th><th>Before</th><th>After</th><th>Storage saved</th><th className="text-right">Reduction</th></tr></thead><tbody>{savings.data?.map(s => { const config = scenarios[s.scenario]; const percentage = percentSaved(s.bytes_before, s.bytes_after); return <tr key={s.scenario}><td><div className="flex items-center gap-3"><div><div className="font-medium">{config?.name ?? s.scenario}</div></div></div></td><td className="font-mono text-muted-foreground">{formatBytes(s.bytes_before)}</td><td className="font-mono">{formatBytes(s.bytes_after)}</td><td><span className="font-mono">{formatBytes(s.bytes_before - s.bytes_after)}</span></td><td className="text-right"><span className="font-mono">{percentage.toFixed(1)}%</span></td></tr>; })}{!savings.data?.length && <tr><td colSpan={5}>No savings data yet. Run <code>dso savings</code>.</td></tr>}</tbody></table></div></section>
      </>}
      {tab === "Search" && <SearchView />}
      {tab === "Files" && <FilesView files={files.data} />}
      {tab === "Offboarding" && <OffboardingView data={offboarding.data} />}
      {tab === "Duplicates" && <div className="mt-8">{duplicates.data ? [...new Set(duplicates.data.map(d => d.kind))].map(kind => <section key={kind} className="mb-9"><div className="flex items-center gap-3"><h2 className="section-heading">{duplicateKinds[kind]?.title ?? kind}</h2><span className="pill">{duplicates.data.filter(d => d.kind === kind).length}</span></div><p className="mt-1 text-sm text-muted-foreground">{duplicateKinds[kind]?.subtitle}</p>{duplicates.data.filter(d => d.kind === kind).map((d, i) => <div className="duplicate-row" key={i}><div><div className="section-label mb-2 text-muted-foreground">{kind === "revision" ? "Older revision" : kind === "slide_text" ? "References" : "Matching copy"}</div><div className="flex items-center gap-3"><div className="type-icon"><FileText size={18} /></div><span className="break-all font-medium">{d.a}</span></div>{kind === "file_exact" && <span className="pill mt-3">Safe to delete (dry run)</span>}{d.note && <p className="mt-2 text-sm text-muted-foreground">{d.note}</p>}</div><ArrowRight className="duplicate-arrow text-muted-foreground" size={20} /><div><div className="section-label mb-2 text-primary">{kind === "slide_text" ? "Single source" : "Kept copy"}</div><div className="flex items-center gap-3"><div className="type-icon"><CheckCheck size={18} className="text-primary" /></div><span className="break-all font-medium">{d.b}</span><span className="pill ml-auto"><Check size={12} className="mr-1" />{kind === "slide_text" ? "Single source" : "Keep"}</span></div></div></div>)}</section>) : <div className="empty-state">Loading duplicate matches…</div>}{duplicates.data?.length === 0 && <div className="empty-state">No duplicates found.</div>}</div>}
    </main>
  </div>;
}

function SearchView() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<SearchResult>();
  const results = useQuery({ queryKey: ["search", query], queryFn: () => search(query), enabled: !!query, networkMode: "always" });
  function submit(e: FormEvent) { e.preventDefault(); if (input.trim() === query) void results.refetch(); else setQuery(input.trim()); }
  if (opened) return <><h2 className="section-heading mt-7">Recording</h2><RecordingView sha12={recordingSha(opened) ?? ""} initialTime={opened.t_sec ?? 0} onBack={() => setOpened(undefined)} /></>;
  return <><form className="search-form" onSubmit={submit}><div className="search-field"><SearchIcon size={21} className="shrink-0 text-muted-foreground" /><input aria-label="Search videos and documents" placeholder="Search videos, slides, and documents…" value={input} onChange={e => setInput(e.target.value)} /></div><Button type="submit" disabled={!input.trim() || results.isFetching}>Search<ArrowRight /></Button></form>
    {query ? <><div className="my-6 flex items-center justify-between text-sm text-muted-foreground"><span>{results.isFetching ? "Searching…" : `${results.data?.length ?? 0} results for “${query}”`}</span><span className="hidden sm:block">All content types</span></div><div className="grid gap-4">{results.data?.map((result, i) => <ResultCard key={`${result.slide_id}-${i}`} result={result} onOpen={() => setOpened(result)} />)}</div>{results.data?.length === 0 && <div className="empty-state">No matches found.</div>}</> : <div className="empty-state"><p>No search results yet.</p></div>}
  </>;
}
function ResultCard({ result, onOpen }: { result: SearchResult; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(clickTimer.current), []);
  const canEnlarge = !!result.frame_image && !failed;
  const openSoon = () => { clearTimeout(clickTimer.current); clickTimer.current = setTimeout(onOpen, canEnlarge ? 250 : 0); };
  return <article className="result-card"><div className="relative">{enlarged && result.frame_image && <FrameLightbox frames={[{ id: "result", t_sec: result.t_sec ?? 0, image: result.frame_image, slide_id: result.slide_id, slide_image: result.slide_image }]} index={0} onIndexChange={() => {}} onClose={() => setEnlarged(false)} />}<Button asChild variant="ghost" className="h-auto w-full p-0"><div className="frame-preview" onDoubleClick={canEnlarge ? () => { clearTimeout(clickTimer.current); setEnlarged(true); } : undefined} role={result.t_sec !== null ? "button" : undefined} tabIndex={result.t_sec !== null ? 0 : undefined} aria-label={result.t_sec !== null ? `Open recording ${result.file}` : undefined} onClick={result.t_sec !== null ? openSoon : undefined} onKeyDown={e => { if (result.t_sec !== null && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen(); } }}>{result.frame_image && !failed ? <img src={`${API_URL}/out/${result.frame_image}`} alt={`Frame from ${result.file}`} onError={() => setFailed(true)} /> : <div className="flex flex-col items-center gap-2"><ImageOff size={30} strokeWidth={1.3} /><span className="text-sm">No preview available</span></div>}</div></Button>{canEnlarge && <Button variant="secondary" size="sm" className="enlarge-button" onClick={() => setEnlarged(true)}><Maximize2 />Enlarge</Button>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-medium">{result.t_sec !== null ? <Button variant="link" className="h-auto p-0 text-lg" onClick={onOpen}>{result.file}<ChevronRight /></Button> : result.file}</h2><span className="pill">{result.kind === "segment" ? "Video segment" : "Slide"}</span>{result.t_sec !== null && <a className="play-link ml-auto flex items-center gap-1.5 font-mono text-sm text-primary" href={`${API_URL}/video/${result.file}#t=${result.t_sec}`}><Clock3 size={14} />Play at {formatTimestamp(result.t_sec)}</a>}</div><p className="result-snippet">{result.snippet.split(/(\[[^\]]+\])/g).map((part, i) => part.startsWith("[") && part.endsWith("]") ? <mark key={i}>{part.slice(1, -1)}</mark> : part)}</p><div className="mt-4 break-all font-mono text-sm text-muted-foreground"><span className="font-sans">Slide ID</span><span className="mx-2">/</span>{result.slide_id ?? "No matched slide"}</div></div></article>;
}
function FilesView({ files }: { files: StorageFile[] | undefined }) {
  const [sort, setSort] = useState<keyof StorageFile>("name");
  const [ascending, setAscending] = useState(true);
  const sorted = [...(files ?? [])].sort((a, b) => { const av = a[sort], bv = b[sort]; return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * (ascending ? 1 : -1); });
  const columns: { key: keyof StorageFile; label: string }[] = [{ key: "name", label: "File name" }, { key: "kind", label: "Type" }, { key: "size_bytes", label: "Size" }, { key: "source", label: "Source" }, { key: "owner", label: "Owner" }, { key: "sha256", label: "SHA-256" }];
  return <section className="mt-8"><div className="flex items-center justify-between"><h2 className="section-heading">All files</h2><span className="text-sm text-muted-foreground">{files?.length ?? 0} files</span></div><div className="table-wrap"><table className="data-table files-table"><thead><tr>{columns.map(col => <th key={col.key} aria-sort={sort === col.key ? ascending ? "ascending" : "descending" : "none"}><Button variant="ghost" className="sort-button" onClick={() => { if (sort === col.key) setAscending(!ascending); else { setSort(col.key); setAscending(true); } }}>{col.label}{sort === col.key ? ascending ? <ArrowUp size={13} /> : <ArrowDown size={13} /> : <ArrowDownUp size={13} />}</Button></th>)}</tr></thead><tbody>{sorted.map(f => <tr key={f.name}><td><div className="flex items-center gap-3"><div className="type-icon">{f.kind === "video" ? <Film size={18} /> : <FileText size={18} />}</div><span className="font-medium">{f.name}</span></div></td><td><span className="pill capitalize">{f.kind}</span></td><td className="font-mono">{formatBytes(f.size_bytes)}</td><td className="text-muted-foreground">{{ sharepoint: "SharePoint", play: "Ericsson Play", offboarding: "Offboarding" }[f.source] ?? f.source}</td><td>{f.owner ?? "—"}</td><td className="font-mono text-sm text-muted-foreground" title={f.sha256}>{f.sha256.slice(0, 12)}</td></tr>)}{!files && <tr><td colSpan={6}>Loading files…</td></tr>}{files?.length === 0 && <tr><td colSpan={6}>No files found.</td></tr>}</tbody></table></div></section>;
}
