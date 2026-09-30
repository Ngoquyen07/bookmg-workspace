# Mini Reading Tracker

Base dự án gồm Vue + Vite và Node.js + Express, dùng JavaScript ES modules.
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
http://127.0.0.1:3000/api/health, trả về `{"data":{"status":"ok"}}`.
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

Frontend gọi API bằng đường dẫn tương đối, ví dụ `fetch('/api/health')`.
Vite chuyển request `/api` tới `API_BASE_URL` khi chạy dev, nên không cần
cài CORS hoặc Axios cho base hiện tại. Các biến này chỉ được Vite đọc ở server;
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

`models/book.js` stores shared book metadata: Open Library work ID (`OL...W`),
title, authors, cover ID, first publication year, description, subjects, total
pages and optional edition ID (`OL...M`). Authors and subjects are JSON arrays.
Unknown page counts are `null`, never zero. Both models include timestamps.

`models/shelfEntry.js` stores shelf membership: ID, book ID, reading status,
current page, optional integer rating (1–5), notes (up to 1,000 characters),
reading start date and completion date. Status values are `want_to_read`,
`reading` and `finished`.

Import models through `models/index.js` to register associations. A book has
zero or one shelf entry in the current single-user application. Each shelf entry
belongs to one book; `bookId` is a unique foreign key. Removing a shelf entry
keeps its book metadata. MySQL rejects deletion of a book still on the shelf.
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

Progress limits against a book's page count, automatic completion, date
transitions and atomic book/shelf creation belong to the upcoming service layer.
Search and detail requests will not create database records; adding to the shelf
will persist them.

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

JSON success responses use `{ "data": ... }`, with optional `meta` for pagination.
Errors use `{ "error": { "code": "...", "message": "..." } }` and the appropriate
HTTP status. The frontend should branch on `error.code`, not message text.
Binary cover responses will use their image content type rather than this JSON envelope.

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

Search parameters: required nonblank `q` (up to 200 characters), optional `field`
(`all`, `title`, or `author`; default `all`), `page` (1–10,000; default 1), and
`limit` (1–50; default 20). Unknown parameters are rejected. `field=all` uses
Open Library's general search; title/author modes use their respective fields.

```json
{
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
  "meta": { "page": 1, "limit": 20, "total": 4063, "totalPages": 204 }
}
```

The response above illustrates the format; search totals and metadata may change.
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
checks with mocked upstream responses and shelf reads. Book detail, edition/page
lookup and shelf CRUD endpoints are not implemented yet.

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
