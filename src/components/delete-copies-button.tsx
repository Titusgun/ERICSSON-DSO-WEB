import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeleteCopiesButton({ copies, mock, label = "Delete all copies" }: { copies: string[]; mock: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="lg" className="min-h-14 w-full border-destructive px-8 text-base text-destructive sm:w-auto" disabled={!copies.length} onClick={() => setOpen(true)}>
        <Trash2 /> {label} ({copies.length})
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-32px)] shadow-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete all tagged copies</DialogTitle>
            <DialogDescription>
              Deletion is unavailable: no delete service is connected. Nothing has been deleted.
              {mock ? " These are mock files, not real files." : " Kept copies, slide matches, and older revisions are excluded."}
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {copies.map(name => <li key={name} className="break-all">{name}</li>)}
          </ul>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}