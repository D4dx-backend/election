import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { normalizeEntityId } from "@/lib/apiHelpers";

export interface ElectionPickerOption {
  _id?: string;
  id?: string | number;
  title?: string;
  organization?: string;
}

interface ElectionMultiPickerProps {
  elections: ElectionPickerOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyMessage?: string;
}

export function ElectionMultiPicker({
  elections,
  selectedIds,
  onChange,
  emptyMessage = "No elections available for this franchise.",
}: ElectionMultiPickerProps) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  if (elections.length === 0) {
    return <p className="text-sm text-gray-500 py-2">{emptyMessage}</p>;
  }

  return (
    <ScrollArea className="h-48 rounded-md border">
      <div className="divide-y p-1">
        {elections.map((e) => {
          const id = normalizeEntityId(e._id ?? e.id);
          if (!id) return null;
          return (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 hover:bg-gray-50"
            >
              <Checkbox
                checked={selectedIds.includes(id)}
                onCheckedChange={() => toggle(id)}
              />
              <span className="min-w-0 text-sm">
                <span className="font-medium text-gray-900">{e.title || "Untitled"}</span>
                {e.organization ? (
                  <span className="text-gray-500"> — {e.organization}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </ScrollArea>
  );
}
