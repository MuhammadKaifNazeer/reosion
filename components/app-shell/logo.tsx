import { cn } from "@/lib/utils";

/**
 * The Reosion mark: a playhead over a frame. Deliberately monochrome + brand
 * accent; the geometry echoes a timeline scrubber.
 */
export function Logo({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {/* frame */}
      <rect
        x="3"
        y="3"
        width="15"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.6"
      />
      {/* playhead */}
      <path
        d="M21 5.5v13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9 7.2c0-.7.76-1.14 1.36-.79l5 2.95a.92.92 0 0 1 0 1.58l-5 2.95c-.6.35-1.36-.09-1.36-.79V7.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-sm font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      Reosion
    </span>
  );
}
