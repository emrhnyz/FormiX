import Link from "next/link";
import { FormiXLogoInline } from "./FormiXLogoInline";
import { FormiXMark } from "./FormiXMark";
import { FormiXWordmark } from "./FormiXWordmark";

type Variant = "icon" | "inline" | "stacked";

type Props = {
  variant?: Variant;
  /** Set to false to disable link wrapper */
  href?: string | false;
  className?: string;
  iconSize?: number;
};

export function BrandLogo({
  variant = "inline",
  href = "/",
  className = "",
  iconSize,
}: Props) {
  const content =
    variant === "icon" ? (
      <FormiXMark size={iconSize ?? 40} className={className} />
    ) : variant === "stacked" ? (
      <FormiXWordmark className={className} iconSize={iconSize ?? 72} showTagline />
    ) : (
      <FormiXLogoInline className={className} iconSize={iconSize ?? 36} />
    );

  if (href === false) return content;

  return (
    <Link
      href={href}
      className="inline-flex transition duration-300 hover:opacity-90 hover:drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]"
    >
      {content}
    </Link>
  );
}
