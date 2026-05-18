/** SVG: creator → contract → respondent → FHE → decrypt */
export function FormLifecycleDiagram() {
  return (
    <svg
      viewBox="0 0 720 200"
      className="mx-auto w-full max-w-3xl text-slate-300"
      role="img"
      aria-label="Form lifecycle: create, fill with encryption, finalize, creator decrypt"
    >
      <defs>
        <linearGradient id="fx-flow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <marker id="fx-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#22d3ee" />
        </marker>
      </defs>

      {[
        { x: 20, label: "Creator", sub: "Design form" },
        { x: 155, label: "Deploy", sub: "FormFactory" },
        { x: 290, label: "Respondent", sub: "Wallet connect" },
        { x: 425, label: "CoFHE", sub: "Encrypt answers" },
        { x: 560, label: "Chain", sub: "Ciphertext only" },
      ].map((node, i) => (
        <g key={node.label}>
          <rect
            x={node.x}
            y="60"
            width="120"
            height="72"
            rx="12"
            fill="rgba(15,23,42,0.9)"
            stroke="url(#fx-flow)"
            strokeWidth="1.5"
          />
          <text x={node.x + 60} y="92" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="600">
            {node.label}
          </text>
          <text x={node.x + 60} y="112" textAnchor="middle" fill="#94a3b8" fontSize="10">
            {node.sub}
          </text>
          {i < 4 && (
            <line
              x1={node.x + 120}
              y1="96"
              x2={node.x + 135}
              y2="96"
              stroke="#22d3ee"
              strokeWidth="2"
              markerEnd="url(#fx-arrow)"
            />
          )}
        </g>
      ))}

      <path
        d="M 620 132 Q 680 132 680 160 Q 680 188 560 188 L 155 188 Q 80 188 80 160"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        markerEnd="url(#fx-arrow)"
        opacity="0.7"
      />
      <text x="400" y="182" textAnchor="middle" fill="#c4b5fd" fontSize="11">
        Creator dashboard — decrypt aggregates & text (wallet session only)
      </text>
    </svg>
  );
}
