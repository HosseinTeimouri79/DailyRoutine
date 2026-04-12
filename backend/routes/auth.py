import re

from flask import Blueprint, jsonify, request, g

from core.auth import auth_required, generate_token, hash_password, verify_password
from core.db import execute, query_one


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

IRAN_PHONE_REGEX = re.compile(r"^(?:\+98|0)?9\d{9}$")


def normalize_iran_phone(raw_phone: str) -> str:
    phone = (raw_phone or "").strip().replace(" ", "")
    if phone.startswith("+98"):
        phone = "0" + phone[3:]
    elif phone.startswith("98"):
        phone = "0" + phone[2:]
    elif phone.startswith("9"):
        phone = "0" + phone
    return phone


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    phone = normalize_iran_phone(data.get("phone") or "")
    password = data.get("password") or ""

    if not name or not phone or not password:
        return jsonify({"message": "name, phone, password are required"}), 400

    if not IRAN_PHONE_REGEX.fullmatch(phone):
        return jsonify({"message": "phone number is invalid"}), 400

    existing = query_one("SELECT id FROM users WHERE phone = ?", (phone,))
    if existing:
        return jsonify({"message": "phone already exists"}), 409

    password_hash = hash_password(password)
    cursor = execute(
        "INSERT INTO users(name, phone, password_hash) VALUES (?, ?, ?)",
        (name, phone, password_hash),
    )
    user_id = cursor.lastrowid
    token = generate_token(user_id, phone)

    return jsonify(
        {
            "token": token,
            "user": {
                "id": user_id,
                "name": name,
                "phone": phone,
                "profile_image": None,
            },
        }
    )


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    phone = normalize_iran_phone(data.get("phone") or "")
    password = data.get("password") or ""

    if not phone or not password:
        return jsonify({"message": "phone and password are required"}), 400

    if not IRAN_PHONE_REGEX.fullmatch(phone):
        return jsonify({"message": "phone number is invalid"}), 400

    user = query_one(
        "SELECT id, name, phone, password_hash, profile_image FROM users WHERE phone = ?",
        (phone,),
    )
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"message": "invalid credentials"}), 401

    token = generate_token(user["id"], user["phone"])
    return jsonify(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "phone": user["phone"],
                "profile_image": user.get("profile_image"),
            },
        }
    )


@auth_bp.get("/me")
@auth_required
def me():
    user = query_one(
        "SELECT id, name, phone, profile_image FROM users WHERE id = ?",
        (g.user_id,),
    )
    if not user:
        return jsonify({"message": "user not found"}), 404
    return jsonify(user)


@auth_bp.put("/profile")
@auth_required
def update_profile():
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    profile_image = data.get("profile_image")

    if name is not None:
        if not isinstance(name, str):
            return jsonify({"message": "name must be a string"}), 400
        name = name.strip()
        if not name:
            return jsonify({"message": "name is required"}), 400

    if profile_image is not None and not isinstance(profile_image, str):
        return jsonify({"message": "profile_image must be string or null"}), 400

    current_user = query_one(
        "SELECT id, name, phone, profile_image FROM users WHERE id = ?",
        (g.user_id,),
    )
    if not current_user:
        return jsonify({"message": "user not found"}), 404

    next_name = name if name is not None else current_user["name"]
    next_profile_image = (
        profile_image if profile_image is not None else current_user["profile_image"]
    )

    execute(
        "UPDATE users SET name = ?, profile_image = ? WHERE id = ?",
        (next_name, next_profile_image, g.user_id),
    )

    user = query_one(
        "SELECT id, name, phone, profile_image FROM users WHERE id = ?",
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
