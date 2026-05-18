import { Suspense } from "react";
import { FillFormClient } from "./FillFormClient";

export default function FillFormPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          Yükleniyor…
        </main>
      }
    >
      <FillFormClient />
    </Suspense>
  );
}
