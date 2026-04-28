from flask import Blueprint, jsonify, request, g

from core.auth import auth_required
from core.db import execute, query_all, query_one
from core.date_utils import parse_iso_date_to_timestamp
from core.recurrence import is_routine_due_on_timestamp


logs_bp = Blueprint("logs", __name__, url_prefix="/api/routine-logs")


@logs_bp.post("")
@auth_required
def upsert_log():
    data = request.get_json(silent=True) or {}
    routine_id = data.get("routine_id")
    log_date = (data.get("date") or "").strip()
    status = (data.get("status") or "").strip()

    if not routine_id or not log_date or status not in {"done", "missed"}:
        return jsonify({"message": "routine_id, date and valid status are required"}), 400

    log_timestamp = parse_iso_date_to_timestamp(log_date)
    if log_timestamp is None:
        return jsonify({"message": "date must be a valid YYYY-MM-DD date"}), 400

    routine = query_one(
        """
        SELECT id, recurrence_mode, recurrence_weekdays, recurrence_day_of_week, recurrence_day_of_month
        FROM routines
        WHERE id = %s AND user_id = %s
        """,
        (routine_id, g.user_id),
    )
    if not routine:
        return jsonify({"message": "routine not found"}), 404

    if not is_routine_due_on_timestamp(routine, log_timestamp):
        return jsonify({"message": "routine is not scheduled for the provided date"}), 400

    execute(
        """
        INSERT INTO routine_logs(routine_id, date, status)
        VALUES (%s, %s, %s)
        ON CONFLICT(routine_id, date) DO UPDATE SET
          status = excluded.status,
          updated_at = EXTRACT(EPOCH FROM NOW())::bigint
        """,
        (routine_id, log_timestamp, status),
    )

    return jsonify({"routine_id": routine_id, "date": log_date, "status": status})


@logs_bp.get("")
@auth_required
def list_logs():
    routine_id = request.args.get("routineId")
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")

    filters = ["r.user_id = %s"]
    params = [g.user_id]

    if routine_id:
        filters.append("l.routine_id = %s")
        params.append(routine_id)
    if start_date:
        filters.append("TO_TIMESTAMP(l.date)::date >= %s::date")
        params.append(start_date)
    if end_date:
        filters.append("TO_TIMESTAMP(l.date)::date <= %s::date")
        params.append(end_date)

    where_clause = " AND ".join(filters)
    rows = query_all(
        f"""
        SELECT l.id, l.routine_id,
          TO_CHAR(TO_TIMESTAMP(l.date), 'YYYY-MM-DD') AS date,
          l.status
        FROM routine_logs l
        INNER JOIN routines r ON r.id = l.routine_id
        WHERE {where_clause}
        ORDER BY l.date ASC
        """,
        tuple(params),
    )
    return jsonify(rows)
