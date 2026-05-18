import { FormiXMark } from "./FormiXMark";

type Props = {
  className?: string;
  iconSize?: number;
  showTagline?: boolean;
};

export function FormiXWordmark({ className = "", iconSize = 44, showTagline = false }: Props) {
  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <FormiXMark size={iconSize} className="drop-shadow-[0_0_24px_rgba(139,92,246,0.45)]" />
      <div className="text-center">
        <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="bg-gradient-to-r from-violet-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
            Formi
          </span>
          <span className="relative inline-block bg-gradient-to-br from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
            X
            <span
              className="absolute -right-1.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
              aria-hidden
            />
          </span>
        </p>
        {showTagline && (
          <p className="mt-1 text-xs font-medium tracking-wide text-slate-500">
            Private forms · FHE on-chain
          </p>
        )}
      </div>
    </div>
  );
}
