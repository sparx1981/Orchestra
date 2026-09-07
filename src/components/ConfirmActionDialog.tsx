// Shared confirmation-dialog primitive. The Force/Promote, Move, Revise-request, and
// Revision-preview dialogs were four independent hand-rolled copies of the same shape —
// icon+title header, optional description, body content, and a Cancel/Confirm button pair.
// One parameterised component means one place for the pattern to change and no chance of
// the four quietly drifting apart in spacing, layout, or keyboard behaviour.
//
// Deliberately layout-preserving: the body wrapper (default `space-y-4`) and the
// `flex gap-2` button row match the previous hand-rolled markup exactly, so a visual diff
// of any single dialog before/after shows no change.

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export interface ConfirmActionDialogProps {
  open: boolean;
  /** Called for both explicit Cancel and dismissal (overlay click / Escape). */
  onClose: () => void;
  /** Icon rendered inline before the title, e.g. <Target className="w-4 h-4 text-blue-500" />. */
  icon: ReactNode;
  title: ReactNode;
  /** Optional DialogDescription rendered inside the header, under the title. */
  headerDescription?: ReactNode;
  /** Extra classes on DialogContent, e.g. "max-w-sm" or "max-w-lg". */
  contentClassName?: string;
  /** Classes on the body wrapper. Defaults to the shared "space-y-4". */
  bodyClassName?: string;
  /** Body content rendered above the button row. */
  children?: ReactNode;
  /** When true, the button row is a sibling of the body (used by scrollable-body dialogs). */
  buttonsOutsideBody?: boolean;
  cancelLabel?: string;
  /** Confirm button content — include any inline icon here, matching the previous markup. */
  confirmLabel: ReactNode;
  confirmDisabled?: boolean;
  /** Confirm button styling beyond the shared "flex-1", e.g. "bg-blue-600 hover:bg-blue-700 text-white gap-1.5". */
  confirmClassName: string;
  onConfirm: () => void;
}

export function ConfirmActionDialog({
  open,
  onClose,
  icon,
  title,
  headerDescription,
  contentClassName = "max-w-sm",
  bodyClassName = "space-y-4",
  children,
  buttonsOutsideBody = false,
  cancelLabel = "Cancel",
  confirmLabel,
  confirmDisabled,
  confirmClassName,
  onConfirm
}: ConfirmActionDialogProps) {
  const buttonRow = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onClose} className="flex-1">
        {cancelLabel}
      </Button>
      <Button disabled={confirmDisabled} onClick={onConfirm} className={`flex-1 ${confirmClassName}`}>
        {confirmLabel}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {icon}{title}
          </DialogTitle>
          {headerDescription != null && (
            <DialogDescription className="text-xs">{headerDescription}</DialogDescription>
          )}
        </DialogHeader>
        {buttonsOutsideBody ? (
          <>
            <div className={bodyClassName}>{children}</div>
            {buttonRow}
          </>
        ) : (
          <div className={bodyClassName}>
            {children}
            {buttonRow}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
