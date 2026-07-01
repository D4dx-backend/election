import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Root wrapper for page content — fills layout height so footer stays at the bottom on short pages. */
export function PageContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>{children}</div>
  );
}

/** Pushes pagination or other bottom actions toward the site footer on short pages. */
export function PageBottom({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex-1 min-h-[2rem]" aria-hidden />
      {children}
    </>
  );
}
