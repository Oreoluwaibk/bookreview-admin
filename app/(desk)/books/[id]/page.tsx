import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReadingCard, ReviewCard } from "@/components/records";
import { Cover, Empty, ErrorNote, Notice } from "@/components/ui";
import { loadBook } from "@/lib/data";
import { authorsLine, catalogHref, countWord, formatWhen, readerBookHref } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Book",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening this book…</p>}>
      <BookContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function BookContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  if (!uuidPattern.test(id)) {
    notFound();
  }

  const result = await loadBook(id);
  if (!result.configured) {
    return null;
  }

  if (!result.data) {
    if (result.error) {
      return <ErrorNote message={result.error} />;
    }
    notFound();
  }

  const { book, editions, reviews, readings } = result.data;
  const back = `/books/${book.id}`;

  return (
    <>
      <Link href="/books" className="text-sm font-semibold text-lake-deep">
        All books
      </Link>
      <Notice notice={notice} />
      {result.error ? <ErrorNote message={result.error} /> : null}
      <header className="flex gap-4 rounded-3xl border border-line bg-paper-raised p-5">
        <Cover title={book.title} src={book.coverUrl} />
        <div className="min-w-0">
          <h1 className="font-serif text-4xl">{book.title}</h1>
          <p className="mt-2 text-ink-soft">
            {authorsLine(book.authors)}
            {book.year ? ` · ${book.year}` : ""}
          </p>
          <p className="mt-2 text-sm text-lake-deep">
            {countWord(reviews.length, "review")} · {countWord(readings.length, "reading")} · {countWord(editions.length, "edition")} · Saved{" "}
            {formatWhen(book.createdAt)}
          </p>
          <p className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
            {book.workKey ? (
              <a href={readerBookHref(book.workKey)} className="text-lake-deep">
                Open on the shelf
              </a>
            ) : null}
            {book.workKey ? (
              <a href={catalogHref(book.workKey)} className="text-lake-deep" target="_blank" rel="noreferrer">
                Open Library
              </a>
            ) : null}
          </p>
        </div>
      </header>
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Editions</h2>
        {editions.length === 0 ? (
          <Empty>No edition saved with this book.</Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {editions.map((edition) => (
              <li key={edition.id} className="rounded-3xl border border-line bg-paper-raised p-4 text-sm leading-6">
                <p className="font-semibold">{edition.publisher || "Publisher unknown"}</p>
                <p className="text-ink-soft">
                  {[edition.year, edition.pages ? `${edition.pages} pages` : null, edition.isbn13, edition.translator ? `Translated by ${edition.translator}` : null]
                    .filter(Boolean)
                    .join(" · ") || edition.key}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Reviews</h2>
        {reviews.length === 0 ? <Empty>No reviews for this book.</Empty> : reviews.map((review) => <ReviewCard key={review.id} review={review} back={back} />)}
      </section>
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Readings</h2>
        {readings.length === 0 ? <Empty>No readings for this book.</Empty> : readings.map((reading) => <ReadingCard key={reading.id} reading={reading} back={back} />)}
      </section>
    </>
  );
}
