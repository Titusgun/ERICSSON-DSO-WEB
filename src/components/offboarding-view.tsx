import { FileText, Files, HardDrive, Percent, ShieldCheck } from "lucide-react";
import { formatBytes } from "@/lib/format";
import type { Offboarding } from "@/mocks/data";
import { AddLibraryButton } from "@/components/add-library-button";
import { DeleteCopiesButton } from "@/components/delete-copies-button";

export function OffboardingView({ data }: { data: Offboarding | undefined }) {
  const metrics = [
    { label: "Files reviewed", value: data?.total_files, icon: Files },
    { label: "Safe to delete", value: data?.safe_files, icon: ShieldCheck },
    { label: "Could be freed", value: data ? formatBytes(data.freeable_bytes) : undefined, icon: HardDrive },
    { label: "Percent freed", value: data ? `${data.percent_freed.toFixed(1)}%` : undefined, icon: Percent },
  ];
  return <section className="mt-8" aria-label="Offboarding dry-run review">
    <div className="dry-run-banner"><ShieldCheck size={22} className="shrink-0 text-primary" /><p><strong>Dry run. Nothing is deleted.</strong> A file is marked safe to delete only when a byte-identical copy is kept elsewhere.</p></div>
    {data?.simulated && <span className="mock-badge mt-5">Simulated scenario</span>}
    <div className="mt-6 flex flex-wrap gap-3">
      <AddLibraryButton files={data?.files.map(file => file.path) ?? []} />
      <DeleteCopiesButton copies={data?.files.filter(file => file.verdict === "safe to delete" && file.copy_at !== null).map(file => file.path) ?? []} mock={data?.simulated ?? false} label="Delete duplicates" />
    </div>
    <div className="metric-grid offboarding-metrics">{metrics.map(({ label, value }) => <div className="metric-card" key={label}><div className="flex items-center justify-between gap-2 text-sm text-muted-foreground"><span>{label}</span></div><div className="metric-number">{value ?? "—"}</div></div>)}</div>
    {!data ? <div className="empty-state" role="status">Loading offboarding review…</div> : data.total_files === 0 ? <div className="empty-state">No leaver folder has been analysed yet.</div> : <div className="table-wrap"><table className="data-table offboarding-table"><thead><tr><th>File name</th><th>Owner</th><th>Size</th><th>Verdict</th><th>Copy kept at</th></tr></thead><tbody>{data.files.map(file => <tr key={file.path}><td><div className="flex items-center gap-3"><FileText size={18} className="shrink-0 text-muted-foreground" /><span className="font-medium">{file.name}</span></div></td><td>{file.owner}</td><td className="font-mono">{formatBytes(file.size_bytes)}</td><td><span className={file.verdict === "safe to delete" ? "pill" : "pill neutral-pill"}>{file.verdict === "safe to delete" ? "Safe to delete" : "Keep"}</span></td><td className="font-mono text-sm text-muted-foreground">{file.copy_at ?? "Unique: kept"}</td></tr>)}</tbody></table></div>}
  </section>;
}