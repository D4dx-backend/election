import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  /** Current page (1-based) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of records across all pages */
  total: number;
  /** Records per page */
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Reusable server-side pagination footer (Previous / Next + range summary).
 * Renders nothing when there are no records.
 */
export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
}: PaginationControlsProps) {
  if (!total || total <= 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        className,
      )}
    >
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}</span>–
        <span className="font-medium text-gray-700">{to}</span> of{" "}
        <span className="font-medium text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default PaginationControls;
