import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RowSelectCheckboxProps {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
  "aria-label"?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Compact Gmail-style square checkbox for bulk-delete row selection.
 * Outer button keeps a small tap area; inner box stays visually tiny.
 */
export function RowSelectCheckbox({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
  className,
  onClick,
}: RowSelectCheckboxProps) {
  const isChecked = checked === true;
  const isIndeterminate = checked === "indeterminate";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? "mixed" : isChecked}
      aria-label={ariaLabel}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onCheckedChange?.(!isChecked);
        }
      }}
      className={cn(
        "no-touch-target inline-flex shrink-0 items-center justify-center p-1.5 -m-1.5",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-sm",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-[2px] border transition-colors",
          "border-gray-400/90 bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]",
          (isChecked || isIndeterminate) && "border-primary bg-primary text-white shadow-none"
        )}
      >
        {isChecked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        {isIndeterminate && !isChecked && (
          <Minus className="h-2 w-2" strokeWidth={3} />
        )}
      </span>
    </button>
  );
}

/** Gmail-style checkbox for any multi-select UI (lists, pickers, delete mode). */
export const SelectCheckbox = RowSelectCheckbox;

/** @deprecated Alias */
export const RowSelectRadio = RowSelectCheckbox;
