# Mini Reading Tracker

Ứng dụng theo dõi sách gồm Vue + Vite và Node.js + Express, dùng JavaScript ES modules.
Yêu cầu Node.js >= 22.12.0 và npm.

## Chạy local

Mở hai terminal tại workspace.

Backend:

```powershell
cd bookmg-repo-be
npm install
Copy-Item .env.example .env
npm run dev
```

Backend chạy ở http://127.0.0.1:3000. Kiểm tra bằng
http://127.0.0.1:3000/api/health, trả về `{"status":200,"data":{"status":"ok"}}`.
Host và cổng được lấy từ `BASE_URL` trong `bookmg-repo-be/.env`.

Frontend:

```powershell
cd bookmg-repo-fe
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend chạy ở http://127.0.0.1:5173. Host và cổng được lấy từ `BASE_URL`
trong `bookmg-repo-fe/.env`. `API_BASE_URL` trong cùng file trỏ đến backend
và phải bằng `BASE_URL` trong `.env` của backend.

Frontend gọi API bằng Axios với đường dẫn tương đối, ví dụ `/api/books/search`.
Vite chuyển request `/api` tới `API_BASE_URL` khi chạy dev, nên không cần
thiết lập CORS cho môi trường dev hiện tại. Các biến này chỉ được Vite đọc ở server;
không cần đưa URL backend vào bundle trình duyệt.

`.env` local đã được tạo; khi clone mới, copy từ `.env.example`.
Chỉ chạy lệnh copy khi chưa có `.env` để tránh ghi đè cấu hình riêng.
Sau khi đổi `.env`, khởi động lại server tương ứng.

## Build và start

- Frontend: `npm run build` tạo `dist/`; `npm run preview` xem bản build local.
- Backend: `npm start` chạy server không bật watch.
- Kiểm tra kết nối FE → BE: chạy `npm run check:api` trong `bookmg-repo-fe`
  (dùng cổng test 15173 và 13000).
- Proxy của Vite chỉ dùng cho dev. Khi deploy cần cấu hình route `/api` tới backend.

## Frontend

Frontend dùng Vue Router cho ba trang: `/` tìm sách, `/books/:workId` chi tiết
và `/shelf` tủ sách. Mã nguồn chia theo tính năng trong `src/features/books` và
`src/features/shelf`: mỗi tính năng có `api`, `pages`, `components` và validation
khi cần. `src/shared/api/http.js` là Axios client chung; `src/shared/components`
chứa component dùng ở nhiều trang. `src/app` chứa router và header. Giao diện
dùng Tailwind CSS 4. Không cần đăng nhập hoặc Pinia store cho phạm vi một người dùng.

Tìm kiếm giữ từ khóa, trường tìm kiếm và trang trong URL. Khi thêm sách từ kết quả,
frontend đọc chi tiết để lấy edition gợi ý trước khi gửi `POST /api/shelf`; dữ liệu
và ảnh luôn đi qua backend. Trang tủ sách dùng dữ liệu và thống kê MySQL; số trang
không rõ được hiển thị là `?` và không tính phần trăm. FE kiểm tra form trước khi
gửi; BE vẫn là nơi thực thi các quy tắc nghiệp vụ.

Chạy `npm test` trong `bookmg-repo-fe` để kiểm tra validation, `npm run check:api`
để kiểm tra proxy FE → BE, và `npm run build` để tạo bản production. Khi deploy,
web server phải chuyển `/api` về backend và trả `index.html` cho các route FE.

## MySQL qua Sequelize

Backend đã cài Sequelize 6 và driver `mysql2`. Kết nối dùng chung nằm ở
`bookmg-repo-be/config/database.js`.

Thêm cấu hình sau vào `bookmg-repo-be/.env`, thay tên database, tài khoản và
mật khẩu bằng thông tin MySQL của bạn. Database phải tồn tại trước khi kết nối.
Không ghi đè các cấu hình `.env` đã có.

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bookmg
DB_USER=root
DB_PASSWORD=
```

Kiểm tra kết nối từ thư mục backend:

```powershell
npm run db:check
```

Khi tạo model, import kết nối này và khai báo các cột bằng `DataTypes` của
`sequelize`; gọi `Model.create()`, `Model.findAll()`, `Model.update()` hoặc
`Model.destroy()` để thao tác dữ liệu qua ORM.
Hướng dẫn: https://sequelize.org/docs/v6/core-concepts/model-basics/

Đã có model và migration cho `books` và `shelf_entries`, API health, tìm kiếm sách và proxy ảnh bìa.
Lệnh `db:check` chỉ kiểm tra kết nối, không tạo hay sửa bảng.
Git quản lý tại workspace;
hai thư mục con không có `.git` riêng. Không commit `.env` hoặc secrets.

## Book and shelf schema

`models/book.js` stores book metadata: Open Library work ID (`OL...W`),
title, authors, cover ID, first publication year, description and subjects.
Authors and subjects are JSON arrays.
Unknown page counts are `null`, never zero. Both models include timestamps.

`models/shelfEntry.js` stores shelf membership: ID, book ID, reading status,
current page, optional edition ID (`OL...M`) and total pages, optional integer
rating (1–5), notes (up to 1,000 characters),
reading start date and completion date. Status values are `want_to_read`,
`reading` and `finished`.

Import models through `models/index.js` to register associations. A book has
zero or one shelf entry in the current single-user application. Each shelf entry
belongs to one book; `bookId` is a unique foreign key. Removing a book from the
shelf deletes both rows in a transaction. MySQL rejects deletion of a book
while its shelf entry still exists.
There is no user model or authentication in this scope.

Run these commands from `bookmg-repo-be`:

```powershell
npm run db:migrate
npm run db:migrate:status
npm test
npm run db:test
```

`db:migrate` applies versioned schema changes to `DB_NAME` configured in `.env`.
Starting the server does not run migrations or synchronize tables automatically.
MySQL 8.0.16 or newer is required to enforce the CHECK constraints.
`npm test` covers model validation without connecting to MySQL. `db:test` checks
migrations, persistence, constraints and rollback in a randomly named temporary
database, then deletes that database. Its account needs CREATE/DROP DATABASE
privileges; it does not change the application database.

Search requests do not create database records; adding to the shelf persists
both records in one transaction. Shelf updates validate progress and change
reading dates in a transaction.

## Backend entrypoints and environment

The backend uses root `app.js` for Express middleware/routes and root `server.js`
for startup. `config/env.js` loads the backend `.env` with dotenv, preserving
environment variables supplied by the shell or deployment platform.
`config/database.js` exports the shared Sequelize connection. Startup verifies
MySQL before opening the HTTP port; it does not create or alter tables.

Run `npm run dev` for watch mode, `npm start` for normal startup,
`npm run db:check` to verify MySQL, and `npm test` for backend checks.
The frontend proxy check starts `app.js` independently of MySQL; it verifies HTTP
routing, while `db:check` verifies the real configured database connection.

## Backend logs

Backend logs are written asynchronously to `bookmg-repo-be/logs/YYYY-MM-DD.log`
and printed to the terminal. Each line is a JSON record with a UTC timestamp,
level, message and context. Logs include startup/shutdown, completed HTTP requests
and HTTP errors. Request bodies, headers and query strings are not logged;
sensitive context keys are redacted. The logs directory is ignored by Git.
Daily files are retained until removed; automatic retention is not configured.

## API response contract

JSON success responses use `{ "status": 200, "data": ... }`, with optional
`meta` for list counts and pagination. Errors use `{ "status": 400, "error": { "code": "...",
"message": "..." } }`. The numeric `status` always matches the HTTP status
(for example, 201 for creation or 409 for a duplicate). The frontend should
branch on `error.code`, not message text. Binary cover responses remain JPEG;
their status is available as the HTTP `Response.status` value.

`constants/responseConstants.js` defines status codes and public errors;
`constants/logConstants.js` defines log levels and operational messages.
Controllers use explicit `try/catch` to log failures and send responses through
`utils/apiResponse.js`. Expected application errors use `utils/apiError.js` and
the predefined public descriptors; unexpected failures remain generic 500
responses. `app.js` catches JSON parser errors before routing. There is no custom
global error middleware. Service/repository operations must be awaited inside
the controller's try block; add the same explicit boundary to each new controller.
The adapter catches upstream errors and rethrows typed application errors.
Startup also catches database configuration/import and connection errors; shutdown
attempts database cleanup even if closing the HTTP listener fails.

Services and repositories also catch failures at their operation boundaries,
call `logger.logError(error, operation)`, then rethrow the same error. The helper
records safe diagnostics at the first failing layer and avoids duplicate error
records as that error crosses layers. HTTP completion logs still record the
request path and status. Use the optional third argument for request context
when the error originates in a controller or request parser.

```js
catch (error) {
  logger.logError(error, 'bookController.searchBooks', req)
  return sendError(res, error)
}
```

`sendError` resolves typed application errors, parser errors and unexpected
failures into the public response contract; it does not log or catch operations.

## Book search API

For manual testing in VS Code, install REST Client and open
`bookmg-repo-be/requests/books.http`. Start the backend with `npm run dev`, then
click **Send Request** above an individual request (or press `Ctrl+Alt+R`).
Set the file's `baseUrl` to match the backend's `BASE_URL`; update `coverId` from
a search response when testing covers. The file contains only read-only requests.

The request flow is router → controller → service → Open Library adapter, with
a repository read for shelf membership. No search or cover request creates books
or shelf entries. Native Node.js `fetch` calls fixed upstream hosts with a
10-second deadline, including response body consumption.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/books/search?q=Harry%20Potter&page=1&limit=20` | Search books and mark existing shelf entries |
| GET | `/api/books/covers/15155833` | Proxy a medium JPEG cover through the backend |
| GET | `/api/books/OL82563W` | Read normalized work details and a suggested edition with a page count |

Search parameters: required nonblank `q` (up to 200 characters), optional `field`
(`all`, `title`, or `author`; default `all`), `page` (1–10,000; default 1), and
`limit` (1–50; default 20). Unknown parameters are rejected. `field=all` uses
Open Library's general search; title/author modes use their respective fields.

```json
{
  "status": 200,
  "data": [
    {
      "id": "OL82563W",
      "title": "Harry Potter and the Philosopher's Stone",
      "authors": ["J. K. Rowling"],
      "coverId": 15155833,
      "coverUrl": "/api/books/covers/15155833",
      "firstPublishYear": 1997,
      "isInShelf": false
    }
  ],
  "meta": { "page": 1, "limit": 20, "count": 1, "total": 4063, "totalPages": 204 }
}
```

The response above illustrates the format; search totals and metadata may change.
`meta.count` is the number of books in this page; `meta.total` is the number
of matches across all pages.
Missing authors become `[]`; missing cover/year values become `null`.
The frontend uses the returned relative `coverUrl`, with a local placeholder if
it is null or the cover is unavailable. Successful covers have a one-day browser
cache lifetime. No backend search cache or automatic retries are implemented.

Invalid input returns 400 `VALIDATION_ERROR`, missing covers return 404
`COVER_NOT_FOUND`, upstream HTTP/network/invalid-response failures return 502
`OPEN_LIBRARY_ERROR`, and upstream deadlines return 504 `OPEN_LIBRARY_TIMEOUT`.
Shelf lookup failures return 500 instead of reporting incorrect membership.
The adapter identifies the application as `MiniReadingTracker/1.0`; a contact
identifier and traffic controls remain to be configured before frequent use.
See the official [search API](https://openlibrary.org/dev/docs/api/search),
[covers API](https://openlibrary.org/dev/docs/api/covers), and
[usage guidelines](https://openlibrary.org/developers/api).

Run `npm test` in the backend for HTTP, normalization, validation and failure
checks with mocked upstream responses and shelf reads. `npm run db:test` checks
the add-to-shelf transaction against a temporary MySQL database.

## Add a book to the shelf

`POST /api/shelf` accepts a work ID, optional initial status (`want_to_read`,
`reading`, `finished`; default `want_to_read`) and optional edition ID:

```json
{"workId":"OL82563W","editionId":"OL62514708M","status":"reading"}
```

The backend reads work metadata and author names from Open Library. If an edition
is supplied, it checks that the edition belongs to the work and reads its page
count. Without an edition, total pages remain `null`. External requests finish
before the database transaction. The transaction reuses an existing book when
present and creates one shelf entry; failures roll back both writes. A duplicate
entry returns 409. Invalid input or an unrelated edition returns 400, a missing
work returns 404, and upstream failures return 502/504. A successful add returns
201 with `data.book` and `data.shelfEntry`. See `requests/shelf.http` for manual
requests. Run `npm run db:migrate` before using this endpoint.

## Book details and shelf reads

`GET /api/books/:workId` validates an Open Library work ID and returns work
metadata, a relative `coverUrl`, `isInShelf`, `editionId`, and `totalPages`.
For a book already in the shelf, the edition and page count come from its saved
shelf entry. Otherwise, the backend checks the first 50 Open Library editions
and suggests the first one with a valid page count. That page count belongs to
the returned `editionId`, not to every edition of the work. If none is found,
both fields are `null`. The endpoint only reads data; the frontend may send
the suggested `editionId` to `POST /api/shelf`. Invalid IDs or query parameters
return 400; missing works return 404.

`GET /api/shelf` returns shelf entries newest first in pages of 10. Optional
`status` can be `want_to_read`, `reading`, or `finished`; `page` defaults to 1
(maximum 10,000) and `limit` defaults to 10 (maximum 50). Invalid query
parameters return 400. Each item has `{ book, shelfEntry, progressPercent }`.
The book includes a relative `coverUrl`. `progressPercent` is rounded to the
nearest integer when `totalPages` is known, and `null` otherwise. An empty
shelf or filter returns `data: []` and `meta: { page, limit, count: 0, total: 0,
totalPages: 0 }`. `meta.count` is the number of items on this page; `meta.total`
is the number matching the status filter. `GET /api/shelf/:bookId` returns one
entry in the same item shape for the detail screen, or 404 if it is absent.

`GET /api/shelf/stats` returns `{ "status": 200, "data": { "total": 0,
"wantToRead": 0, "reading": 0, "finished": 0 } }` for an empty shelf and the corresponding
counts otherwise. It rejects query parameters with 400. Both shelf reads use
MySQL only; they do not call Open Library. Try them with `requests/shelf.http`.

## Update or remove a shelf book

`PATCH /api/shelf/:bookId` accepts one or more of `currentPage` (integer from
zero through the known total), `status` (`want_to_read`, `reading`, `finished`),
`rating` (integer 1–5 or `null` to clear), and `notes` (up to 1,000 characters
or `null` to clear). Other fields, empty bodies, and invalid work IDs return 400.
The response's `data` is the updated shelf entry. Updates use a row lock and
transaction so page, status, and reading dates change together.

When the page is above zero but below a known total, status becomes `reading`.
When it reaches the total, status becomes `finished` and `finishedAt` is set.
Setting status to `finished` without a page sets the page to the known
total; sending a conflicting lower page returns 400. Lowering the page of a
finished book without specifying a status changes it back to `reading` and
clears `finishedAt`. The first transition to `reading` sets `startedAt`, which
is preserved thereafter. Without a known total, `currentPage` cannot be
updated, but status, rating, and notes can be changed. The user can explicitly
choose `finished`; unknown page counts still yield `progressPercent: null`.

`DELETE /api/shelf/:bookId` removes the shelf entry, then its book metadata in
one transaction, and returns
`{ "status": 200, "data": { "bookId": "OL...W", "removed": true } }`.
If either deletion fails, both are rolled back. Adding the work again creates
new rows in both tables. Both endpoints return 404 `SHELF_ENTRY_NOT_FOUND`
when the work is not in the shelf. The
frontend must ask for confirmation before sending the DELETE request.

## GitHub workflow

Use short-lived task branches from `main`, Conventional Commit messages, and pull
requests targeting `main`. Prefer squash merges and delete merged branches.
See `AGENTS.md` and `.agents/skills/bookmg-git-workflow/SKILL.md` for agent routing
and the repository's Git conventions.

GitHub Actions runs frontend build and the frontend-to-backend proxy test on Node 22.
The check is named `Build and API checks`; it uses explicit test URLs, requires no
production secrets, and does not yet test database business logic.
Once CI has run on GitHub, use that check when protecting `main`. Repository merge
settings and branch protection must also be configured on GitHub; local workflow
files alone do not enforce them.
