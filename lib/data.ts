import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDeskClient } from "@/lib/supabase";

export type DeskData<T> = {
  configured: boolean;
  privileged: boolean;
  error: string | null;
  data: T;
};

export type BookSnap = {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  workKey: string;
  year: number | null;
  createdAt: string;
};

export type ReviewItem = {
  id: string;
  userId: string;
  reader: string;
  bookId: string;
  bookTitle: string;
  authors: string[];
  coverUrl: string | null;
  workKey: string;
  scope: string;
  chapterLabel: string | null;
  lesson: string;
  application: string;
  whoItsFor: string;
  whoShouldSkip: string | null;
  observation: string | null;
  stars: number | null;
  createdAt: string;
};

export type ReadingItem = {
  id: string;
  userId: string;
  reader: string;
  bookId: string;
  bookTitle: string;
  authors: string[];
  coverUrl: string | null;
  workKey: string;
  status: string;
  format: string;
  progress: number | null;
  copySource: string | null;
  startedOn: string | null;
  finishedOn: string | null;
  updatedAt: string;
};

export type VerseItem = {
  reference: string;
  version: string;
  text: string;
  attribution: string;
  position: number;
};

export type StudyItem = {
  id: string;
  userId: string;
  reader: string;
  theme: string;
  themeLabel: string | null;
  subject: string;
  chapters: string | null;
  notes: string | null;
  lesson: string | null;
  application: string | null;
  visibility: string;
  createdAt: string;
  verses: VerseItem[];
};

export type ReaderItem = {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  reviews: number;
  readings: number;
  studies: number;
};

export type BookItem = BookSnap & {
  reviews: number;
  readings: number;
};

export type EditionItem = {
  id: string;
  publisher: string | null;
  year: number | null;
  isbn13: string | null;
  translator: string | null;
  pages: number | null;
  key: string;
};

export type GrowthItem = {
  userId: string;
  reader: string;
  booksFinished: number;
  studiesDone: number;
  reviewsPublished: number;
  summary: string;
  know: string[];
  doNext: string[];
  become: string[];
  updatedAt: string | null;
};

export type Overview = {
  readers: number | null;
  books: number | null;
  editions: number | null;
  readings: number | null;
  reviews: number | null;
  studies: number | null;
  growth: number | null;
  readingNow: number;
  finished: number;
  want: number;
  stopped: number;
  publicStudies: number;
  privateStudies: number;
  averageStars: number | null;
  starCounts: number[];
  recentReviews: ReviewItem[];
  recentReaders: ReaderItem[];
  recentBooks: BookItem[];
};

export type ReaderDetail = {
  reader: ReaderItem;
  reviews: ReviewItem[];
  readings: ReadingItem[];
  studies: StudyItem[];
  growth: GrowthItem | null;
};

export type BookDetail = {
  book: BookItem;
  editions: EditionItem[];
  reviews: ReviewItem[];
  readings: ReadingItem[];
};

const emptyOverview: Overview = {
  readers: null,
  books: null,
  editions: null,
  readings: null,
  reviews: null,
  studies: null,
  growth: null,
  readingNow: 0,
  finished: 0,
  want: 0,
  stopped: 0,
  publicStudies: 0,
  privateStudies: 0,
  averageStars: null,
  starCounts: [0, 0, 0, 0, 0],
  recentReviews: [],
  recentReaders: [],
  recentBooks: [],
};

function offline<T>(data: T): DeskData<T> {
  return {
    configured: false,
    privileged: false,
    error: "Add the Supabase URL and anon key from the reader app to .env.local.",
    data,
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return null;
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  const single = text(value);
  return single ? [single] : [];
}

function rowsOf(value: unknown) {
  return (Array.isArray(value) ? value : []) as Record<string, unknown>[];
}

function problems(messages: Array<string | null | undefined>) {
  const unique = [...new Set(messages.filter((item): item is string => Boolean(item)))];
  return unique.length > 0 ? unique.join(" ") : null;
}

function bookFromRow(row: Record<string, unknown>): BookSnap | null {
  const id = text(row.id);
  const title = text(row.title);
  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    authors: stringList(row.authors),
    coverUrl: text(row.cover_url) || null,
    workKey: text(row.open_library_work_key),
    year: asNumber(row.first_publish_year),
    createdAt: text(row.created_at),
  };
}

function tally(rows: Record<string, unknown>[], key: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const id = text(row[key]);
    if (!id) {
      continue;
    }
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function namesFor(supabase: SupabaseClient, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 200);
  const names = new Map<string, string>();
  if (unique.length === 0) {
    return { names, error: null as string | null };
  }

  const { data, error } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  for (const row of rowsOf(data)) {
    names.set(text(row.id), text(row.display_name) || "Reader");
  }

  return { names, error: error?.message ?? null };
}

async function booksFor(supabase: SupabaseClient, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 200);
  const books = new Map<string, BookSnap>();
  if (unique.length === 0) {
    return { books, error: null as string | null };
  }

  const { data, error } = await supabase
    .from("books")
    .select("id, title, authors, cover_url, open_library_work_key, first_publish_year, created_at")
    .in("id", unique);

  for (const row of rowsOf(data)) {
    const book = bookFromRow(row);
    if (book) {
      books.set(book.id, book);
    }
  }

  return { books, error: error?.message ?? null };
}

async function emailsFor(supabase: SupabaseClient, privileged: boolean) {
  const emails = new Map<string, string>();
  if (!privileged) {
    return emails;
  }

  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const user of data?.users ?? []) {
    if (user.email) {
      emails.set(user.id, user.email);
    }
  }

  return emails;
}

function mapReview(row: Record<string, unknown>, names: Map<string, string>, books: Map<string, BookSnap>): ReviewItem {
  const book = books.get(text(row.book_id));
  return {
    id: text(row.id),
    userId: text(row.user_id),
    reader: names.get(text(row.user_id)) || "Reader",
    bookId: book?.id || text(row.book_id),
    bookTitle: book?.title || "Untitled book",
    authors: book?.authors ?? [],
    coverUrl: book?.coverUrl ?? null,
    workKey: book?.workKey || "",
    scope: text(row.scope) || "book",
    chapterLabel: text(row.chapter_label) || null,
    lesson: text(row.lesson) || text(row.premise),
    application: text(row.application) || text(row.what_works),
    whoItsFor: text(row.who_its_for),
    whoShouldSkip: text(row.who_should_skip) || null,
    observation: text(row.observation) || null,
    stars: asNumber(row.stars),
    createdAt: text(row.created_at),
  };
}

function mapReading(row: Record<string, unknown>, names: Map<string, string>, books: Map<string, BookSnap>): ReadingItem {
  const book = books.get(text(row.book_id));
  return {
    id: text(row.id),
    userId: text(row.user_id),
    reader: names.get(text(row.user_id)) || "Reader",
    bookId: book?.id || text(row.book_id),
    bookTitle: book?.title || "Untitled book",
    authors: book?.authors ?? [],
    coverUrl: book?.coverUrl ?? null,
    workKey: book?.workKey || "",
    status: text(row.status),
    format: text(row.format),
    progress: asNumber(row.progress_percent),
    copySource: text(row.copy_source) || null,
    startedOn: text(row.started_on) || null,
    finishedOn: text(row.finished_on) || null,
    updatedAt: text(row.updated_at),
  };
}

function mapVerses(value: unknown): VerseItem[] {
  return rowsOf(value)
    .map((row) => ({
      reference: text(row.reference),
      version: text(row.version),
      text: text(row.text),
      attribution: text(row.attribution),
      position: asNumber(row.position) ?? 0,
    }))
    .sort((left, right) => left.position - right.position);
}

function mapStudy(row: Record<string, unknown>, names: Map<string, string>): StudyItem {
  return {
    id: text(row.id),
    userId: text(row.user_id),
    reader: names.get(text(row.user_id)) || "Reader",
    theme: text(row.theme),
    themeLabel: text(row.theme_label) || null,
    subject: text(row.subject),
    chapters: text(row.chapters) || null,
    notes: text(row.notes) || null,
    lesson: text(row.lesson) || null,
    application: text(row.application) || null,
    visibility: text(row.visibility) || "public",
    createdAt: text(row.created_at),
    verses: mapVerses(row.study_verses),
  };
}

function mapReader(
  row: Record<string, unknown>,
  emails: Map<string, string>,
  reviews: Map<string, number>,
  readings: Map<string, number>,
  studies: Map<string, number>,
): ReaderItem {
  const id = text(row.id);
  return {
    id,
    name: text(row.display_name) || "Reader",
    email: emails.get(id) ?? null,
    bio: text(row.bio) || null,
    avatarUrl: text(row.avatar_url) || null,
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at) || null,
    reviews: reviews.get(id) ?? 0,
    readings: readings.get(id) ?? 0,
    studies: studies.get(id) ?? 0,
  };
}

function mapGrowth(row: Record<string, unknown>, names: Map<string, string>): GrowthItem {
  const userId = text(row.user_id);
  return {
    userId,
    reader: names.get(userId) || "Reader",
    booksFinished: asNumber(row.books_finished) ?? 0,
    studiesDone: asNumber(row.studies_done) ?? 0,
    reviewsPublished: asNumber(row.reviews_published) ?? 0,
    summary: text(row.summary),
    know: stringList(row.to_know),
    doNext: stringList(row.to_do),
    become: stringList(row.to_be),
    updatedAt: text(row.updated_at) || null,
  };
}

const reviewColumns =
  "id, user_id, book_id, scope, chapter_label, lesson, application, who_its_for, who_should_skip, observation, stars, created_at, premise, what_works";

const readingColumns =
  "id, user_id, book_id, status, format, progress_percent, copy_source, started_on, finished_on, updated_at";

const studyColumns =
  "id, user_id, theme, theme_label, subject, chapters, notes, lesson, application, visibility, created_at, study_verses(reference, version, text, attribution, position)";

async function countOf(supabase: SupabaseClient, table: string, column = "id") {
  const { count, error } = await supabase.from(table).select(column, { count: "exact", head: true });
  return { count: error ? null : (count ?? 0), error: error?.message ?? null };
}

async function countWhere(supabase: SupabaseClient, table: string, column: string, value: string) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value);
  return { count: error ? 0 : (count ?? 0), error: error?.message ?? null };
}

function matches(query: string, parts: Array<string | null | undefined>) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  return parts.some((part) => (part ?? "").toLowerCase().includes(needle));
}

async function activityCounts(supabase: SupabaseClient) {
  const [reviewRows, readingRows, studyRows] = await Promise.all([
    supabase.from("reviews").select("user_id, book_id").limit(1000),
    supabase.from("readings").select("user_id, book_id").limit(1000),
    supabase.from("studies").select("user_id").limit(1000),
  ]);

  return {
    reviewCounts: tally(rowsOf(reviewRows.data), "user_id"),
    readingCounts: tally(rowsOf(readingRows.data), "user_id"),
    studyCounts: tally(rowsOf(studyRows.data), "user_id"),
    bookReviews: tally(rowsOf(reviewRows.data), "book_id"),
    bookReadings: tally(rowsOf(readingRows.data), "book_id"),
    error: problems([reviewRows.error?.message, readingRows.error?.message, studyRows.error?.message]),
  };
}

export async function loadOverview(): Promise<DeskData<Overview>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline(emptyOverview);
  }

  const { supabase, privileged } = desk;
  const [readers, books, editions, readings, reviews, studies, growth, want, readingNow, finished, stopped, publicStudies, privateStudies, starRows, recentReviewRows, recentReaderRows, recentBookRows, activity] =
    await Promise.all([
      countOf(supabase, "profiles"),
      countOf(supabase, "books"),
      countOf(supabase, "editions"),
      countOf(supabase, "readings"),
      countOf(supabase, "reviews"),
      countOf(supabase, "studies"),
      countOf(supabase, "reader_growth", "user_id"),
      countWhere(supabase, "readings", "status", "want"),
      countWhere(supabase, "readings", "status", "reading"),
      countWhere(supabase, "readings", "status", "finished"),
      countWhere(supabase, "readings", "status", "stopped"),
      countWhere(supabase, "studies", "visibility", "public"),
      countWhere(supabase, "studies", "visibility", "private"),
      supabase.from("reviews").select("stars").limit(1000),
      supabase.from("reviews").select(reviewColumns).order("created_at", { ascending: false }).limit(4),
      supabase.from("profiles").select("id, display_name, bio, avatar_url, created_at, updated_at").order("created_at", { ascending: false }).limit(4),
      supabase.from("books").select("id, title, authors, cover_url, open_library_work_key, first_publish_year, created_at").order("created_at", { ascending: false }).limit(4),
      activityCounts(supabase),
    ]);

  const reviewRecords = rowsOf(recentReviewRows.data);
  const linked = await Promise.all([
    namesFor(supabase, reviewRecords.map((row) => text(row.user_id))),
    booksFor(supabase, reviewRecords.map((row) => text(row.book_id))),
  ]);

  let rated = 0;
  let sum = 0;
  const starCounts = [0, 0, 0, 0, 0];
  for (const row of rowsOf(starRows.data)) {
    const stars = asNumber(row.stars);
    if (stars == null) {
      continue;
    }
    const bucket = Math.round(stars);
    if (bucket >= 1 && bucket <= 5) {
      starCounts[bucket - 1] += 1;
    }
    rated += 1;
    sum += stars;
  }

  const recentBooks = rowsOf(recentBookRows.data)
    .map((row) => {
      const book = bookFromRow(row);
      if (!book) {
        return null;
      }
      return { ...book, reviews: activity.bookReviews.get(book.id) ?? 0, readings: activity.bookReadings.get(book.id) ?? 0 };
    })
    .filter((book): book is BookItem => Boolean(book));

  return {
    configured: true,
    privileged,
    error: problems([
      readers.error,
      books.error,
      editions.error,
      readings.error,
      reviews.error,
      studies.error,
      growth.error,
      want.error,
      readingNow.error,
      finished.error,
      stopped.error,
      publicStudies.error,
      privateStudies.error,
      starRows.error?.message,
      recentReviewRows.error?.message,
      recentReaderRows.error?.message,
      recentBookRows.error?.message,
      linked[0].error,
      linked[1].error,
      activity.error,
    ]),
    data: {
      readers: readers.count,
      books: books.count,
      editions: editions.count,
      readings: readings.count,
      reviews: reviews.count,
      studies: studies.count,
      growth: growth.count,
      want: want.count,
      readingNow: readingNow.count,
      finished: finished.count,
      stopped: stopped.count,
      publicStudies: publicStudies.count,
      privateStudies: privateStudies.count,
      averageStars: rated > 0 ? Math.round((sum / rated) * 10) / 10 : null,
      starCounts,
      recentReviews: reviewRecords.map((row) => mapReview(row, linked[0].names, linked[1].books)),
      recentReaders: rowsOf(recentReaderRows.data).map((row) =>
        mapReader(row, new Map(), activity.reviewCounts, activity.readingCounts, activity.studyCounts),
      ),
      recentBooks,
    },
  };
}

export async function loadReaders(query: string): Promise<DeskData<ReaderItem[]>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline([]);
  }

  const { supabase, privileged } = desk;
  const [profiles, activity, emails] = await Promise.all([
    supabase.from("profiles").select("id, display_name, bio, avatar_url, created_at, updated_at").order("created_at", { ascending: false }).limit(200),
    activityCounts(supabase),
    emailsFor(supabase, privileged),
  ]);

  const readers = rowsOf(profiles.data)
    .map((row) => mapReader(row, emails, activity.reviewCounts, activity.readingCounts, activity.studyCounts))
    .filter((reader) => matches(query, [reader.name, reader.email, reader.bio]));

  return {
    configured: true,
    privileged,
    error: problems([profiles.error?.message, activity.error]),
    data: readers,
  };
}

export async function loadReader(id: string): Promise<DeskData<ReaderDetail | null>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline(null);
  }

  const { supabase, privileged } = desk;
  const [profile, reviewRows, readingRows, studyRows, growthRow, emails] = await Promise.all([
    supabase.from("profiles").select("id, display_name, bio, avatar_url, created_at, updated_at").eq("id", id).maybeSingle(),
    supabase.from("reviews").select(reviewColumns).eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("readings").select(readingColumns).eq("user_id", id).order("updated_at", { ascending: false }).limit(50),
    supabase.from("studies").select(studyColumns).eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("reader_growth").select("user_id, books_finished, studies_done, reviews_published, summary, to_know, to_do, to_be, updated_at").eq("user_id", id).maybeSingle(),
    emailsFor(supabase, privileged),
  ]);

  if (profile.error || !profile.data) {
    return {
      configured: true,
      privileged,
      error: profile.error?.message ?? null,
      data: null,
    };
  }

  const reviews = rowsOf(reviewRows.data);
  const readings = rowsOf(readingRows.data);
  const books = await booksFor(supabase, [...reviews, ...readings].map((row) => text(row.book_id)));
  const names = new Map([[id, text((profile.data as Record<string, unknown>).display_name) || "Reader"]]);
  const reader = mapReader(profile.data as Record<string, unknown>, emails, new Map(), new Map(), new Map());
  reader.reviews = reviews.length;
  reader.readings = readings.length;
  reader.studies = rowsOf(studyRows.data).length;

  return {
    configured: true,
    privileged,
    error: problems([reviewRows.error?.message, readingRows.error?.message, studyRows.error?.message, growthRow.error?.message, books.error]),
    data: {
      reader,
      reviews: reviews.map((row) => mapReview(row, names, books.books)),
      readings: readings.map((row) => mapReading(row, names, books.books)),
      studies: rowsOf(studyRows.data).map((row) => mapStudy(row, names)),
      growth: growthRow.data ? mapGrowth(growthRow.data as Record<string, unknown>, names) : null,
    },
  };
}

export async function loadBooks(query: string): Promise<DeskData<BookItem[]>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline([]);
  }

  const { supabase, privileged } = desk;
  const [bookRows, activity] = await Promise.all([
    supabase.from("books").select("id, title, authors, cover_url, open_library_work_key, first_publish_year, created_at").order("created_at", { ascending: false }).limit(200),
    activityCounts(supabase),
  ]);

  const books = rowsOf(bookRows.data)
    .map((row) => {
      const book = bookFromRow(row);
      if (!book) {
        return null;
      }
      return { ...book, reviews: activity.bookReviews.get(book.id) ?? 0, readings: activity.bookReadings.get(book.id) ?? 0 };
    })
    .filter((book): book is BookItem => Boolean(book))
    .filter((book) => matches(query, [book.title, book.authors.join(" "), book.workKey]));

  return {
    configured: true,
    privileged,
    error: problems([bookRows.error?.message, activity.error]),
    data: books,
  };
}

export async function loadBook(id: string): Promise<DeskData<BookDetail | null>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline(null);
  }

  const { supabase, privileged } = desk;
  const [bookRow, editionRows, reviewRows, readingRows] = await Promise.all([
    supabase.from("books").select("id, title, authors, cover_url, open_library_work_key, first_publish_year, created_at").eq("id", id).maybeSingle(),
    supabase.from("editions").select("id, publisher, publish_year, isbn13, translator, page_count, open_library_edition_key").eq("book_id", id),
    supabase.from("reviews").select(reviewColumns).eq("book_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("readings").select(readingColumns).eq("book_id", id).order("updated_at", { ascending: false }).limit(50),
  ]);

  const book = bookRow.data ? bookFromRow(bookRow.data as Record<string, unknown>) : null;
  if (bookRow.error || !book) {
    return { configured: true, privileged, error: bookRow.error?.message ?? null, data: null };
  }

  const reviews = rowsOf(reviewRows.data);
  const readings = rowsOf(readingRows.data);
  const names = await namesFor(supabase, [...reviews, ...readings].map((row) => text(row.user_id)));
  const books = new Map([[book.id, book]]);

  return {
    configured: true,
    privileged,
    error: problems([editionRows.error?.message, reviewRows.error?.message, readingRows.error?.message, names.error]),
    data: {
      book: { ...book, reviews: reviews.length, readings: readings.length },
      editions: rowsOf(editionRows.data).map((row) => ({
        id: text(row.id),
        publisher: text(row.publisher) || null,
        year: asNumber(row.publish_year),
        isbn13: text(row.isbn13) || null,
        translator: text(row.translator) || null,
        pages: asNumber(row.page_count),
        key: text(row.open_library_edition_key),
      })),
      reviews: reviews.map((row) => mapReview(row, names.names, books)),
      readings: readings.map((row) => mapReading(row, names.names, books)),
    },
  };
}

export async function loadReviews(query: string, scope: string): Promise<DeskData<ReviewItem[]>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline([]);
  }

  const { supabase, privileged } = desk;
  let request = supabase.from("reviews").select(reviewColumns).order("created_at", { ascending: false }).limit(200);
  if (scope === "book" || scope === "chapter") {
    request = request.eq("scope", scope);
  }

  const { data, error } = await request;
  const records = rowsOf(data);
  const [names, books] = await Promise.all([
    namesFor(supabase, records.map((row) => text(row.user_id))),
    booksFor(supabase, records.map((row) => text(row.book_id))),
  ]);

  const reviews = records
    .map((row) => mapReview(row, names.names, books.books))
    .filter((review) => matches(query, [review.bookTitle, review.reader, review.lesson, review.application, review.chapterLabel, review.whoItsFor]));

  return {
    configured: true,
    privileged,
    error: problems([error?.message, names.error, books.error]),
    data: reviews,
  };
}

export async function loadReadings(query: string, status: string): Promise<DeskData<ReadingItem[]>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline([]);
  }

  const { supabase, privileged } = desk;
  let request = supabase.from("readings").select(readingColumns).order("updated_at", { ascending: false }).limit(200);
  if (status === "want" || status === "reading" || status === "finished" || status === "stopped") {
    request = request.eq("status", status);
  }

  const { data, error } = await request;
  const records = rowsOf(data);
  const [names, books] = await Promise.all([
    namesFor(supabase, records.map((row) => text(row.user_id))),
    booksFor(supabase, records.map((row) => text(row.book_id))),
  ]);

  const readings = records
    .map((row) => mapReading(row, names.names, books.books))
    .filter((reading) => matches(query, [reading.bookTitle, reading.reader, reading.authors.join(" ")]));

  return {
    configured: true,
    privileged,
    error: problems([error?.message, names.error, books.error]),
    data: readings,
  };
}

export async function loadStudies(query: string, theme: string, visibility: string): Promise<DeskData<StudyItem[]>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline([]);
  }

  const { supabase, privileged } = desk;
  let request = supabase.from("studies").select(studyColumns).order("created_at", { ascending: false }).limit(100);
  if (theme === "book" || theme === "topic" || theme === "character" || theme === "other") {
    request = request.eq("theme", theme);
  }
  if (visibility === "public" || visibility === "private") {
    request = request.eq("visibility", visibility);
  }

  const { data, error } = await request;
  const records = rowsOf(data);
  const names = await namesFor(supabase, records.map((row) => text(row.user_id)));
  const studies = records
    .map((row) => mapStudy(row, names.names))
    .filter((study) => matches(query, [study.subject, study.reader, study.themeLabel, study.lesson, study.notes, study.chapters]));

  return {
    configured: true,
    privileged,
    error: problems([error?.message, names.error]),
    data: studies,
  };
}

export async function loadGrowth(): Promise<DeskData<GrowthItem[]>> {
  const desk = createDeskClient();
  if (!desk) {
    return offline([]);
  }

  const { supabase, privileged } = desk;
  const { data, error } = await supabase
    .from("reader_growth")
    .select("user_id, books_finished, studies_done, reviews_published, summary, to_know, to_do, to_be, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const records = rowsOf(data);
  const names = await namesFor(supabase, records.map((row) => text(row.user_id)));

  return {
    configured: true,
    privileged,
    error: problems([error?.message, names.error]),
    data: records.map((row) => mapGrowth(row, names.names)),
  };
}
