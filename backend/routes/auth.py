from flask import Blueprint, jsonify, request

from core.auth import generate_token, hash_password, verify_password
from core.db import execute, query_one


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"message": "name, email, password are required"}), 400

    existing = query_one("SELECT id FROM users WHERE email = ?", (email,))
    if existing:
        return jsonify({"message": "email already exists"}), 409

    password_hash = hash_password(password)
    cursor = execute(
        "INSERT INTO users(name, email, password_hash) VALUES (?, ?, ?)",
        (name, email, password_hash),
    )
    user_id = cursor.lastrowid
    token = generate_token(user_id, email)

    return jsonify(
        {
            "token": token,
            "user": {"id": user_id, "name": name, "email": email},
        }
    )


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    user = query_one(
        "SELECT id, name, email, password_hash FROM users WHERE email = ?",
        (email,),
    )
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"message": "invalid credentials"}), 401

    token = generate_token(user["id"], user["email"])
    return jsonify(
        {
            "token": token,
            "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
        }
    )
