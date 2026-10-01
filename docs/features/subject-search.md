# Subject search: plan and specification

## Scope and flow

Make each subject displayed in book detail a keyboard-accessible link to discovery.
Example: clicking Magic opens `/discover?q=Magic&field=subject&page=1`.
The discovery form also offers Subject alongside All, Title, and Author.
Each author name in detail also links to discovery with `field=author` and page 1,
reusing the existing author search API. Multiple authors have separate links;
missing author names retain the existing unknown-author text.
Changing pages retains the subject and search mode. Existing loading, empty, error,
cover proxy, and shelf-membership behavior remains unchanged.

## API contract

Reuse `GET /api/books/search?q=Magic&field=subject&page=1&limit=20`.
Allow `subject` in the existing field validator. The query remains required, trimmed,
and limited to 200 characters; pagination and unknown-field validation stay unchanged.
The response keeps `status`, normalized `data`, and pagination/count metadata.

The adapter calls Open Library Search API with a quoted subject phrase:
`q=subject:"Magic"`. Escape backslashes and double quotes inside the user's value
before building the expression, then encode the URL with URLSearchParams. Subject
text must not introduce additional Solr operators. Search uses Open Library's index
matching; it does not promise exact taxonomy membership or complete subject metadata.
No Subjects API adapter, new route, database schema, migration, or persistence is needed.
Search continues to read shelf membership without saving search results.

References: https://openlibrary.org/dev/docs/api/search and
https://openlibrary.org/search/howto.

## Component responsibilities

- BookDetailPage: render existing subject labels as RouterLinks with query/page state.
- SearchPage: accept the subject route mode and retain it during pagination.
- SearchForm: add Subject and update the accessible label and input placeholder.
- Existing backend validation and adapter: validate and translate the new mode.

## Implementation and acceptance

1. Extend backend validation and safely build the subject search expression.
2. Connect detail subject links and discovery form/route handling.
3. Add REST Client examples and update API documentation.
4. Verify subject phrase escaping, pagination, response normalization, invalid modes,
   and the existing title/author behavior with backend tests.
5. Verify subject selection and navigation/pagination with Vue tests; build the FE.
6. Exercise the read-only flow against local services in the real Edge session.

The dashboard checkpoint is committed separately. Changes for this task remain
uncommitted until requested; no push, merge, or deployment is part of this task.

## Verification results

- Backend: all 23 tests pass, including quoted subject escaping, normalized results,
  pagination, and existing validation/error behavior.
- Frontend: 9 tests pass, including detail-to-subject/author navigation, selected search
  mode, next-page retention, and form submission resetting pagination.
- Frontend build and API proxy check pass; Git diff whitespace check passes.
- Local API returned 200 for Magic with normalized results and count metadata.
- Real Edge local flow: clicked Magic on OL82563W detail, reached
  `/discover?q=Magic&field=subject&page=1`, then page 2 with subject mode retained.
- No migrations, application data writes, pushes, or deployment changes.
