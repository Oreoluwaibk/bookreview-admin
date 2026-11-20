import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Mark } from "@/components/mark";
import { passwordConfigured } from "@/lib/session";
import { isConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  const shelfReady = isConfigured();
  const passwordReady = passwordConfigured();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-16">
      <Mark className="h-12 w-12" />
      <p className="mt-6 text-sm font-semibold tracking-wide text-clay">Book Review</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">The desk</h1>
      <p className="mt-3 leading-7 text-ink-soft">
        Monitor readers, the books they save, the place they keep in each one, the reviews they publish, and the studies they keep.
      </p>
      {!shelfReady ? (
        <p className="mt-4 rounded-2xl bg-lake-soft px-4 py-3 text-sm text-lake-deep">
          Add the reader app&apos;s Supabase URL and anon key to <code>.env.local</code> before the lists can load.
        </p>
      ) : null}
      {!passwordReady ? (
        <p className="mt-4 rounded-2xl border border-line bg-paper-raised px-4 py-3 text-sm text-ink-soft">
          Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code>, then use that password here.
        </p>
      ) : null}
      <LoginForm />
    </main>
  );
}
