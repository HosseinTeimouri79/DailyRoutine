import os
import sqlite3
from pathlib import Path

from flask import g


BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "database" / "hadafino.db"


def resolve_db_path() -> str:
    raw_path = os.getenv("DATABASE_PATH", str(DEFAULT_DB_PATH))
    if raw_path.startswith("./"):
        return str((BASE_DIR / raw_path[2:]).resolve())
    return str(Path(raw_path).resolve())


def get_connection() -> sqlite3.Connection:
    if "db" not in g:
        db_path = resolve_db_path()
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_connection(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def execute(query: str, params=()):
    conn = get_connection()
    cursor = conn.execute(query, params)
    conn.commit()
    return cursor


def query_all(query: str, params=()):
    cursor = get_connection().execute(query, params)
    return [dict(row) for row in cursor.fetchall()]


def query_one(query: str, params=()):
    cursor = get_connection().execute(query, params)
    row = cursor.fetchone()
    return dict(row) if row else None


def ensure_schema():
    conn = sqlite3.connect(resolve_db_path())
    try:
        schema_path = BASE_DIR / "database" / "schema.sql"
        script = schema_path.read_text(encoding="utf-8")
        conn.executescript(script)
        columns = conn.execute("PRAGMA table_info(users)").fetchall()
        column_names = {column[1] for column in columns}
        expected_columns = {
            "id",
            "name",
            "phone",
            "password_hash",
            "profile_image",
            "created_at",
        }
        has_profile_image = any(column[1] == "profile_image" for column in columns)
        has_phone = any(column[1] == "phone" for column in columns)
        has_legacy_columns = bool(column_names - expected_columns)
        if not has_profile_image:
            conn.execute("ALTER TABLE users ADD COLUMN profile_image TEXT")
        if not has_phone:
            conn.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone) WHERE phone IS NOT NULL"
        )

        if has_legacy_columns:
            conn.execute("PRAGMA foreign_keys = OFF")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users_new (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  phone TEXT NOT NULL UNIQUE,
                  password_hash TEXT NOT NULL,
                  profile_image TEXT,
                  created_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
                """
            )
            conn.execute(
                """
                INSERT INTO users_new(id, name, phone, password_hash, profile_image, created_at)
                SELECT
                  id,
                  name,
                  CASE
                    WHEN phone IS NULL OR TRIM(phone) = '' THEN ('090000' || printf('%05d', id))
                    ELSE phone
                  END,
                  password_hash,
                  profile_image,
                  created_at
                FROM users
                """
            )
            conn.execute("DROP TABLE users")
            conn.execute("ALTER TABLE users_new RENAME TO users")
            conn.execute("PRAGMA foreign_keys = ON")
            conn.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone) WHERE phone IS NOT NULL"
            )

        conn.commit()
    finally:
        conn.close()
