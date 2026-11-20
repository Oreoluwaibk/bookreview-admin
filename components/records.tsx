import Link from "next/link";
import { ManageButton } from "@/components/manage-button";
import { Avatar, Cover } from "@/components/ui";
import type { GrowthItem, ReadingItem, ReviewItem, StudyItem } from "@/lib/data";
import { authorsLine, clip, copySource, formatWhen, label, readingFormat, readingStatus, scopeLabel, studyTheme } from "@/lib/labels";

export function ReviewCard({ review, back }: { review: ReviewItem; back: string }) {
  return (
    <article className="rounded-3xl border border-line bg-paper-raised p-4 sm:p-5">
      <div className="flex gap-4">
        <Cover title={review.bookTitle} src={review.coverUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-lake-deep">
            {[review.reader, scopeLabel(review.scope, review.chapterLabel), review.stars != null ? `${review.stars} stars` : null, formatWhen(review.createdAt)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h2 className="mt-1 font-serif text-2xl">
            {review.bookId ? (
              <Link href={`/books/${review.bookId}`} className="hover:text-lake-deep">
                {review.bookTitle}
              </Link>
            ) : (
              review.bookTitle
            )}
          </h2>
          <p className="text-sm text-ink-soft">{authorsLine(review.authors)}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm leading-6">
        <ReviewPart label="Lesson learnt" text={review.lesson} />
        <ReviewPart label="What they are going to do" text={review.application} />
        <ReviewPart label="Who it is for" text={review.whoItsFor} />
        {review.whoShouldSkip ? <ReviewPart label="Who should skip it" text={review.whoShouldSkip} /> : null}
        {review.observation ? <ReviewPart label="Observation" text={review.observation} /> : null}
      </dl>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/readers/${review.userId}`} className="text-sm font-semibold text-lake-deep">
          {review.reader}
        </Link>
        <ManageButton
          id={review.id}
          intent="remove-review"
          back={back}
          label="Remove review"
          confirm="Remove this review from the public shelf?"
        />
      </div>
    </article>
  );
}

function ReviewPart({ label: name, text }: { label: string; text: string }) {
  if (!text) {
    return null;
  }

  return (
    <div>
      <dt className="font-semibold">{name}</dt>
      <dd className="whitespace-pre-wrap text-ink-soft">{text}</dd>
    </div>
  );
}

export function ReadingCard({ reading, back }: { reading: ReadingItem; back: string }) {
  const progress = reading.progress != null ? Math.max(0, Math.min(100, reading.progress)) : null;

  return (
    <article className="flex gap-4 rounded-3xl border border-line bg-paper-raised p-4">
      <Cover title={reading.bookTitle} src={reading.coverUrl} />
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-2xl">
          {reading.bookId ? (
            <Link href={`/books/${reading.bookId}`} className="hover:text-lake-deep">
              {reading.bookTitle}
            </Link>
          ) : (
            reading.bookTitle
          )}
        </h2>
        <p className="text-sm text-ink-soft">{authorsLine(reading.authors)}</p>
        <p className="mt-2 text-sm text-lake-deep">
          {[
            label(readingStatus, reading.status),
            label(readingFormat, reading.format),
            progress != null ? `${progress}%` : null,
            reading.copySource ? label(copySource, reading.copySource) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {progress != null ? (
          <div className="mt-2 h-1.5 w-36 rounded-full bg-lake-soft">
            <div className="h-1.5 rounded-full bg-lake" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        <p className="mt-2 text-xs text-ink-soft">
          Updated {formatWhen(reading.updatedAt)}
          {reading.startedOn ? ` · Started ${formatWhen(reading.startedOn)}` : ""}
          {reading.finishedOn ? ` · Closed ${formatWhen(reading.finishedOn)}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/readers/${reading.userId}`} className="text-sm font-semibold text-lake-deep">
            {reading.reader}
          </Link>
          <ManageButton
            id={reading.id}
            intent="remove-reading"
            back={back}
            label="Remove reading"
            confirm="Remove this reading from the shelf?"
          />
        </div>
      </div>
    </article>
  );
}

export function StudyCard({ study, back }: { study: StudyItem; back: string }) {
  const theme = study.theme === "other" && study.themeLabel ? study.themeLabel : label(studyTheme, study.theme);

  return (
    <article className="rounded-3xl border border-line bg-paper-raised p-4 sm:p-5">
      <p className="text-sm text-lake-deep">
        {[study.visibility === "private" ? "Private" : "Public", theme, study.reader, formatWhen(study.createdAt)].filter(Boolean).join(" · ")}
      </p>
      <h2 className="mt-1 font-serif text-2xl">{study.subject || "Untitled study"}</h2>
      {study.chapters ? <p className="mt-1 text-sm text-lake-deep">Chapters {study.chapters}</p> : null}
      {study.verses.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {study.verses.map((verse) => (
            <li key={`${verse.reference}-${verse.version}-${verse.position}`} className="text-sm leading-6">
              <p className="font-semibold">
                {verse.reference} · {verse.version}
              </p>
              <p className="text-ink-soft">{clip(verse.text, 280)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {study.notes ? <StudyPart label="Notes" text={study.notes} /> : null}
      {study.lesson ? <StudyPart label="Lesson learnt" text={study.lesson} /> : null}
      {study.application ? <StudyPart label="What they are going to do" text={study.application} /> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/readers/${study.userId}`} className="text-sm font-semibold text-lake-deep">
          {study.reader}
        </Link>
        <div className="flex flex-wrap gap-2">
          <ManageButton
            id={study.id}
            intent={study.visibility === "private" ? "study-public" : "study-private"}
            back={back}
            label={study.visibility === "private" ? "Make public" : "Make private"}
          />
          <ManageButton id={study.id} intent="remove-study" back={back} label="Remove study" confirm="Remove this study and its verses?" />
        </div>
      </div>
    </article>
  );
}

function StudyPart({ label: name, text }: { label: string; text: string }) {
  return (
    <p className="mt-3 text-sm leading-6">
      <span className="font-semibold">{name}. </span>
      <span className="whitespace-pre-wrap text-ink-soft">{text}</span>
    </p>
  );
}

export function GrowthCard({ growth }: { growth: GrowthItem }) {
  return (
    <article className="rounded-3xl border border-line bg-paper-raised p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-lake-deep">
            {[
              `${growth.booksFinished} finished`,
              `${growth.studiesDone} studies`,
              `${growth.reviewsPublished} reviews`,
              formatWhen(growth.updatedAt),
            ].join(" · ")}
          </p>
          <h2 className="mt-1 font-serif text-2xl">
            <Link href={`/readers/${growth.userId}`} className="hover:text-lake-deep">
              {growth.reader}
            </Link>
          </h2>
        </div>
        <Avatar name={growth.reader} src={null} />
      </div>
      {growth.summary ? <p className="mt-3 leading-7 text-ink-soft">{growth.summary}</p> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <GrowthList title="Should know" items={growth.know} />
        <GrowthList title="Should do" items={growth.doNext} />
        <GrowthList title="Should be" items={growth.become} />
      </div>
    </article>
  );
}

function GrowthList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">Nothing written yet.</p>
      ) : (
        <ul className="mt-2 grid gap-2 text-sm leading-6 text-ink-soft">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
