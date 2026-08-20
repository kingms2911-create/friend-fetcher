import { Youtube } from "lucide-react";
import { youtubeSearchUrl } from "@/lib/youtube";

/** Red "Search on YouTube" pill that opens a pre-filled YouTube search. */
export function YouTubeButton({
  query,
  label = "Search on YouTube",
  className = "",
}: {
  query: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={youtubeSearchUrl(query)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: ${query}`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 ${className}`}
    >
      <Youtube className="size-3.5" aria-hidden />
      {label}
    </a>
  );
}
