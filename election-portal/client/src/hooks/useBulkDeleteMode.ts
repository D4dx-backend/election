import { useCallback, useState } from "react";
import { useRowSelection } from "./useRowSelection";

/** Row selection that only activates after the user taps "Delete" in the toolbar. */
export function useBulkDeleteMode(pageIds: string[]) {
  const selection = useRowSelection(pageIds);
  const [deleteMode, setDeleteMode] = useState(false);

  const enterDeleteMode = useCallback(() => setDeleteMode(true), []);

  const exitDeleteMode = useCallback(() => {
    setDeleteMode(false);
    selection.clear();
  }, [selection]);

  return {
    ...selection,
    deleteMode,
    enterDeleteMode,
    exitDeleteMode,
    /** Show compact row selectors only while delete mode is on. */
    showSelectors: deleteMode,
  };
}
