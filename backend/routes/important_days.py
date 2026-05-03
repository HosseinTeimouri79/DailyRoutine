from flask import Blueprint, jsonify, request, g
import re

from core.auth import auth_required
from core.db import execute, query_all
from core.date_utils import parse_iso_date_to_timestamp

important_days_bp = Blueprint("important_days", __name__, url_prefix="/api/important-days")

TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


@important_days_bp.get("")
@auth_required
def list_important_days():
    rows = query_all(
        """
        SELECT id, title, description,
          TO_CHAR(TO_TIMESTAMP(event_date), 'YYYY-MM-DD') AS date,
          event_time AS time,
          icon,
          icon_color,
          created_at, updated_at
        FROM important_days
        WHERE user_id = %s
        ORDER BY updated_at DESC, id DESC
        """,
        (g.user_id,),
    )
    return jsonify(rows)


@important_days_bp.post("")
@auth_required
def create_important_day():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    date_value = (data.get("date") or "").strip()
    time_value = (data.get("time") or "").strip()
    icon_value = (data.get("icon") or "").strip()
    icon_color_value = (data.get("icon_color") or "").strip()

    if not title or not date_value or not time_value:
        return jsonify({"message": "title, date and time are required"}), 400

    event_timestamp = parse_iso_date_to_timestamp(date_value)
    if event_timestamp is None:
        return jsonify({"message": "date must be a valid YYYY-MM-DD date"}), 400

    if not TIME_PATTERN.match(time_value):
        return jsonify({"message": "time must be in HH:MM format"}), 400

    cursor = execute(
        """
        INSERT INTO important_days(user_id, title, description, event_date, event_time, icon, icon_color)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            g.user_id,
            title,
            description or None,
            event_timestamp,
            time_value,
            icon_value or None,
            icon_color_value or None,
        ),
    )
    inserted_id = cursor.fetchone()["id"]

    row = query_all(
        """
        SELECT id, title, description,
          TO_CHAR(TO_TIMESTAMP(event_date), 'YYYY-MM-DD') AS date,
          event_time AS time,
          icon,
          icon_color,
          created_at, updated_at
        FROM important_days
        WHERE id = %s
        """,
        (inserted_id,),
    )

    return jsonify(row[0]), 201
