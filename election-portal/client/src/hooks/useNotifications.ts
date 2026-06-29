import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AppNotification,
  loadReadNotificationIds,
  saveReadNotificationIds,
} from "@/lib/notifications";

async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await fetch("/api/notifications", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
    },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`${res.status}: Failed to load notifications`);
  }
  const body = await res.json();
  return body.data ?? [];
}

export function useNotifications() {
  const [readIds, setReadIds] = useState<string[]>(() => loadReadNotificationIds());

  const { data, isLoading, isError, refetch, isFetching } = useQuery<AppNotification[]>({
    queryKey: ["/api/notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const notifications = data ?? [];

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !readIds.includes(n.id)),
    [notifications, readIds]
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveReadNotificationIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    saveReadNotificationIds(allIds);
  }, [notifications]);

  const isRead = useCallback((id: string) => readIds.includes(id), [readIds]);

  return {
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    isLoading,
    isError,
    isFetching,
    refetch,
    markAsRead,
    markAllAsRead,
    isRead,
  };
}
