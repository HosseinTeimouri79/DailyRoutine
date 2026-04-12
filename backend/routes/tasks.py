from flask import Blueprint, jsonify, request, g

from core.auth import auth_required
from core.db import execute, query_all, query_one


tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/daily-tasks")


@tasks_bp.get("")
@auth_required
def list_daily_tasks():
    task_date = (request.args.get("date") or "").strip()
    if not task_date:
        return jsonify({"message": "date is required"}), 400

    rows = query_all(
        """
        SELECT id, user_id, task_date, content, is_done, created_at, updated_at
        FROM daily_tasks
        WHERE user_id = ? AND task_date = ?
        ORDER BY is_done ASC, id DESC
        """,
        (g.user_id, task_date),
    )
    return jsonify(rows)


@tasks_bp.post("")
@auth_required
def create_daily_task():
    data = request.get_json(silent=True) or {}
    task_date = (data.get("date") or "").strip()
    content = (data.get("content") or "").strip()

    if not task_date or not content:
        return jsonify({"message": "date and content are required"}), 400

    cursor = execute(
        "INSERT INTO daily_tasks(user_id, task_date, content, is_done) VALUES (?, ?, ?, 0)",
        (g.user_id, task_date, content),
    )

    row = query_one(
        """
        SELECT id, user_id, task_date, content, is_done, created_at, updated_at
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
        "SELECT id, content, is_done FROM daily_tasks WHERE id = ? AND user_id = ?",
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

    execute(
        """
        UPDATE daily_tasks
        SET content = ?, is_done = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
        """,
        (next_content, next_is_done, task_id, g.user_id),
    )

    row = query_one(
        """
        SELECT id, user_id, task_date, content, is_done, created_at, updated_at
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
