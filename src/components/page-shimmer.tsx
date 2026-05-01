/* eslint-disable react-refresh/only-export-components -- route shells share ShimmerBox + useInitialPageShimmer */
import { useEffect, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Matches dashboard / page staged load duration. */
export const PAGE_SHIMMER_MS = 780;

export function ShimmerBox({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("dashboard-shimmer rounded-md", className)} aria-hidden {...props} />;
}

/** First client mount shows shimmer briefly; skipped when user prefers reduced motion. */
export function useInitialPageShimmer(): boolean {
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(false), PAGE_SHIMMER_MS);
    return () => window.clearTimeout(t);
  }, []);
  return show;
}
