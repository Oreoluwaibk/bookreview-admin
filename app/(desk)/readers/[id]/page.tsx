import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GrowthCard, ReadingCard, ReviewCard, StudyCard } from "@/components/records";
import { Avatar, Empty, ErrorNote, Notice } from "@/components/ui";
import { loadReader } from "@/lib/data";
import { countWord, formatWhen } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Reader",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening this reader…</p>}>
      <ReaderContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ReaderContent({
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

  const result = await loadReader(id);
  if (!result.configured) {
    return null;
  }

  if (!result.data) {
    if (result.error) {
      return <ErrorNote message={result.error} />;
    }
    notFound();
  }

  const { reader, reviews, readings, studies, growth } = result.data;
  const back = `/readers/${reader.id}`;

  return (
    <>
      <Link href="/readers" className="text-sm font-semibold text-lake-deep">
        All readers
      </Link>
      <Notice notice={notice} />
      {result.error ? <ErrorNote message={result.error} /> : null}
      <header className="flex gap-4 rounded-3xl border border-line bg-paper-raised p-5">
        <Avatar name={reader.name} src={reader.avatarUrl} size="lg" />
        <div className="min-w-0">
          <h1 className="font-serif text-4xl">{reader.name}</h1>
          {reader.email ? <p className="mt-1 text-ink-soft">{reader.email}</p> : null}
          <p className="mt-1 text-sm text-ink-soft">
            Joined {formatWhen(reader.createdAt)}
            {reader.updatedAt ? ` · Profile updated ${formatWhen(reader.updatedAt)}` : ""}
          </p>
          {reader.bio ? <p className="mt-3 leading-7">{reader.bio}</p> : null}
          <p className="mt-3 text-sm text-lake-deep">
            {[countWord(reviews.length, "review"), countWord(readings.length, "reading"), countWord(studies.length, "study", "studies")].join(" · ")}
          </p>
        </div>
      </header>
      {growth ? <GrowthCard growth={growth} /> : null}
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Reviews</h2>
        {reviews.length === 0 ? <Empty>No reviews from this reader.</Empty> : reviews.map((review) => <ReviewCard key={review.id} review={review} back={back} />)}
      </section>
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Readings</h2>
        {readings.length === 0 ? <Empty>No readings from this reader.</Empty> : readings.map((reading) => <ReadingCard key={reading.id} reading={reading} back={back} />)}
      </section>
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Studies</h2>
        {studies.length === 0 ? <Empty>No studies from this reader.</Empty> : studies.map((study) => <StudyCard key={study.id} study={study} back={back} />)}
      </section>
    </>
  );
}
