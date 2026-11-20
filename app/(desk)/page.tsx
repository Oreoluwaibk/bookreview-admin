import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar, Cover, ErrorNote, Meter, PageIntro } from "@/components/ui";
import { loadOverview, type Overview } from "@/lib/data";
import { authorsLine, countWord, formatWhen, scopeLabel } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Counting the shelf…</p>}>
      <OverviewContent />
    </Suspense>
  );
}

async function OverviewContent() {
  const result = await loadOverview();
  if (!result.configured) {
    return null;
  }

  const { data } = result;

  return (
    <>
      <PageIntro
        kicker="Today on the shelf"
        title="Overview"
        text={summary(data)}
      />
      {result.error ? <ErrorNote message={result.error} /> : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat href="/readers" label="Readers" value={data.readers} hint="Accounts with a name on the shelf" />
        <Stat href="/books" label="Books" value={data.books} hint={data.editions != null ? countWord(data.editions, "edition") : "Saved from the catalog"} />
        <Stat href="/readings" label="Readings" value={data.readings} hint={data.readingNow > 0 ? `${data.readingNow} open right now` : "Want, reading, finished, stopped"} />
        <Stat href="/reviews" label="Reviews" value={data.reviews} hint={data.averageStars != null ? `${data.averageStars} average stars` : "Lessons left for the next reader"} />
        <Stat href="/studies" label="Studies" value={data.studies} hint={studyHint(data)} />
        <Stat href="/growth" label="Growth notes" value={data.growth} hint="What a reader should know, do, and be" />
        <Stat href="/readings?status=finished" label="Finished" value={data.finished} hint="Readings marked finished" />
        <Stat href="/readings?status=want" label="Want to read" value={data.want} hint="Saved, and not started yet" />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Where people are in a book" href="/readings">
          <Meter
            rows={[
              { label: "Want to read", count: data.want },
              { label: "Reading", count: data.readingNow },
              { label: "Finished", count: data.finished },
              { label: "Stopped", count: data.stopped },
            ]}
          />
        </Panel>
        <Panel title="How reviews are rated" href="/reviews">
          {data.averageStars == null ? (
            <p className="text-sm text-ink-soft">No starred reviews yet. A review can still publish with the lesson and the practice.</p>
          ) : (
            <Meter rows={data.starCounts.map((count, index) => ({ label: `${index + 1} stars`, count }))} />
          )}
        </Panel>
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-3">
          <SectionTitle href="/reviews" title="Latest reviews" />
          {data.recentReviews.length === 0 ? (
            <p className="text-sm text-ink-soft">No reviews yet.</p>
          ) : (
            data.recentReviews.map((review) => (
              <Link key={review.id} href={`/books/${review.bookId || ""}`} className="rounded-3xl border border-line bg-paper-raised p-4 hover:border-lake">
                <p className="text-sm text-lake-deep">
                  {[review.reader, scopeLabel(review.scope, review.chapterLabel), formatWhen(review.createdAt)].join(" · ")}
                </p>
                <h3 className="mt-1 font-serif text-xl">{review.bookTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{review.lesson || "No lesson written."}</p>
              </Link>
            ))
          )}
        </div>
        <div className="grid content-start gap-6">
          <div className="grid gap-3">
            <SectionTitle href="/readers" title="Newest readers" />
            {data.recentReaders.length === 0 ? (
              <p className="text-sm text-ink-soft">No readers yet.</p>
            ) : (
              data.recentReaders.map((reader) => (
                <Link key={reader.id} href={`/readers/${reader.id}`} className="flex items-center gap-3 rounded-3xl border border-line bg-paper-raised p-3 hover:border-lake">
                  <Avatar name={reader.name} src={reader.avatarUrl} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{reader.name}</span>
                    <span className="block text-sm text-ink-soft">
                      Joined {formatWhen(reader.createdAt)} · {countWord(reader.reviews, "review")}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
          <div className="grid gap-3">
            <SectionTitle href="/books" title="Recently saved books" />
            {data.recentBooks.length === 0 ? (
              <p className="text-sm text-ink-soft">No books saved yet.</p>
            ) : (
              data.recentBooks.map((book) => (
                <Link key={book.id} href={`/books/${book.id}`} className="flex gap-3 rounded-3xl border border-line bg-paper-raised p-3 hover:border-lake">
                  <Cover title={book.title} src={book.coverUrl} />
                  <span className="min-w-0">
                    <span className="block font-serif text-lg leading-6">{book.title}</span>
                    <span className="mt-1 block text-sm text-ink-soft">{authorsLine(book.authors)}</span>
                    <span className="mt-2 block text-sm text-lake-deep">
                      {countWord(book.reviews, "review")} · {countWord(book.readings, "reading")}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function summary(data: Overview) {
  if (data.readers == null || data.books == null || data.reviews == null) {
    return "Counts appear as soon as the shelf answers.";
  }

  if (data.readers === 0 && data.books === 0 && data.reviews === 0) {
    return "The shelf is quiet. Readers, books, and reviews will show up here as people use the site.";
  }

  const readerLine = data.readers === 1 ? "1 reader has" : `${data.readers} readers have`;
  const bookLine = data.books === 1 ? "1 book" : `${data.books} books`;
  const reviewLine = data.reviews === 1 ? "1 review" : `${data.reviews} reviews`;
  const studyLine = data.studies ? ` ${data.studies === 1 ? "1 study is" : `${data.studies} studies are`} kept alongside them.` : "";
  return `${readerLine} saved ${bookLine} and published ${reviewLine}.${studyLine}`;
}

function studyHint(data: Overview) {
  if (data.publicStudies === 0 && data.privateStudies === 0) {
    return "Book, topic, character, or other";
  }

  return `${data.publicStudies} public · ${data.privateStudies} private`;
}

function Stat({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: number | null;
  hint: string;
}) {
  return (
    <Link href={href} className="rounded-3xl border border-line bg-paper-raised px-5 py-4 hover:border-lake">
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value == null ? "—" : value}</p>
      <p className="mt-1 text-sm text-lake-deep">{hint}</p>
    </Link>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-paper-raised p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-lake-deep">
          Open
        </Link>
      </div>
      {children}
    </section>
  );
}

function SectionTitle({ href, title }: { href: string; title: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-serif text-2xl">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-lake-deep">
        See all
      </Link>
    </div>
  );
}
