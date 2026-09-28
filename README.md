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
http://127.0.0.1:3000/api/health, trả về `{"status":"ok"}`.
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
`bookmg-repo-be/src/database.js`.

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

Chưa tạo bảng/model nghiệp vụ; server hiện tại vẫn chỉ có API health.
Lệnh `db:check` chỉ kiểm tra kết nối, không tạo hay sửa bảng.
Git quản lý tại workspace;
hai thư mục con không có `.git` riêng. Không commit `.env` hoặc secrets.

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
