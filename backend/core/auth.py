from datetime import datetime, timedelta, timezone
import os

import bcrypt
import jwt
from flask import jsonify, request, g


JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
JWT_EXPIRES_DAYS = int(os.getenv("JWT_EXPIRES_DAYS", "7"))


def hash_password(raw_password: str) -> str:
    return bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(raw_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(raw_password.encode("utf-8"), password_hash.encode("utf-8"))


def generate_token(user_id: int, email: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRES_DAYS)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expires_at,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def auth_required(handler):
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"message": "Unauthorized"}), 401

        token = header.replace("Bearer ", "", 1).strip()
        try:
            payload = decode_token(token)
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401

        g.user_id = payload.get("sub")
        g.user_email = payload.get("email")
        return handler(*args, **kwargs)

    wrapped.__name__ = handler.__name__
    return wrapped
