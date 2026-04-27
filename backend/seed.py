from core.auth import hash_password
from core.db import ensure_schema, execute, query_one


def run_seed():
    ensure_schema()
    demo_phone = "09123456789"
    existing = query_one("SELECT id FROM users WHERE phone = %s", (demo_phone,))
    if existing:
        print("Seed already exists")
        return

    password_hash = hash_password("123456")
    cursor = execute(
        "INSERT INTO users(name, phone, password_hash) VALUES (%s, %s, %s) RETURNING id",
        ("Demo User", demo_phone, password_hash),
    )
    inserted = cursor.fetchone()
    if inserted:
        print(f"Seed done: {demo_phone} / 123456")
    else:
        print("Seed failed")


if __name__ == "__main__":
    run_seed()
