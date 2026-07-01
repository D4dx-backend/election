import { useSyncExternalStore } from "react";

/** URL helpers for /voters page (groups tab + selected group). */

export type VoterPageParams = {
  tab: "voters" | "groups";
  groupId: string | null;
  view: "voters" | "elections" | null;
};

const listeners = new Set<() => void>();

export function notifyVoterPageParamsChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onPopState = () => listener();
  window.addEventListener("popstate", onPopState);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", onPopState);
  };
}

function getSearchSnapshot() {
  return window.location.search;
}

export function parseVoterPageSearch(search: string): VoterPageParams {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const view = params.get("view");
  return {
    tab: params.get("tab") === "voters" ? "voters" : "groups",
    groupId: params.get("group"),
    view: view === "voters" || view === "elections" ? view : null,
  };
}

export function getVoterPageParams(): VoterPageParams {
  return parseVoterPageSearch(window.location.search);
}

export function buildAllVotersUrl() {
  return "/voters?tab=voters";
}

export function buildVoterGroupsListUrl() {
  return "/voters";
}

export function buildVoterGroupUrl(
  groupId: string,
  view?: "voters" | "elections"
) {
  const params = new URLSearchParams({ tab: "groups", group: groupId });
  if (view) params.set("view", view);
  return `/voters?${params.toString()}`;
}

/** Subscribe to query-string changes (tab, group, view) on /voters. */
export function useVoterPageParams(): VoterPageParams {
  const search = useSyncExternalStore(subscribe, getSearchSnapshot, () => "");
  return parseVoterPageSearch(search);
}

/** Call after wouter navigate() so sidebar picks up query changes. */
export function navigateVotersPage(href: string, navigate: (to: string) => void) {
  navigate(href);
  queueMicrotask(() => notifyVoterPageParamsChange());
}
