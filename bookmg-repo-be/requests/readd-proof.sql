-- Run these read-only queries after each HTTP request in readd-proof.http.
-- Keep this work ID equal to @workId in the HTTP file.
SET @work_id = 'OL45804W';

SELECT COUNT(*) AS books_count FROM books WHERE id = @work_id;
SELECT COUNT(*) AS shelf_entries_count FROM shelf_entries WHERE bookId = @work_id;

SELECT id, title, createdAt FROM books WHERE id = @work_id;
SELECT id, bookId, status, createdAt FROM shelf_entries WHERE bookId = @work_id;
