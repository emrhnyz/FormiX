import { Suspense } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { AnimatedPrivacyBackground } from "./AnimatedPrivacyBackground";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className = "" }: Props) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Suspense fallback={null}>
        <AnimatedPrivacyBackground />
      </Suspense>
      <div
        className="pointer-events-none fixed inset-0 bg-grid-fade bg-grid opacity-30"
        aria-hidden
      />
      <SiteHeader />
      <main className={`relative z-10 flex-1 ${className}`}>{children}</main>
      <SiteFooter />
    </div>
  );
}

