import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUp, Check, CheckCheck, ChevronRight, Clock3, Copy, Database, File, FileText, Film, HardDrive, ImageOff, Images, Layers3, LayoutDashboard, ListVideo, Search as SearchIcon, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordingView } from "@/components/recording-view";
import { videoSavings } from "@/lib/workspace";
import { API_URL, getStats, getSavings, getFiles, getDuplicates, search, subscribeMock, getMockStatus } from "@/lib/api";
import { formatBytes, formatTimestamp, percentSaved } from "@/lib/format";
import type { SearchResult, StorageFile } from "@/mocks/data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "dso — Data Storage Optimization" },
    { name: "description", content: "Explore storage savings, search video segments and slides, and inspect duplicate files in the dso workspace." },
    { property: "og:title", content: "dso — Data Storage Optimization" },
    { property: "og:description", content: "A clear view of your files, storage savings, and duplicates." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const tabs = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Search", icon: SearchIcon },
  { name: "Duplicates", icon: Copy },
  { name: "Files", icon: FileText },
] as const;
const scenarios: Record<string, { name: string; subtitle: string; icon: typeof Film }> = {
  video_distill: { name: "Video distillation", subtitle: "Full videos → searchable moments", icon: Film },
  dedup: { name: "Deduplication", subtitle: "One copy. No repetition.", icon: Copy },
  offboarding: { name: "Offboarding", subtitle: "Keep what matters", icon: ShieldCheck },
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
  const video = videoSavings(savings.data);
  const before = video?.bytes_before ?? 0;
  const after = video?.bytes_after ?? 0;
  const metrics = [
    { label: "Files", value: stats.data?.files, icon: File },
    { label: "Frames", value: stats.data?.frames, icon: Images },
    { label: "Segments", value: stats.data?.segments, icon: ListVideo },
    { label: "Slides", value: stats.data?.slides, icon: Layers3 },
    { label: "Duplicates", value: stats.data?.duplicates, icon: Copy },
  ];
  return <div className="min-h-screen">
    <header className="app-header">
      <div className="workspace header-inner">
        <div className="flex items-center gap-3"><div className="brand-mark"><Database size={25} strokeWidth={1.8} /></div><span className="brand-name">dso<span className="text-primary">.</span></span><span className="brand-descriptor ml-4 border-l pl-5 text-sm text-muted-foreground">Data Storage Optimization</span></div>
        <div className="flex items-center gap-4">{mock && <span className="mock-badge" role="status"><span className="status-dot" />MOCK DATA</span>}<span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><span className="status-dot text-success" />Workspace</span></div>
      </div>
      <nav className="workspace tabs-bar" aria-label="Workspace tabs" role="tablist">{tabs.map(({ name, icon: Icon }) => <Button key={name} variant="ghost" className="tab-button" role="tab" id={`tab-${name}`} aria-controls="workspace-panel" aria-selected={tab === name} data-active={tab === name} onClick={() => setTab(name)}><Icon />{name}</Button>)}</nav>
    </header>
    <main className="workspace page-body" key={tab} id="workspace-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      <div className="flex items-start justify-between gap-4"><div><div className="section-label mb-2 text-primary">Your workspace, distilled</div><h1 className="page-title">{tab === "Dashboard" ? "Storage overview" : tab === "Search" ? "Find the moments that matter" : tab === "Duplicates" ? "Less repetition. More clarity." : "File inventory"}</h1><p className="page-subtitle">{tab === "Dashboard" ? "A smaller footprint. The same knowledge." : tab === "Search" ? "Explore the knowledge inside your videos and documents." : tab === "Duplicates" ? "Review matching content and the copies worth keeping." : "Every source file, in one place."}</p></div><div className="hidden items-center gap-2 pt-8 text-sm text-muted-foreground md:flex"><HardDrive size={15} />Storage intelligence</div></div>
      {tab === "Dashboard" && <>
        <div className="metric-grid">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="metric-card"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon size={18} strokeWidth={1.6} /></div><div className="metric-number">{value ?? "—"}</div><div className="mt-2 text-sm text-muted-foreground">{label === "Duplicates" ? "Matching items detected" : label === "Files" ? "Across scanned folders" : label === "Frames" ? "Key moments captured" : label === "Segments" ? "Searchable video moments" : "Extracted from documents"}</div></div>)}</div>
        <section className="summary-band" aria-label="Video storage savings">
          <div><div className="section-label flex items-center gap-2"><Sparkles size={14} />Video → text + key frames</div><div className="summary-value">{video ? `${percentSaved(before, after).toFixed(1)}%` : "—"}</div><div className="mt-1 text-lg text-summary-muted">less storage</div><p className="mt-3 text-sm text-summary-muted"><span className="font-medium text-summary-foreground">{video ? formatBytes(before - after) : "—"} reclaimed</span> · Video distillation</p></div>
          <div className="summary-chart"><div><div className="mb-2 flex justify-between text-sm text-summary-muted"><span>Before optimization</span><span className="font-mono">{formatBytes(before)}</span></div><div className="storage-bar"><span style={{ width: "100%" }} /></div></div><div><div className="mb-2 flex justify-between text-sm text-summary-muted"><span className="text-summary-foreground">After optimization</span><span className="font-mono text-summary-foreground">{formatBytes(after)}</span></div><div className="storage-bar after-bar"><span style={{ width: `${before ? after / before * 100 : 0}%` }} /></div></div></div>
        </section>
        <section className="mt-9"><div className="flex items-center justify-between gap-3"><h2 className="section-heading">Savings by scenario</h2><span className="text-sm text-muted-foreground">{savings.data?.length ?? 0} optimization scenarios</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Scenario</th><th>Before</th><th>After</th><th>Storage saved</th><th className="text-right">Reduction</th></tr></thead><tbody>{savings.data?.map(s => { const config = scenarios[s.scenario]; const Icon = config?.icon ?? HardDrive; const percentage = percentSaved(s.bytes_before, s.bytes_after); return <tr key={s.scenario}><td><div className="flex items-center gap-3"><div className="type-icon"><Icon size={18} /></div><div><div className="font-medium">{config?.name ?? s.scenario}</div><div className="mt-1 text-sm text-muted-foreground">{config?.subtitle}</div></div></div></td><td className="font-mono text-muted-foreground">{formatBytes(s.bytes_before)}</td><td className="font-mono">{formatBytes(s.bytes_after)}</td><td><span className="font-mono font-medium text-primary">{formatBytes(s.bytes_before - s.bytes_after)}</span><div className="storage-bar savings-progress"><span style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} /></div></td><td className="text-right"><span className="pill"><ArrowDown size={12} className="mr-1" />{percentage.toFixed(1)}%</span></td></tr>; })}{!savings.data && <tr><td colSpan={5}>Loading storage data…</td></tr>}</tbody></table></div></section>
      </>}
      {tab === "Search" && <SearchView />}
      {tab === "Files" && <FilesView files={files.data} />}
      {tab === "Duplicates" && <div className="mt-8">{duplicates.data ? [...new Set(duplicates.data.map(d => d.kind))].map(kind => <section key={kind} className="mb-9"><div className="flex items-center gap-3"><h2 className="section-heading">{duplicateKinds[kind]?.title ?? kind}</h2><span className="pill">{duplicates.data.filter(d => d.kind === kind).length}</span></div><p className="mt-1 text-sm text-muted-foreground">{duplicateKinds[kind]?.subtitle}</p>{duplicates.data.filter(d => d.kind === kind).map((d, i) => <div className="duplicate-row" key={i}><div><div className="section-label mb-2 text-muted-foreground">{kind === "revision" ? "Older revision" : kind === "slide_text" ? "References" : "Matching copy"}</div><div className="flex items-center gap-3"><div className="type-icon"><FileText size={18} /></div><span className="break-all font-medium">{d.a}</span></div>{kind === "file_exact" && <span className="pill mt-3">Safe to delete (dry run)</span>}{d.note && <p className="mt-2 text-sm text-muted-foreground">{d.note}</p>}</div><ArrowRight className="duplicate-arrow text-muted-foreground" size={20} /><div><div className="section-label mb-2 text-primary">{kind === "slide_text" ? "Single source" : "Kept copy"}</div><div className="flex items-center gap-3"><div className="type-icon"><CheckCheck size={18} className="text-primary" /></div><span className="break-all font-medium">{d.b}</span><span className="pill ml-auto"><Check size={12} className="mr-1" />{kind === "slide_text" ? "Single source" : "Keep"}</span></div></div></div>)}</section>) : <div className="empty-state">Loading duplicate matches…</div>}{duplicates.data?.length === 0 && <div className="empty-state"><CheckCheck className="mx-auto mb-4" />No duplicates found.</div>}</div>}
      <footer className="workspace-footer"><span className="flex items-center gap-2"><ShieldCheck size={14} />Original files remain unchanged</span><span className="flex items-center gap-2">dso<span className="text-border">/</span>Less storage. More knowledge.</span></footer>
    </main>
  </div>;
}

function SearchView() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<SearchResult>();
  const results = useQuery({ queryKey: ["search", query], queryFn: () => search(query), enabled: !!query, networkMode: "always" });
  function submit(e: FormEvent) { e.preventDefault(); if (input.trim() === query) void results.refetch(); else setQuery(input.trim()); }
  if (opened) return <><h2 className="section-heading mt-7">Recording</h2><RecordingView sha12={opened.slide_id.split(":")[0] ?? ""} initialTime={opened.t_sec ?? 0} onBack={() => setOpened(undefined)} /></>;
  return <><form className="search-form" onSubmit={submit}><div className="search-field"><SearchIcon size={21} className="shrink-0 text-muted-foreground" /><input aria-label="Search videos and documents" placeholder="Search videos, slides, and documents…" value={input} onChange={e => setInput(e.target.value)} /></div><Button type="submit" disabled={!input.trim() || results.isFetching}>Search<ArrowRight /></Button></form>
    {query ? <><div className="my-6 flex items-center justify-between text-sm text-muted-foreground"><span>{results.isFetching ? "Searching…" : `${results.data?.length ?? 0} results for “${query}”`}</span><span className="hidden items-center gap-1 sm:flex"><Layers3 size={14} />All content types</span></div><div className="grid gap-4">{results.data?.map((result, i) => <ResultCard key={`${result.slide_id}-${i}`} result={result} onOpen={() => setOpened(result)} />)}</div>{results.data?.length === 0 && <div className="empty-state"><SearchIcon className="mx-auto mb-4" size={32} /><h2 className="text-lg font-medium text-foreground">No matches found</h2><p className="mt-2">Try another word or file name.</p></div>}</> : <div className="empty-state"><SearchIcon className="mx-auto mb-5 text-primary" size={36} strokeWidth={1.4} /><h2 className="text-xl font-medium text-foreground">What are you looking for?</h2><p className="mt-2">Search your workspace</p><Button variant="outline" className="mt-6" onClick={() => { setInput("latency"); setQuery("latency"); }}>latency<ChevronRight /></Button></div>}
  </>;
}
function ResultCard({ result, onOpen }: { result: SearchResult; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  return <article className="result-card"><Button asChild variant="ghost" className="h-auto p-0"><div className="frame-preview" role={result.t_sec !== null ? "button" : undefined} tabIndex={result.t_sec !== null ? 0 : undefined} aria-label={result.t_sec !== null ? `Open recording ${result.file}` : undefined} onClick={result.t_sec !== null ? onOpen : undefined} onKeyDown={e => { if (result.t_sec !== null && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen(); } }}>{result.frame_image && !failed ? <img src={`${API_URL}/out/${result.frame_image}`} alt={`Frame from ${result.file}`} onError={() => setFailed(true)} /> : <div className="flex flex-col items-center gap-2"><ImageOff size={30} strokeWidth={1.3} /><span className="text-sm">No preview available</span></div>}</div></Button><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-medium">{result.t_sec !== null ? <Button variant="link" className="h-auto p-0 text-lg" onClick={onOpen}>{result.file}<ChevronRight /></Button> : result.file}</h2><span className="pill">{result.kind === "segment" ? "Video segment" : "Slide"}</span>{result.t_sec !== null && <a className="play-link ml-auto flex items-center gap-1.5 font-mono text-sm text-primary" href={`${API_URL}/video/${result.file}#t=${result.t_sec}`}><Clock3 size={14} />Play at {formatTimestamp(result.t_sec)}</a>}</div><p className="result-snippet">{result.snippet.split(/(\[[^\]]+\])/g).map((part, i) => part.startsWith("[") && part.endsWith("]") ? <mark key={i}>{part.slice(1, -1)}</mark> : part)}</p><div className="mt-4 break-all font-mono text-sm text-muted-foreground"><span className="font-sans">Slide ID</span><span className="mx-2">/</span>{result.slide_id}</div></div></article>;
}
function FilesView({ files }: { files: StorageFile[] | undefined }) {
  const [sort, setSort] = useState<keyof StorageFile>("name");
  const [ascending, setAscending] = useState(true);
  const sorted = [...(files ?? [])].sort((a, b) => { const av = a[sort], bv = b[sort]; return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * (ascending ? 1 : -1); });
  const columns: { key: keyof StorageFile; label: string }[] = [{ key: "name", label: "File name" }, { key: "kind", label: "Type" }, { key: "size_bytes", label: "Size" }, { key: "source", label: "Source" }, { key: "owner", label: "Owner" }, { key: "sha256", label: "SHA-256" }];
  return <section className="mt-8"><div className="flex items-center justify-between"><h2 className="section-heading">All files</h2><span className="text-sm text-muted-foreground">{files?.length ?? 0} files</span></div><div className="table-wrap"><table className="data-table"><thead><tr>{columns.map(col => <th key={col.key} aria-sort={sort === col.key ? ascending ? "ascending" : "descending" : "none"}><Button variant="ghost" className="sort-button" onClick={() => { if (sort === col.key) setAscending(!ascending); else { setSort(col.key); setAscending(true); } }}>{col.label}{sort === col.key ? ascending ? <ArrowUp size={13} /> : <ArrowDown size={13} /> : <ArrowDownUp size={13} />}</Button></th>)}</tr></thead><tbody>{sorted.map(f => <tr key={f.name}><td><div className="flex items-center gap-3"><div className="type-icon">{f.kind === "video" ? <Film size={18} /> : <FileText size={18} />}</div><span className="font-medium">{f.name}</span></div></td><td><span className="pill capitalize">{f.kind}</span></td><td className="font-mono">{formatBytes(f.size_bytes)}</td><td className="text-muted-foreground">{{ sharepoint: "SharePoint", play: "Ericsson Play", offboarding: "Offboarding" }[f.source] ?? f.source}</td><td>{f.owner ?? "—"}</td><td className="font-mono text-sm text-muted-foreground">{f.sha256}</td></tr>)}{!files && <tr><td colSpan={6}>Loading files…</td></tr>}{files?.length === 0 && <tr><td colSpan={6}>No files found.</td></tr>}</tbody></table></div></section>;
}
