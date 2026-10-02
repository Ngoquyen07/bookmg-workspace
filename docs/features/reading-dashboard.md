# Reading dashboard: plan, specification, and design

## Scope and decisions

The single-user dashboard answers three questions: what can I continue reading,
what am I close to finishing, and what have I finished recently? It contains
four shelf counts and three short book lists. It does not add authentication,
reading goals, daily history, charts, or new dashboard tables.

Navigation assumption: dashboard at `/`, discovery at `/discover`, shelf at
`/shelf`, and existing book detail URLs unchanged. Root URLs containing search
parameters redirect to `/discover` while preserving those parameters. Book detail
back navigation preserves discovery, shelf, or dashboard origin without adding
origin parameters to the URL.
Shelf section links pass their status through router history state; the detail back
button returns to the previous history entry so the selected tab is preserved.

## Implementation plan

1. Define the response contract and business rules in this document.
2. Add a reversible migration and model field for progress activity.
3. Update activity in the existing locked shelf-update transaction.
4. Implement the dashboard repository, service, validation, controller, and route.
5. Build the dashboard API module, composable, reusable section/card components,
   and route view; update navigation and search links.
6. Verify HTTP boundaries, MySQL filtering/order/counts, progress activity, Vue
   loading/error/empty states, build, proxy, and local browser layout.
7. Document the API and local migration command. Commit, push, and deployment are
   separate user-authorized actions.

## Backend contract

`GET /api/dashboard?limit=4` accepts only `limit`, an integer from 1 to 6, default
4. Invalid or unknown query parameters return the existing 400 JSON error format.
No Open Library metadata request is made by this endpoint. Cover URLs point to
the existing backend cover proxy and images load lazily.

```json
{
  "status": 200,
  "data": {
    "stats": { "total": 10, "wantToRead": 3, "reading": 5, "finished": 2 },
    "continueReading": { "data": [], "meta": { "count": 0, "total": 5, "limit": 4 } },
    "nearlyFinished": { "data": [], "meta": { "count": 0, "total": 0, "limit": 4 } },
    "recentlyFinished": { "data": [], "meta": { "count": 0, "total": 2, "limit": 4 } }
  }
}
```

The example omits list items for readability. Each item reuses the shelf DTO:
`book`, `shelfEntry`, and `progressPercent`. Dashboard book fields are limited to
`id`, `title`, `authors`, `coverId`, and normalized `coverUrl`. Shelf fields include
`id`, `bookId`, `status`, `currentPage`, `totalPages`, `rating`, `startedAt`,
`finishedAt`, `lastProgressAt`, and `createdAt`. `count` is the returned item count;
`total` is all matching items, independent of the list limit. Empty lists return
an empty array and zero counts. Each section can include the same book when its
conditions overlap; this is intentional.

| Section | Eligibility | Order |
| --- | --- | --- |
| Continue reading | `status = reading`, including unknown totals | `COALESCE(lastProgressAt, startedAt, createdAt)` descending, then ID descending |
| Nearly finished | `status = reading`, positive known total, exact ratio >= 0.8 and < 1 | Exact ratio descending, activity descending, then ID descending |
| Recently finished | `status = finished` | Completion date descending, then ID descending |

Filtering, ordering, limits, and totals run in MySQL through Sequelize. Queries
join books directly and stay bounded by the section limit; no per-book database
queries and no loading the whole shelf into JavaScript. Lists and counts are
ordinary read queries, not a transaction snapshot; concurrent edits can briefly
change counts between queries. Reopening the dashboard retrieves current data.

## Data and activity rules

Add nullable `shelf_entries.lastProgressAt` (`DATE`, represented as an ISO timestamp
by the API). Existing rows remain null: historical progress times cannot be
reconstructed accurately from `updatedAt`, which also includes rating/notes edits.
The field is server-managed and rejected in client write payloads.

When an accepted update changes the persisted `currentPage`, set `lastProgressAt`
to the current server time inside the same transaction as status, dates, and
progress. This includes changes caused by marking a known-length book finished.
Repeating the same page, changing a rating/note, or changing status without changing
the page leaves the field unchanged. Adding a book starts at page zero with null
activity and `want_to_read`, as already agreed. Rejected updates do not modify it.

Unknown totals display “Chưa rõ số trang” and do not enter Nearly finished. The
80% threshold uses the exact database ratio, not rounded display percentages.
Displayed percentages are floored so an unfinished 99.9% book never appears as 100%.
Section limits do not paginate; users open the shelf to manage the full list.

## Frontend architecture and interaction

- `views/DashboardPage.vue`: compose header, statistics, and reading sections.
- `modules/dashboard/api/dashboardApi.js`: call the shared `services/api.js` client.
- `modules/dashboard/composables/useDashboard.js`: own request lifecycle, retry,
  loading, errors, and stale-response protection; no writes or global store.
- `modules/dashboard/components/DashboardStats.vue`: display the four counts.
- `modules/dashboard/components/DashboardBookCard.vue`: render cover, metadata,
  progress, remaining pages when known, rating/completion/activity where relevant,
  and a clean link to book detail. No inline editing/deleting.
- `modules/dashboard/components/DashboardSection.vue`: heading, total matching
  count, book list, empty guidance, and link to the shelf.
- `config/messageConfig.js`: dashboard headings, empty/error/loading messages.

One aggregate request loads the page on entry. Loading and retry use the existing
centered viewport spinner. Errors show a red message and retry button; an empty
shelf shows a discovery call to action. Empty individual sections explain how a
book enters that section. Going back from book detail
reloads dashboard data, so progress changes appear immediately.

## Visual design

Keep the established palette and themes: Paper `#f1f4f1`, Surface `#ffffff`, Ink
`#162c29`, Moss `#146b5b`, Line `#d4dfd9`, and Muted `#526b66`; use existing dark
theme tokens rather than hardcoded light surfaces. Times New Roman/Georgia remains
the display font; Segoe UI remains the interface font.

Lead with the user's current reading, not a decorative analytics chart. Covers
and progress are the visual anchors. Use a calm heading with a discovery link,
a compact statistics strip, and a generous Continue reading row.
Nearly finished and Recently finished sit side by side on wide screens. Books are
horizontal rows with constrained covers and left-aligned text. Mobile stacks
sections and keeps navigation compact; titles wrap without pushing actions out.

```text
[ Book icon   Tổng quan   Khám phá   Tủ sách   Theme ]

[ Hành trình của bạn          Tìm sách ]
[ Total | Want to read | Reading | Finished    ]

[ Tiếp tục đọc                         Total ]
[ cover + book + progress ] [ cover + book ... ]

[ Sắp đọc xong           ] [ Vừa hoàn thành    ]
[ cover + book + progress] [ cover + completion]
```

No extra font/library/image dependency is needed. Distinctiveness comes from the
existing book covers and reading activity; avoid generic chart placeholders,
unrelated gradients, and repeated decorative metric cards. Native links/buttons,
visible focus, named progress bars, readable empty/error states, and existing
reduced-motion behavior remain required.

## Acceptance and verification

- A completely empty shelf returns 200 with zero counts and three empty lists.
- Only reading books appear in Continue reading; rating/notes edits do not change
  their activity order, and a genuine progress change does.
- 79/100 is excluded from Nearly finished; 80/100 and 99/100 are included; unknown
  totals, finished books, and want-to-read books are excluded.
- Lists use deterministic tie breaks, obey limits, and report total counts.
- Invalid limit/unknown parameters return 400 before a database query; database
  failures log and return the existing consistent 500 response.
- Dashboard never writes or calls Open Library for metadata.
- Section links reach book detail; back navigation returns to the dashboard.
- Discovery queries/pagination and existing shelf/detail flows still work.
- Test on local services or an isolated temporary MySQL database, not the VPS.

The new migration must be run on the application's local database before using
this feature: `cd D:\bookmg-workspace\bookmg-repo-be` then `npm.cmd run db:migrate`.
Agents may apply migrations to the isolated test database; the user applies this
command to their working database.

## Implemented and verified (2026-10-01)

- Implemented the model/migration, transactional progress timestamp, aggregate
  endpoint, bounded SQL lists, normalized response, counts, and input validation.
- Implemented the dashboard route, API module, composable, cards, sections,
  statistics, responsive navigation, empty/error/loading/retry states, and clean
  navigation back to the originating screen.
- Backend HTTP checks and existing regression tests pass. Isolated MySQL checks
  pass for reversible migrations, boundary filtering, top-N limits, totals,
  unknown page counts, activity ordering, metadata-only edits, and rejected writes.
- Vue tests pass for request loading/empty/error/retry behavior, missing pages,
  clean detail links, and legacy search query redirects. Build and proxy checks pass.
- The application's local migration status reports the new migration as applied;
  the live local dashboard API returns 200.
- Real Edge checks on local services verify desktop, 390px and 320px mobile layouts,
  both color themes, dashboard-to-detail-to-dashboard navigation, and opening a
  reading shelf tab and retaining it after returning from detail. Legacy root
  search URLs redirect to `/discover` with their query preserved.
- No dependencies were added. No commits, pushes, or VPS changes were made for this
  feature. Live UI checks were read-only; business-write checks used the temporary
  MySQL test database.
