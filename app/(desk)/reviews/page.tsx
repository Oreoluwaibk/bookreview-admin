import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewCard } from "@/components/records";
import { ChoiceLinks, Empty, ErrorNote, Notice, PageIntro, SearchForm } from "@/components/ui";
import { loadReviews } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reviews",
};

export default function ReviewsPage({ searchParams }: { searchParams: Promise<{ q?: string; scope?: string; notice?: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening reviews…</p>}>
      <ReviewsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReviewsContent({ searchParams }: { searchParams: Promise<{ q?: string; scope?: string; notice?: string }> }) {
  const { q = "", scope = "", notice } = await searchParams;
  const query = q.trim();
  const chosen = scope === "book" || scope === "chapter" ? scope : "";
  const result = await loadReviews(query, chosen);
  if (!result.configured) {
    return null;
  }

  return (
    <>
      <PageIntro
        kicker="Public shelf"
        title="Reviews"
        text="A published review stays with the book: the lesson, the practice, and who it is for. Remove one when it should leave the shelf."
      />
      <Notice notice={notice} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchForm path="/reviews" query={query} placeholder="Search a book, reader, or lesson" hidden={{ scope: chosen }} />
        <ChoiceLinks
          path="/reviews"
          name="scope"
          current={chosen}
          keep={{ q: query }}
          options={[
            { value: "", label: "All" },
            { value: "book", label: "Whole book" },
            { value: "chapter", label: "Chapter" },
          ]}
        />
      </div>
      {result.error ? <ErrorNote message={result.error} /> : null}
      {result.data.length === 0 ? (
        <Empty>{query || chosen ? "Nothing matches that search." : "No reviews yet."}</Empty>
      ) : (
        <div className="grid gap-3">
          {result.data.map((review) => (
            <ReviewCard key={review.id} review={review} back="/reviews" />
          ))}
        </div>
      )}
    </>
  );
}
