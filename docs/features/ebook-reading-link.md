# Ebook reading link

## Scope and contract

- Show an external ebook link on book details only when `readingUrl` is present. Hide the entire section, including its label, otherwise.
- Resolve links on the backend through Open Library Read API using the selected edition ID. Accept only exact edition/work matches with `full access` or `lendable` status. Never silently replace the edition used for progress with another readable edition.
- Normalize URLs to HTTPS and allow only `openlibrary.org`, `www.openlibrary.org`, `archive.org`, or `www.archive.org`, without credentials. Maximum length: 2048 characters.
- Use neutral wording: “Xem bản ebook”, because the destination can require borrowing. Open a new tab with `noopener noreferrer`. Progress remains manually entered.
- Add nullable `books.readingUrl`; no edition table or new dependencies. Stored links are snapshots, not guarantees of continuing availability.

## Backend plan

1. Add a reversible migration and model field; old rows remain null.
2. Add Read API URL constant and adapter lookup. Missing edition, no match, restricted/unavailable items, invalid URLs, malformed responses, and upstream errors yield null. Log upstream failures through the existing logger.
3. Detail: get work and shelf information; use the saved link if present, otherwise resolve from the saved/suggested edition. No database writes on GET.
4. Add: validate the selected edition (or suggest one when omitted), resolve the link server-side, and persist book metadata and shelf data in the existing transaction. Never accept a client-provided reading URL.
   An omitted edition now uses the same suggestion strategy as details; persist its ID and page count. If no edition has pages, retain the first valid edition with a null page count so an ebook can still be found.
5. Existing book reuse refreshes `readingUrl` in the same transaction. Failed shelf creation rolls back that update too.

## Frontend plan

- `BookDetailPage` composes a small `EbookLink` component with a nullable URL prop.
- `EbookLink` owns the conditional label/link markup; it has no state or API calls. New copy lives in `messageConfig.js`.
- No requests for ebooks on search/list pages and no ebook viewer.

## Verification and rollout

- Backend: exact/work matching, safe URLs, no-match/errors, read-only details, persistence and transaction rollback.
- Frontend: link and label appear together, disappear on null, correct new-tab attributes; existing tests and build pass.
- Run isolated MySQL checks, not migrations against the working database. User runs `npm run db:migrate` before restarting local BE.
- Do not commit, push, merge, or deploy as part of implementation.
