from flask import Blueprint, jsonify, request, g
import re

from core.auth import auth_required
from core.db import execute, query_all, query_one


tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/daily-tasks")


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


@tasks_bp.get("")
@auth_required
def list_daily_tasks():
    task_date = (request.args.get("date") or "").strip()
    start_date = (request.args.get("startDate") or "").strip()
    end_date = (request.args.get("endDate") or "").strip()

    if task_date:
        rows = query_all(
            """
            SELECT id, user_id, task_date, content, is_done, alarm_enabled, alarm_time, created_at, updated_at
            FROM daily_tasks
            WHERE user_id = ? AND task_date = ?
            ORDER BY is_done ASC, id DESC
            """,
            (g.user_id, task_date),
        )
        return jsonify(rows)

    if start_date and end_date:
        rows = query_all(
            """
            SELECT id, user_id, task_date, content, is_done, alarm_enabled, alarm_time, created_at, updated_at
            FROM daily_tasks
            WHERE user_id = ? AND task_date BETWEEN ? AND ?
            ORDER BY task_date ASC, is_done ASC, id DESC
            """,
            (g.user_id, start_date, end_date),
        )
        return jsonify(rows)

    return jsonify({"message": "date or startDate/endDate is required"}), 400


@tasks_bp.post("")
@auth_required
def create_daily_task():
    data = request.get_json(silent=True) or {}
    task_date = (data.get("date") or "").strip()
    content = (data.get("content") or "").strip()

    if not task_date or not content:
        return jsonify({"message": "date and content are required"}), 400

    try:
        alarm_enabled, alarm_time = normalize_alarm_payload(data)
    except ValueError as err:
        return jsonify({"message": str(err)}), 400

    cursor = execute(
        "INSERT INTO daily_tasks(user_id, task_date, content, is_done, alarm_enabled, alarm_time) VALUES (?, ?, ?, 0, ?, ?)",
        (g.user_id, task_date, content, alarm_enabled, alarm_time),
    )

    row = query_one(
        """
        SELECT id, user_id, task_date, content, is_done, alarm_enabled, alarm_time, created_at, updated_at
        FROM daily_tasks
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    )
    return jsonify(row), 201


@tasks_bp.put("/<int:task_id>")
@auth_required
def update_daily_task(task_id: int):
    task = query_one(
        "SELECT id, content, is_done, alarm_enabled, alarm_time FROM daily_tasks WHERE id = ? AND user_id = ?",
        (task_id, g.user_id),
    )
    if not task:
        return jsonify({"message": "task not found"}), 404

    data = request.get_json(silent=True) or {}
    content = data.get("content")
    is_done = data.get("is_done")

    next_content = task["content"]
    if content is not None:
        next_content = str(content).strip()
        if not next_content:
            return jsonify({"message": "content is required"}), 400

    next_is_done = task["is_done"]
    if is_done is not None:
        next_is_done = 1 if bool(is_done) else 0

    try:
        next_alarm_enabled, next_alarm_time = normalize_alarm_payload(
            data,
            current_enabled=task["alarm_enabled"],
            current_time=task["alarm_time"],
        )
    except ValueError as err:
        return jsonify({"message": str(err)}), 400

    execute(
        """
        UPDATE daily_tasks
        SET content = ?, is_done = ?, alarm_enabled = ?, alarm_time = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
        """,
        (
            next_content,
            next_is_done,
            next_alarm_enabled,
            next_alarm_time,
            task_id,
            g.user_id,
        ),
    )

    row = query_one(
        """
        SELECT id, user_id, task_date, content, is_done, alarm_enabled, alarm_time, created_at, updated_at
        FROM daily_tasks
        WHERE id = ?
        """,
        (task_id,),
    )
    return jsonify(row)


@tasks_bp.delete("/<int:task_id>")
@auth_required
def delete_daily_task(task_id: int):
    task = query_one(
        "SELECT id FROM daily_tasks WHERE id = ? AND user_id = ?",
        (task_id, g.user_id),
    )
    if not task:
        return jsonify({"message": "task not found"}), 404

    execute("DELETE FROM daily_tasks WHERE id = ? AND user_id = ?", (task_id, g.user_id))
    return jsonify({"message": "deleted"})
