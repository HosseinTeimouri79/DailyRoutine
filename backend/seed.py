from core.auth import hash_password
from core.db import ensure_schema, resolve_db_path

import sqlite3


def run_seed():
    ensure_schema()
    conn = sqlite3.connect(resolve_db_path())
    try:
        cursor = conn.execute("SELECT id FROM users WHERE email = ?", ("demo@routin.app",))
        if cursor.fetchone():
            print("Seed already exists")
            return

        password_hash = hash_password("123456")
        conn.execute(
            "INSERT INTO users(name, email, password_hash) VALUES (?, ?, ?)",
            ("Demo User", "demo@routin.app", password_hash),
        )
        conn.commit()
        print("Seed done: demo@routin.app / 123456")
    finally:
        conn.close()


if __name__ == "__main__":
    run_seed()
