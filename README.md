# Shelf desk

Admin dashboard for the Book Review reader app. It watches the same Supabase shelf the website uses, and it can take down a review, a reading, or a study that should not stay there.

The reader app lives next to this project in `../bookreview`. People search the Open Library catalog, keep a reading, publish a review, and write a Bible study. This desk is the other side of that shelf.

## What you can see

| Screen | Path | What it shows |
| --- | --- | --- |
| Overview | `/` | Counts, where readings sit, how reviews are rated, the latest reviews, the newest readers, and recently saved books |
| Readers | `/readers` | Every profile: name, short note, join date, and how many reviews, readings, and studies are visible |
| Reader | `/readers/[id]` | One person, their growth note when one exists, and their reviews, readings, and studies |
| Books | `/books` | Books saved when someone keeps a reading or publishes a review |
| Book | `/books/[id]` | Title, authors, year, editions, reviews, and readings. Links back to the reader site and to Open Library |
| Readings | `/readings` | Shelves: status, format, progress, and whether the copy was bought, borrowed, or an advance |
| Reviews | `/reviews` | Public reviews: the lesson, the practice, who it is for, stars, and whether it covers the whole book or one chapter |
| Studies | `/studies` | Bible studies, with their verses, notes, lesson, and practice |
| Growth | `/growth` | The saved reading of a person's growth: what they should know, do, and become |
| Legal | `/legal` | The privacy notice, the terms of use, and the delete-account page that the reader site shows in its footer |

Search and filters:

- Readers: name or short note
- Books: title, author, or Open Library work key
- Readings: title, author, or reader, plus status (`want`, `reading`, `finished`, `stopped`)
- Reviews: book, reader, or lesson, plus scope (`book` or `chapter`)
- Studies: subject, reader, or lesson, plus theme (`book`, `topic`, `character`, `other`) and visibility (`public` or `private`)

## What you can change

Each change asks for confirmation when it removes something, then refreshes the desk.

- **Remove review.** The review leaves the public shelf. The book record stays.
- **Remove reading.** That entry leaves the person's shelf.
- **Make a study public or private.** A public study shows up for anyone on the same theme and subject. A private study stays with the reader.
- **Remove study.** The study and its verses are deleted.
- **Edit privacy, terms, or the delete page.** `/legal/privacy`, `/legal/terms`, and `/legal/delete` change the pages linked from the reader site footer. A save writes `bookreview/content/legal.json`, which the website reads, and also stores the page in Supabase when `site_pages` exists and `SUPABASE_SECRET_KEY` is set. The table is created with `bookreview/supabase/site-pages.sql`.

The desk does not create accounts, edit a review's words, or delete a book or a profile. Those stay with the reader app.

## Access

Sign-in is a single shared password, `ADMIN_PASSWORD`. A correct password sets an httpOnly cookie named `shelf_desk` that lasts 12 days. Every desk page and every change checks that cookie again on the server. Signing out clears it. Visiting a desk URL without the cookie returns you to `/login`.

Change the password before anyone else can open the desk. Changing it also invalidates sessions that were opened with the old password.

## Public key and secret key

The desk reads Supabase with one of two keys.

With only `NEXT_PUBLIC_SUPABASE_ANON_KEY`, it sees what the reader site already shows in public: profiles, saved books, editions, and reviews. Private readings, private studies, and growth notes stay with each reader. A removal succeeds only when row security allows it. The blue note at the top of the desk says when you are in this mode.

With `SUPABASE_SECRET_KEY` set, the server uses that key instead. Private shelves, private studies, and growth notes become visible, reader emails can be shown, and removals apply to any record. The key stays on the server. It is never sent to the browser.

## The shelf it reads

These are the tables the reader app already uses. The desk does not create them.

| Table | What a row is |
| --- | --- |
| `profiles` | Display name, short note, picture, join date |
| `books` | A catalog work saved on the shelf: title, authors, cover, year, Open Library work key |
| `editions` | Publisher, year, ISBN-13, translator, page count |
| `readings` | One person's place in a book |
| `reviews` | A public lesson on a book or a chapter |
| `studies` | A Bible study: theme, subject, chapters, notes, lesson, practice, visibility |
| `study_verses` | Verses attached to a study |
| `reader_growth` | The generated growth note for one reader |

A reading status is `want`, `reading`, `finished`, or `stopped`. The format is `print`, `ebook`, or `audio`. The copy source is `bought`, `library`, or `advance`.

A review is either the whole book or one chapter. It keeps the lesson, what the reader is going to do, who it is for, who should skip it, an observation, and an optional star rating from 1 to 5. Older reviews may still have a premise and "what works"; the desk shows those when the newer lesson fields are empty.

A study theme is `book`, `topic`, `character`, or `other`. An "other" study also has its own theme name. Visibility is `public` or `private`.

A growth note is written by the reader app from finished books, studies, and reviews. It stores how many books were finished, how many studies were kept, how many reviews were published, a summary, and three lists: what the reader should know, do, and be.

## Setup

Use the same Supabase project as the reader app.

```bash
cd bookreview-admin
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_READER_ORIGIN=http://localhost:3000
ADMIN_PASSWORD=choose-a-desk-password
# SUPABASE_SECRET_KEY=
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the same values as in the reader app's `.env.local`. `NEXT_PUBLIC_READER_ORIGIN` is the reader site. Book pages use it for the "Open on the shelf" link, which points at `/books/[workKey]` on that origin.

Start the desk:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If the reader app is already on port 3000, start this app on another port:

```bash
npx next dev -p 3010
```

Then open [http://localhost:3010](http://localhost:3010).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Project layout

```text
app/
  login/                 password gate
  (desk)/                pages behind the cookie
    page.tsx             overview
    readers/             list and one reader
    books/               list and one book
    readings/
    reviews/
    studies/
    growth/
  actions/desk.ts        sign-in, sign-out, and moderation
components/              shell, nav, cards, search, filters
lib/
  data.ts                Supabase reads
  supabase.ts            public or secret client
  session.ts             password check and signed cookie
  guard.ts               requires the cookie on the server
  labels.ts              status, theme, and date labels
proxy.ts                 sends unsigned visitors to /login
```

`proxy.ts` is the optimistic check. Server components and moderation actions call `requireDesk()` as well, so a missing or expired cookie cannot load the shelf or change a record.
