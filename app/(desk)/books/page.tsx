import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Cover, Empty, ErrorNote, PageIntro, SearchForm } from "@/components/ui";
import { loadBooks } from "@/lib/data";
import { authorsLine, countWord, formatWhen } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Books",
};

export default function BooksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening books…</p>}>
      <BooksContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BooksContent({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const result = await loadBooks(query);
  if (!result.configured) {
    return null;
  }

  return (
    <>
      <PageIntro
        kicker="Catalog"
        title="Books"
        text="Books saved when someone keeps a reading or publishes a review. The catalog page on the reader site still comes from Open Library."
      />
      <SearchForm path="/books" query={query} placeholder="Search by title, author, or work key" />
      {result.error ? <ErrorNote message={result.error} /> : null}
      {result.data.length === 0 ? (
        <Empty>{query ? "Nothing matches that search." : "No books have been saved yet."}</Empty>
      ) : (
        <ul className="grid gap-3">
          {result.data.map((book) => (
            <li key={book.id}>
              <Link href={`/books/${book.id}`} className="flex gap-4 rounded-3xl border border-line bg-paper-raised p-4 hover:border-lake">
                <Cover title={book.title} src={book.coverUrl} />
                <span className="min-w-0">
                  <span className="block font-serif text-2xl">{book.title}</span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {authorsLine(book.authors)}
                    {book.year ? ` · ${book.year}` : ""}
                  </span>
                  <span className="mt-2 block text-sm text-lake-deep">
                    {countWord(book.reviews, "review")} · {countWord(book.readings, "reading")} · Saved {formatWhen(book.createdAt)}
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
