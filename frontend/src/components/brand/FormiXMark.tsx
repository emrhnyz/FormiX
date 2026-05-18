/** FormiX icon: document + lock + stylized X (vector, brand gradients) */
type Props = {
  className?: string;
  size?: number;
};

export function FormiXMark({ className = "", size = 48 }: Props) {
  const id = "formix";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-paper`} x1="16" y1="20" x2="56" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="14" y1="14" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c4b5fd" />
          <stop offset="0.5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#f0abfc" />
        </linearGradient>
        <linearGradient id={`${id}-x`} x1="26" y1="26" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="0.4" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id={`${id}-lock`} x1="32" y1="12" x2="50" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Document body */}
      <path
        d="M17 24h27.5L50 29.5V58H17V24z"
        fill={`url(#${id}-paper)`}
        stroke={`url(#${id}-edge)`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M44.5 24V29.5H50"
        fill="#0f172a"
        stroke={`url(#${id}-edge)`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M23 37h24M23 43h18M23 49h20"
        stroke="#818cf8"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Padlock */}
      <path
        d="M33 18.5a7 7 0 0 1 14 0"
        stroke={`url(#${id}-lock)`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="37" y="18.5" width="10" height="7" rx="2" fill={`url(#${id}-lock)`} />

      {/* Sharp X (four blades) */}
      <g filter={`url(#${id}-glow)`}>
        <path
          fill={`url(#${id}-x)`}
          d="M40 30 L44 38 L52 40 L44 42 L40 50 L36 42 L28 40 L36 38 Z"
        />
        <path
          fill={`url(#${id}-x)`}
          fillOpacity="0.85"
          d="M40 32 L42.5 38 L48.5 40 L42.5 42 L40 48 L37.5 42 L31.5 40 L37.5 38 Z"
        />
      </g>
    </svg>
  );
}
