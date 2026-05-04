import os
import re

from flask import Blueprint, jsonify, request, g

from core.auth import auth_required, generate_token, hash_password, verify_password
from core.db import execute, query_one
from core.date_utils import normalize_date_to_iso, parse_iso_date_to_timestamp


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

IRAN_PHONE_REGEX = re.compile(r"^(?:\+98|0)?9\d{9}$")
ALLOWED_GENDERS = {"male", "female", "other"}
ALLOWED_CALENDAR_TYPES = {"jalali", "gregorian"}


def normalize_iran_phone(raw_phone: str) -> str:
    phone = (raw_phone or "").strip().replace(" ", "")
    if phone.startswith("+98"):
        phone = "0" + phone[3:]
    elif phone.startswith("98"):
        phone = "0" + phone[2:]
    elif phone.startswith("9"):
        phone = "0" + phone
    return phone


ADMIN_PHONES = {
    normalize_iran_phone(value)
    for value in os.getenv("ADMIN_PHONES", "").split(",")
    if value.strip()
}


def is_admin_phone(phone: str) -> bool:
    return phone in ADMIN_PHONES


def normalize_gender(raw_gender):
    if raw_gender is None:
        return None
    gender = str(raw_gender).strip().lower()
    if not gender:
        return None
    return gender if gender in ALLOWED_GENDERS else None


def normalize_calendar_type(raw_calendar_type):
    if raw_calendar_type is None:
        return None

    value = str(raw_calendar_type).strip().lower()
    if not value:
        return "jalali"

    aliases = {
        "jalali": "jalali",
        "shamsi": "jalali",
        "persian": "jalali",
        "gregorian": "gregorian",
        "miladi": "gregorian",
    }
    normalized = aliases.get(value)
    return normalized if normalized in ALLOWED_CALENDAR_TYPES else None


def build_user_response(user):
    if not user:
        return None
    return {
        "id": user["id"],
        "name": user["name"],
        "phone": user["phone"],
        "profile_image": user.get("profile_image"),
        "date_of_birth": normalize_date_to_iso(user.get("date_of_birth")),
        "calendar_type": user.get("calendar_type") or "jalali",
        "gender": user.get("gender"),
        "is_admin": bool(user.get("is_admin")),
    }


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    phone = normalize_iran_phone(data.get("phone") or "")
    password = data.get("password") or ""
    date_of_birth = data.get("date_of_birth")
    calendar_type = data.get("calendar_type")
    gender = data.get("gender")

    if not name or not phone or not password:
        return jsonify({"message": "name, phone, password are required"}), 400

    if not IRAN_PHONE_REGEX.fullmatch(phone):
        return jsonify({"message": "phone number is invalid"}), 400

    existing = query_one("SELECT id FROM users WHERE phone = %s", (phone,))
    if existing:
        return jsonify({"message": "phone already exists"}), 409

    date_of_birth_ts = None
    if date_of_birth is not None and str(date_of_birth).strip() != "":
        date_of_birth_ts = parse_iso_date_to_timestamp(date_of_birth)
        if date_of_birth_ts is None:
            return jsonify({"message": "date_of_birth must be a valid YYYY-MM-DD date"}), 400

    gender_value = None
    if gender is not None:
        gender_value = normalize_gender(gender)
        if gender is None or (gender_value is None and str(gender).strip() != ""):
            return jsonify({"message": "gender must be male, female or other"}), 400

    calendar_type_value = "jalali"
    if calendar_type is not None:
        calendar_type_value = normalize_calendar_type(calendar_type)
        if calendar_type_value is None:
            return jsonify({"message": "calendar_type must be jalali or gregorian"}), 400

    password_hash = hash_password(password)
    is_admin = 1 if is_admin_phone(phone) else 0
    cursor = execute(
        "INSERT INTO users(name, phone, password_hash, profile_image, date_of_birth, calendar_type, gender, is_admin) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (
            name,
            phone,
            password_hash,
            None,
            date_of_birth_ts,
            calendar_type_value,
            gender_value,
            is_admin,
        ),
    )
    user_id = cursor.fetchone()["id"]
    token = generate_token(user_id, phone, is_admin)

    return jsonify(
        {
            "token": token,
            "user": {
                "id": user_id,
                "name": name,
                "phone": phone,
                "profile_image": None,
                "date_of_birth": normalize_date_to_iso(date_of_birth_ts),
                "calendar_type": calendar_type_value,
                "gender": gender_value,
                "is_admin": bool(is_admin),
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
        "SELECT id, name, phone, password_hash, profile_image, date_of_birth, calendar_type, gender, is_admin FROM users WHERE phone = %s",
        (phone,),
    )
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"message": "invalid credentials"}), 401

    token = generate_token(user["id"], user["phone"], user.get("is_admin"))
    return jsonify(
        {
            "token": token,
            "user": build_user_response(user),
        }
    )


@auth_bp.get("/me")
@auth_required
def me():
    user = query_one(
        "SELECT id, name, phone, profile_image, date_of_birth, calendar_type, gender, is_admin FROM users WHERE id = %s",
        (g.user_id,),
    )
    if not user:
        return jsonify({"message": "user not found"}), 404
    return jsonify(build_user_response(user))


@auth_bp.put("/profile")
@auth_required
def update_profile():
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    profile_image = data.get("profile_image")
    date_of_birth = data.get("date_of_birth")
    calendar_type = data.get("calendar_type")
    gender = data.get("gender")

    if name is not None:
        if not isinstance(name, str):
            return jsonify({"message": "name must be a string"}), 400
        name = name.strip()
        if not name:
            return jsonify({"message": "name is required"}), 400

    if profile_image is not None and not isinstance(profile_image, str):
        return jsonify({"message": "profile_image must be string or null"}), 400

    date_of_birth_ts = None
    if date_of_birth is not None:
        if str(date_of_birth).strip() == "":
            date_of_birth_ts = None
        else:
            date_of_birth_ts = parse_iso_date_to_timestamp(date_of_birth)
            if date_of_birth_ts is None:
                return jsonify({"message": "date_of_birth must be a valid YYYY-MM-DD date"}), 400

    gender_value = None
    if gender is not None:
        gender_value = normalize_gender(gender)
        if gender_value is None and str(gender).strip() != "":
            return jsonify({"message": "gender must be male, female or other"}), 400

    calendar_type_value = None
    if calendar_type is not None:
        calendar_type_value = normalize_calendar_type(calendar_type)
        if calendar_type_value is None:
            return jsonify({"message": "calendar_type must be jalali or gregorian"}), 400

    current_user = query_one(
        "SELECT id, name, phone, profile_image, date_of_birth, calendar_type, gender, is_admin FROM users WHERE id = %s",
        (g.user_id,),
    )
    if not current_user:
        return jsonify({"message": "user not found"}), 404

    next_name = name if name is not None else current_user["name"]
    next_profile_image = (
        profile_image if profile_image is not None else current_user["profile_image"]
    )
    next_date_of_birth = (
        date_of_birth_ts if date_of_birth is not None else current_user.get("date_of_birth")
    )
    next_calendar_type = (
        calendar_type_value if calendar_type is not None else current_user.get("calendar_type")
    )
    next_gender = gender_value if gender is not None else current_user.get("gender")

    execute(
        "UPDATE users SET name = %s, profile_image = %s, date_of_birth = %s, calendar_type = %s, gender = %s WHERE id = %s",
        (
            next_name,
            next_profile_image,
            next_date_of_birth,
            next_calendar_type,
            next_gender,
            g.user_id,
        ),
    )

    user = query_one(
        "SELECT id, name, phone, profile_image, date_of_birth, calendar_type, gender, is_admin FROM users WHERE id = %s",
        (g.user_id,),
    )
    return jsonify(build_user_response(user))


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
        "SELECT id, password_hash FROM users WHERE id = %s",
        (g.user_id,),
    )
    if not user:
        return jsonify({"message": "user not found"}), 404

    if not verify_password(current_password, user["password_hash"]):
        return jsonify({"message": "current password is incorrect"}), 400

    execute(
        "UPDATE users SET password_hash = %s WHERE id = %s",
        (hash_password(new_password), g.user_id),
    )

    return jsonify({"message": "password changed"})
