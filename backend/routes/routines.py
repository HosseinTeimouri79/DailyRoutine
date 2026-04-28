from flask import Blueprint, jsonify, request, g
import re

from core.auth import auth_required
from core.db import execute, query_all, query_one
from core.date_utils import parse_iso_date_to_timestamp
from core.recurrence import is_routine_due_on_timestamp, normalize_recurrence_payload


routines_bp = Blueprint("routines", __name__, url_prefix="/api/routines")


TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def normalize_alarm_payload(data: dict, current_enabled=None, current_time=None):
    alarm_enabled_raw = data.get("alarm_enabled")
    alarm_time_raw = data.get("alarm_time")

    next_alarm_enabled = current_enabled if current_enabled is not None else 0
    next_alarm_time = current_time if current_time is not None else None

    if alarm_enabled_raw is not None:
        next_alarm_enabled = 1 if bool(alarm_enabled_raw) else 0

    if alarm_time_raw is not None:
        parsed_time = str(alarm_time_raw).strip()
        next_alarm_time = parsed_time or None

    if next_alarm_enabled:
        if not next_alarm_time:
            raise ValueError("alarm_time is required when alarm_enabled is true")
        if not TIME_PATTERN.match(next_alarm_time):
            raise ValueError("alarm_time must be in HH:MM format")
    else:
        next_alarm_time = None

    return next_alarm_enabled, next_alarm_time


def serialize_routine(row: dict):
    return {
        "id": row["id"],
        "title": row["title"],
        "color": row["color"],
        "icon": row["icon"],
        "is_active": row["is_active"],
        "alarm_enabled": row["alarm_enabled"],
        "alarm_time": row["alarm_time"],
        "created_at": row.get("created_at"),
        "recurrence_mode": row.get("recurrence_mode"),
        "recurrence_weekdays": row.get("recurrence_weekdays") or [],
        "recurrence_day_of_week": row.get("recurrence_day_of_week"),
        "recurrence_day_of_month": row.get("recurrence_day_of_month"),
    }


@routines_bp.get("")
@auth_required
def list_routines():
    on_date_raw = (request.args.get("onDate") or "").strip()
    on_timestamp = None

    if on_date_raw:
        on_timestamp = parse_iso_date_to_timestamp(on_date_raw)
        if on_timestamp is None:
            return jsonify({"message": "onDate must be a valid YYYY-MM-DD date"}), 400

    rows = query_all(
        """
        SELECT id, title, color, icon, is_active,
          alarm_enabled, alarm_time, created_at,
          recurrence_mode, recurrence_weekdays, recurrence_day_of_week, recurrence_day_of_month
        FROM routines
        WHERE user_id = %s
        ORDER BY id DESC
        """,
        (g.user_id,),
    )

    if on_timestamp is not None:
        rows = [row for row in rows if is_routine_due_on_timestamp(row, on_timestamp)]

    return jsonify([serialize_routine(row) for row in rows])


@routines_bp.post("")
@auth_required
def create_routine():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    color = (data.get("color") or "").strip() or None
    icon = (data.get("icon") or "").strip() or None

    if not title:
        return jsonify({"message": "title is required"}), 400

    try:
        alarm_enabled, alarm_time = normalize_alarm_payload(data)
        recurrence_mode, recurrence_weekdays, recurrence_day_of_week, recurrence_day_of_month = (
            normalize_recurrence_payload(data)
        )
    except ValueError as err:
        return jsonify({"message": str(err)}), 400

    cursor = execute(
        """
        INSERT INTO routines(
          user_id, title, color, icon,
          alarm_enabled, alarm_time,
          recurrence_mode, recurrence_weekdays, recurrence_day_of_week, recurrence_day_of_month
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            g.user_id,
            title,
            color,
            icon,
            alarm_enabled,
            alarm_time,
            recurrence_mode,
            recurrence_weekdays,
            recurrence_day_of_week,
            recurrence_day_of_month,
        ),
    )

    return jsonify(
        {
            "id": cursor.fetchone()["id"],
            "title": title,
            "color": color,
            "icon": icon,
            "is_active": 1,
            "alarm_enabled": alarm_enabled,
            "alarm_time": alarm_time,
            "recurrence_mode": recurrence_mode,
            "recurrence_weekdays": recurrence_weekdays,
            "recurrence_day_of_week": recurrence_day_of_week,
            "recurrence_day_of_month": recurrence_day_of_month,
        }
    ), 201


@routines_bp.put("/<int:routine_id>")
@auth_required
def update_routine(routine_id: int):
    routine = query_one(
                """
                SELECT id, title, color, icon, is_active, alarm_enabled, alarm_time,
                    recurrence_mode, recurrence_weekdays, recurrence_day_of_week, recurrence_day_of_month
                FROM routines
                WHERE id = %s AND user_id = %s
                """,
        (routine_id, g.user_id),
    )
    if not routine:
        return jsonify({"message": "routine not found"}), 404

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or routine["title"]).strip()
    color = data.get("color") if data.get("color") is not None else routine["color"]
    icon = data.get("icon") if data.get("icon") is not None else routine["icon"]
    is_active = data.get("is_active", routine["is_active"])

    if not title:
        return jsonify({"message": "title is required"}), 400

    is_active = 1 if bool(is_active) else 0
    try:
        alarm_enabled, alarm_time = normalize_alarm_payload(
            data,
            current_enabled=routine["alarm_enabled"],
            current_time=routine["alarm_time"],
        )
        recurrence_mode, recurrence_weekdays, recurrence_day_of_week, recurrence_day_of_month = (
            normalize_recurrence_payload(
                data,
                current_mode=routine["recurrence_mode"],
                current_weekdays=routine["recurrence_weekdays"],
                current_day_of_week=routine["recurrence_day_of_week"],
                current_day_of_month=routine["recurrence_day_of_month"],
            )
        )
    except ValueError as err:
        return jsonify({"message": str(err)}), 400

    execute(
        """
        UPDATE routines
        SET
          title = %s,
          color = %s,
          icon = %s,
          is_active = %s,
          alarm_enabled = %s,
          alarm_time = %s,
          recurrence_mode = %s,
          recurrence_weekdays = %s,
          recurrence_day_of_week = %s,
          recurrence_day_of_month = %s
        WHERE id = %s AND user_id = %s
        """,
        (
            title,
            color,
            icon,
            is_active,
            alarm_enabled,
            alarm_time,
            recurrence_mode,
            recurrence_weekdays,
            recurrence_day_of_week,
            recurrence_day_of_month,
            routine_id,
            g.user_id,
        ),
    )

    return jsonify(
        {
            "id": routine_id,
            "title": title,
            "color": color,
            "icon": icon,
            "is_active": is_active,
            "alarm_enabled": alarm_enabled,
            "alarm_time": alarm_time,
            "recurrence_mode": recurrence_mode,
            "recurrence_weekdays": recurrence_weekdays,
            "recurrence_day_of_week": recurrence_day_of_week,
            "recurrence_day_of_month": recurrence_day_of_month,
        }
    )


@routines_bp.delete("/<int:routine_id>")
@auth_required
def delete_routine(routine_id: int):
    routine = query_one(
        "SELECT id FROM routines WHERE id = %s AND user_id = %s",
        (routine_id, g.user_id),
    )
    if not routine:
        return jsonify({"message": "routine not found"}), 404

    execute("DELETE FROM routines WHERE id = %s AND user_id = %s", (routine_id, g.user_id))
    return jsonify({"message": "deleted"})
