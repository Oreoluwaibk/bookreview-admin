import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar, Empty, ErrorNote, PageIntro, SearchForm } from "@/components/ui";
import { loadReaders } from "@/lib/data";
import { countWord, formatWhen } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Readers",
};

export default function ReadersPage({ searchParams }: { searchParams: Promise<{ q?: string; notice?: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening readers…</p>}>
      <ReadersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReadersContent({ searchParams }: { searchParams: Promise<{ q?: string; notice?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const result = await loadReaders(query);
  if (!result.configured) {
    return null;
  }

  return (
    <>
      <PageIntro kicker="People" title="Readers" text="Every name on the shelf, with the reviews, readings, and studies visible from this desk." />
      <SearchForm path="/readers" query={query} placeholder="Search by name or note" />
      {result.error ? <ErrorNote message={result.error} /> : null}
      {result.data.length === 0 ? (
        <Empty>{query ? "Nothing matches that search." : "No readers yet."}</Empty>
      ) : (
        <ul className="grid gap-3">
          {result.data.map((reader) => (
            <li key={reader.id}>
              <Link href={`/readers/${reader.id}`} className="flex gap-4 rounded-3xl border border-line bg-paper-raised p-4 hover:border-lake">
                <Avatar name={reader.name} src={reader.avatarUrl} />
                <span className="min-w-0">
                  <span className="block font-serif text-2xl">{reader.name}</span>
                  {reader.email ? <span className="block text-sm text-ink-soft">{reader.email}</span> : null}
                  <span className="mt-1 block text-sm text-ink-soft">
                    Joined {formatWhen(reader.createdAt)}
                    {reader.bio ? ` · ${reader.bio}` : ""}
                  </span>
                  <span className="mt-2 block text-sm text-lake-deep">
                    {[countWord(reader.reviews, "review"), countWord(reader.readings, "reading"), countWord(reader.studies, "study", "studies")].join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
