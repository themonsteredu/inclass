<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dataDir = dirname(DB_PATH);
    if (!is_dir($dataDir)) {
        if (!mkdir($dataDir, 0770, true) && !is_dir($dataDir)) {
            throw new RuntimeException("데이터 디렉토리를 만들 수 없습니다: {$dataDir}");
        }
    }

    $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');
    db_migrate($pdo);
    return $pdo;
}

function db_migrate(PDO $pdo): void
{
    $pdo->exec(<<<'SQL'
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name          TEXT NOT NULL,
            role          TEXT NOT NULL CHECK(role IN ('STUDENT','ADMIN')) DEFAULT 'STUDENT',
            created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS workbooks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT NOT NULL,
            description TEXT,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS problems (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            workbook_id INTEGER NOT NULL REFERENCES workbooks(id) ON DELETE CASCADE,
            number      INTEGER NOT NULL,
            title       TEXT NOT NULL,
            UNIQUE(workbook_id, number)
        );
        CREATE INDEX IF NOT EXISTS idx_problems_workbook ON problems(workbook_id);

        CREATE TABLE IF NOT EXISTS lectures (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_id  INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
            type        TEXT NOT NULL CHECK(type IN ('TIP','CONCEPT','PATTERN')),
            title       TEXT NOT NULL,
            file_path   TEXT NOT NULL,
            mime_type   TEXT NOT NULL DEFAULT 'video/mp4',
            size_bytes  INTEGER NOT NULL DEFAULT 0,
            duration    INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(problem_id, type)
        );
        CREATE INDEX IF NOT EXISTS idx_lectures_problem ON lectures(problem_id);

        CREATE TABLE IF NOT EXISTS enrollments (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            workbook_id INTEGER NOT NULL REFERENCES workbooks(id) ON DELETE CASCADE,
            granted_at  TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(user_id, workbook_id)
        );
        CREATE INDEX IF NOT EXISTS idx_enroll_user ON enrollments(user_id);
        CREATE INDEX IF NOT EXISTS idx_enroll_wb ON enrollments(workbook_id);

        CREATE TABLE IF NOT EXISTS watch_logs (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            lecture_id        INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
            watched_seconds   INTEGER NOT NULL DEFAULT 0,
            last_position     INTEGER NOT NULL DEFAULT 0,
            completed         INTEGER NOT NULL DEFAULT 0,
            first_watched_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(user_id, lecture_id)
        );
        CREATE INDEX IF NOT EXISTS idx_watch_user ON watch_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_watch_lecture ON watch_logs(lecture_id);
    SQL);
}
