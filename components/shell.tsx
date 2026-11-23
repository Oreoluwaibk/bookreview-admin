import Link from "next/link";
import { signOut } from "@/app/actions/desk";
import { DeskNav } from "@/components/desk-nav";
import { Mark } from "@/components/mark";

export function Shell({
  children,
  configured,
  privileged,
}: {
  children: React.ReactNode;
  configured: boolean;
  privileged: boolean;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="hidden bg-lake-deep text-paper lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:overflow-y-auto lg:px-5 lg:py-6">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Mark className="h-10 w-10 shrink-0" />
            <span>
              <span className="block font-serif text-2xl leading-none">Shelf desk</span>
              <span className="mt-1 block text-xs tracking-wide text-paper/70">Book Review</span>
            </span>
          </Link>
          <p className="mt-5 text-sm leading-6 text-paper/80">Watch the shelf, then take down a review, reading, or study that should not stay.</p>
          <DeskNav tone="dark" />
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm font-semibold text-paper/90 hover:text-white">
            Sign out
          </button>
        </form>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line bg-paper-raised lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <Mark className="h-8 w-8" />
              <span className="font-serif text-xl">Shelf desk</span>
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm font-semibold text-lake-deep">
                Sign out
              </button>
            </form>
          </div>
          <DeskNav tone="light" />
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
          {!configured ? (
            <p className="rounded-3xl border border-line bg-paper-raised px-5 py-4 text-sm leading-6 text-ink-soft">
              The desk needs the same Supabase URL and anon key as the reader app. Add them to <code>.env.local</code>.
            </p>
          ) : !privileged ? (
            <p className="rounded-3xl bg-lake-soft px-5 py-4 text-sm leading-6 text-lake-deep">
              This view uses the public key. Private readings, private studies, and growth notes stay with each reader. Add{" "}
              <code>SUPABASE_SECRET_KEY</code> when you need to see and manage every record.
            </p>
          ) : (
            <p className="rounded-3xl bg-lake-soft px-5 py-4 text-sm leading-6 text-lake-deep">
              The secret key is on, so private shelves, studies, and growth notes are visible here.
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
