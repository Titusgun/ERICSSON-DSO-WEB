import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AddLibraryButton({ files }: { files: string[] }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button size="lg" className="min-h-14 w-full px-8 text-base sm:w-auto" disabled={!files.length} onClick={() => setOpen(true)}><FilePlus2 />Add files to library</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[calc(100%-32px)] shadow-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add files to library</DialogTitle>
          <DialogDescription>Adding files is unavailable: no library service is connected. Nothing has been added or moved.</DialogDescription>
        </DialogHeader>
        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">{files.map(file => <li key={file} className="break-all">{file}</li>)}</ul>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}