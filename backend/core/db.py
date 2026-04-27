import os
import time

import psycopg2
import psycopg2.extras
from flask import g
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

DB_CONNECT_RETRIES = int(os.getenv("DB_CONNECT_RETRIES", "20"))
DB_CONNECT_DELAY = float(os.getenv("DB_CONNECT_DELAY", "1.5"))


def resolve_db_url() -> str:
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url

    db_host = os.getenv("DATABASE_HOST", "postgres")
    db_port = os.getenv("DATABASE_PORT", "5432")
    db_name = os.getenv("DATABASE_NAME", "hadafino")
    db_user = os.getenv("DATABASE_USER", "hadafino")
    db_password = os.getenv("DATABASE_PASSWORD", "change-me")
    return (
        f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    )


def get_connection() -> psycopg2.extensions.connection:
    if "db" not in g:
        g.db = _connect_with_retry()
        g.db.autocommit = False
    return g.db


def _connect_with_retry():
    db_url = resolve_db_url()
    last_error = None

    for attempt in range(1, DB_CONNECT_RETRIES + 1):
        try:
            return psycopg2.connect(
                db_url,
                cursor_factory=psycopg2.extras.RealDictCursor,
            )
        except psycopg2.OperationalError as error:
            last_error = error
            if attempt == DB_CONNECT_RETRIES:
                raise
            time.sleep(DB_CONNECT_DELAY)

    raise last_error


def close_connection(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def execute(query: str, params=()):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    return cursor


def query_all(query: str, params=()):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]


def query_one(query: str, params=()):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    row = cursor.fetchone()
    return dict(row) if row else None


def ensure_schema():
    conn = _connect_with_retry()
    try:
        schema_path = BASE_DIR / "database" / "schema.sql"
        script = schema_path.read_text(encoding="utf-8")
        with conn.cursor() as cursor:
            cursor.execute(script)
        conn.commit()
    finally:
        conn.close()
