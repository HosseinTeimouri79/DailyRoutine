from flask import Blueprint, jsonify, request, g

from core.auth import auth_required, generate_token, hash_password, verify_password
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
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "profile_image": None,
            },
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
        "SELECT id, name, email, password_hash, profile_image FROM users WHERE email = ?",
        (email,),
    )
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"message": "invalid credentials"}), 401

    token = generate_token(user["id"], user["email"])
    return jsonify(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "profile_image": user.get("profile_image"),
            },
        }
    )


@auth_bp.get("/me")
@auth_required
def me():
    user = query_one(
        "SELECT id, name, email, profile_image FROM users WHERE id = ?",
        (g.user_id,),
    )
    if not user:
        return jsonify({"message": "user not found"}), 404
    return jsonify(user)


@auth_bp.put("/profile")
@auth_required
def update_profile():
    data = request.get_json(silent=True) or {}
    profile_image = data.get("profile_image")

    if profile_image is not None and not isinstance(profile_image, str):
        return jsonify({"message": "profile_image must be string or null"}), 400

    execute(
        "UPDATE users SET profile_image = ? WHERE id = ?",
        (profile_image, g.user_id),
    )

    user = query_one(
        "SELECT id, name, email, profile_image FROM users WHERE id = ?",
        (g.user_id,),
    )
    return jsonify(user)


@auth_bp.post("/change-password")
@auth_required
def change_password():
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not current_password or not new_password:
        return jsonify({"message": "current_password and new_password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"message": "new password must be at least 6 characters"}), 400

    user = query_one(
        "SELECT id, password_hash FROM users WHERE id = ?",
        (g.user_id,),
    )
    if not user:
        return jsonify({"message": "user not found"}), 404

    if not verify_password(current_password, user["password_hash"]):
        return jsonify({"message": "current password is incorrect"}), 400

    execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (hash_password(new_password), g.user_id),
    )

    return jsonify({"message": "password changed"})
