from flask import Blueprint, jsonify, request, g

from core.auth import auth_required
from core.db import execute, query_all, query_one


routines_bp = Blueprint("routines", __name__, url_prefix="/api/routines")


@routines_bp.get("")
@auth_required
def list_routines():
    rows = query_all(
        "SELECT id, title, color, icon, is_active, created_at FROM routines WHERE user_id = ? ORDER BY id DESC",
        (g.user_id,),
    )
    return jsonify(rows)


@routines_bp.post("")
@auth_required
def create_routine():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    color = (data.get("color") or "").strip() or None
    icon = (data.get("icon") or "").strip() or None

    if not title:
        return jsonify({"message": "title is required"}), 400

    cursor = execute(
        "INSERT INTO routines(user_id, title, color, icon) VALUES (?, ?, ?, ?)",
        (g.user_id, title, color, icon),
    )

    return jsonify(
        {
            "id": cursor.lastrowid,
            "title": title,
            "color": color,
            "icon": icon,
            "is_active": 1,
        }
    ), 201


@routines_bp.put("/<int:routine_id>")
@auth_required
def update_routine(routine_id: int):
    routine = query_one(
        "SELECT id, title, color, icon, is_active FROM routines WHERE id = ? AND user_id = ?",
        (routine_id, g.user_id),
    )
    if not routine:
        return jsonify({"message": "routine not found"}), 404

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or routine["title"]).strip()
    color = (data.get("color") if data.get("color") is not None else routine["color"])
    icon = (data.get("icon") if data.get("icon") is not None else routine["icon"])
    is_active = data.get("is_active", routine["is_active"])

    if not title:
        return jsonify({"message": "title is required"}), 400

    is_active = 1 if bool(is_active) else 0
    execute(
        "UPDATE routines SET title = ?, color = ?, icon = ?, is_active = ? WHERE id = ? AND user_id = ?",
        (title, color, icon, is_active, routine_id, g.user_id),
    )

    return jsonify(
        {
            "id": routine_id,
            "title": title,
            "color": color,
            "icon": icon,
            "is_active": is_active,
        }
    )


@routines_bp.delete("/<int:routine_id>")
@auth_required
def delete_routine(routine_id: int):
    routine = query_one(
        "SELECT id FROM routines WHERE id = ? AND user_id = ?",
        (routine_id, g.user_id),
    )
    if not routine:
        return jsonify({"message": "routine not found"}), 404

    execute("DELETE FROM routines WHERE id = ? AND user_id = ?", (routine_id, g.user_id))
    return jsonify({"message": "deleted"})
