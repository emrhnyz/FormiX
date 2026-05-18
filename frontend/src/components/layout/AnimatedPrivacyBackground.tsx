"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

const NODE_COUNT = 48;
const LINK_DIST = 140;

export function AnimatedPrivacyBackground() {
  const searchParams = useSearchParams();
  const cleanCapture = searchParams.get("promo") === "1";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let nodes: Node[] = [];
    let w = 0;
    let h = 0;
    let tick = 0;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      if (nodes.length === 0) {
        nodes = Array.from({ length: NODE_COUNT }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * (reducedMotion ? 0.15 : 0.45),
          vy: (Math.random() - 0.5) * (reducedMotion ? 0.15 : 0.45),
          r: 1.5 + Math.random() * 2,
        }));
      }
    };

    const drawHex = (cx: number, cy: number, size: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + size * Math.cos(a);
        const y = cy + size * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const frame = () => {
      tick += 1;
      ctx.clearRect(0, 0, w, h);

      if (!reducedMotion) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }

      // Chain links between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DIST) continue;

          const alpha = (1 - dist / LINK_DIST) * 0.35;
          const pulse = 0.5 + 0.5 * Math.sin(tick * 0.04 + i + j);
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, `rgba(139, 92, 246, ${alpha * pulse})`);
          grad.addColorStop(0.5, `rgba(34, 211, 238, ${alpha * pulse * 0.9})`);
          grad.addColorStop(1, `rgba(217, 70, 239, ${alpha * pulse})`);

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Data packet traveling along edge
          if (!reducedMotion && dist < LINK_DIST * 0.85) {
            const t = (tick * 0.02 + i * 0.3) % 1;
            const px = a.x + (b.x - a.x) * t;
            const py = a.y + (b.y - a.y) * t;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(34, 211, 238, ${alpha * 1.2})`;
            ctx.fill();
          }
        }
      }

      // Nodes + occasional hex (block)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const pulse = 0.6 + 0.4 * Math.sin(tick * 0.05 + i);

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${0.5 * pulse})`;
        ctx.fill();

        if (i % 9 === 0) {
          drawHex(n.x, n.y, 10 + pulse * 2, 0.12 * pulse);
        }
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* Aurora orbs */}
      <div className="absolute -left-[20%] top-[10%] h-[420px] w-[420px] animate-orbit-slow rounded-full bg-violet-600/20 blur-[100px]" />
      <div
        className="absolute -right-[15%] top-[30%] h-[380px] w-[380px] animate-orbit-reverse rounded-full bg-cyan-500/15 blur-[90px]"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute left-[30%] bottom-[5%] h-[320px] w-[320px] animate-pulse-glow rounded-full bg-fuchsia-600/15 blur-[80px]" />

      {/* Scanning privacy shield line */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(34,211,238,0.03)_50%,transparent_100%)] animate-scan-line" />

      {/* Blockchain mesh canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />

      {!cleanCapture && (
        <>
          <svg
            className="absolute left-[8%] top-[18%] h-16 w-16 animate-drift text-violet-400/20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <svg
            className="absolute right-[12%] top-[55%] h-20 w-20 animate-drift-reverse text-cyan-400/15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden
          >
            <path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <svg
            className="absolute left-[55%] top-[72%] h-14 w-14 animate-float text-fuchsia-400/15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </>
      )}

      {/* Scrolling hex grid */}
      <div className="absolute inset-0 bg-hex-grid opacity-[0.04] animate-grid-drift" />

      {/* Vignette + top glow */}
      <div className="absolute inset-0 bg-hero-glow opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/20 via-transparent to-ink-950/90" />
    </div>
  );
}
