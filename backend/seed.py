from core.auth import hash_password
from core.db import ensure_schema, resolve_db_path

import sqlite3


def run_seed():
    ensure_schema()
    conn = sqlite3.connect(resolve_db_path())
    demo_phone = "09123456789"
    try:
        cursor = conn.execute("SELECT id FROM users WHERE phone = ?", (demo_phone,))
        if cursor.fetchone():
            print("Seed already exists")
            return

        password_hash = hash_password("123456")
        conn.execute(
            "INSERT INTO users(name, phone, password_hash) VALUES (?, ?, ?)",
            ("Demo User", demo_phone, password_hash),
        )
        conn.commit()
        print(f"Seed done: {demo_phone} / 123456")
    finally:
        conn.close()


if __name__ == "__main__":
    run_seed()
