import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkSelectionBarProps {
  count: number;
  entityLabel: string;
  onClear: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export function BulkSelectionBar({
  count,
  entityLabel,
  onClear,
  onDelete,
  deleting = false,
}: BulkSelectionBarProps) {
  if (count === 0) return null;

  const label = count === 1 ? entityLabel : `${entityLabel}s`;

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-red-900">
        {count} {label} selected
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={deleting}
          className="bg-white"
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
          Clear
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {deleting ? "Deleting…" : "Delete selected"}
        </Button>
      </div>
    </div>
  );
}
