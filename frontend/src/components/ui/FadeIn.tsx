"use client";

import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3 | 4 | 5;
};

export function FadeIn({ children, className = "", delay }: Props) {
  const stagger = delay ? `stagger-${delay}` : "";
  return (
    <div
      className={`opacity-0-start animate-fade-up ${stagger} ${className}`}
      style={{ animationFillMode: "forwards" }}
    >
      {children}
    </div>
  );
}
