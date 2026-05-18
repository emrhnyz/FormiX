import { FormiXMark } from "./FormiXMark";

type Props = {
  className?: string;
  iconSize?: number;
};

/** Horizontal logo for header: icon + FormiX text */
export function FormiXLogoInline({ className = "", iconSize = 36 }: Props) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <FormiXMark size={iconSize} className="shrink-0 drop-shadow-[0_0_16px_rgba(139,92,246,0.35)]" />
      <span className="font-display text-xl font-bold tracking-tight">
        <span className="text-white">Formi</span>
        <span className="relative bg-gradient-to-br from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
          X
          <span
            className="absolute -right-1 top-0 h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
            aria-hidden
          />
        </span>
      </span>
    </div>
  );
}

