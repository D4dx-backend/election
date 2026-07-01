import { useCallback, useMemo, useState } from "react";

/**
 * Cross-page row selection for bulk delete.
 * Selection persists when paginating or changing search/filters.
 * "Select all" only toggles rows on the current page.
 */
export function useRowSelection(pageIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allOnPage =
        pageIds.length > 0 && pageIds.every((id) => next.has(id));

      if (allOnPage) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }

      return next;
    });
  }, [pageIds]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const removeIds = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = pageIds.some((id) => selectedIds.has(id));

  return {
    selectedIds: selectedList,
    selectedCount: selectedIds.size,
    toggle,
    toggleAll,
    clear,
    removeIds,
    isSelected,
    allSelected,
    someSelected,
  };
}
