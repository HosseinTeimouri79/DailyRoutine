from flask import Blueprint, jsonify, request, g

from core.auth import auth_required
from core.db import execute, query_all, query_one


notes_bp = Blueprint("notes", __name__, url_prefix="/api/notes")


@notes_bp.get("")
@auth_required
def list_notes():
    query = (request.args.get("q") or "").strip()
    params = [g.user_id]
    where_clause = "WHERE user_id = ?"

    if query:
        where_clause += " AND content LIKE ?"
        params.append(f"%{query}%")

    rows = query_all(
        f"""
        SELECT id, user_id, content, created_at, updated_at
        FROM notes
        {where_clause}
        ORDER BY updated_at DESC, id DESC
        """,
        tuple(params),
    )
    return jsonify(rows)


@notes_bp.post("")
@auth_required
def create_note():
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()

    if not content:
        return jsonify({"message": "content is required"}), 400

    cursor = execute(
        "INSERT INTO notes(user_id, content) VALUES (?, ?)",
        (g.user_id, content),
    )

    row = query_one(
        """
        SELECT id, user_id, content, created_at, updated_at
        FROM notes
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    )
    return jsonify(row), 201


@notes_bp.put("/<int:note_id>")
@auth_required
def update_note(note_id: int):
    note = query_one(
        "SELECT id, content FROM notes WHERE id = ? AND user_id = ?",
        (note_id, g.user_id),
    )
    if not note:
        return jsonify({"message": "note not found"}), 404

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()

    if not content:
        return jsonify({"message": "content is required"}), 400

    execute(
        """
        UPDATE notes
        SET content = ?, updated_at = strftime('%s','now')
        WHERE id = ? AND user_id = ?
        """,
        (content, note_id, g.user_id),
    )

    row = query_one(
        """
        SELECT id, user_id, content, created_at, updated_at
        FROM notes
        WHERE id = ?
        """,
        (note_id,),
    )
    return jsonify(row)


@notes_bp.delete("/<int:note_id>")
@auth_required
def delete_note(note_id: int):
    note = query_one(
        "SELECT id FROM notes WHERE id = ? AND user_id = ?",
        (note_id, g.user_id),
    )
    if not note:
        return jsonify({"message": "note not found"}), 404

    execute("DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, g.user_id))
    return jsonify({"message": "deleted"})
