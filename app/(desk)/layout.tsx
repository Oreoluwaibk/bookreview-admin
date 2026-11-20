import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { requireDesk } from "@/lib/guard";
import { isConfigured, isPrivileged } from "@/lib/supabase";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-ink-soft">Opening the desk…</p>}>
      <DeskFrame>{children}</DeskFrame>
    </Suspense>
  );
}

async function DeskFrame({ children }: { children: React.ReactNode }) {
  await requireDesk();

  return (
    <Shell configured={isConfigured()} privileged={isPrivileged()}>
      {children}
    </Shell>
  );
}
