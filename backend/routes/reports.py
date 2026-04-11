from datetime import date

from flask import Blueprint, jsonify, request, g

from core.auth import auth_required
from core.date_utils import month_range, week_range
from core.db import query_all, query_one


reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _calc_report(start_date: str, end_date: str):
    routines_row = query_one(
        "SELECT COUNT(*) AS total FROM routines WHERE user_id = ? AND is_active = 1",
        (g.user_id,),
    )
    routine_count = routines_row["total"] if routines_row else 0

    logs = query_all(
        """
        SELECT l.status
        FROM routine_logs l
        INNER JOIN routines r ON r.id = l.routine_id
        WHERE r.user_id = ? AND l.date >= ? AND l.date <= ?
        """,
        (g.user_id, start_date, end_date),
    )

    done = sum(1 for row in logs if row["status"] == "done")
    missed = sum(1 for row in logs if row["status"] == "missed")

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    days = (end - start).days + 1
    possible = max(routine_count * days, 0)
    remaining = max(possible - (done + missed), 0)

    return {
        "routines": routine_count,
        "done": done,
        "missed": missed,
        "remaining": remaining,
    }


@reports_bp.get("/monthly")
@auth_required
def monthly_report():
    month = request.args.get("month")
    if not month:
        return jsonify({"message": "month is required as YYYY-MM"}), 400

    try:
        start, end = month_range(month)
    except ValueError:
        return jsonify({"message": "invalid month format"}), 400

    return jsonify(_calc_report(start.isoformat(), end.isoformat()))


@reports_bp.get("/weekly")
@auth_required
def weekly_report():
    start, end = week_range()
    return jsonify(_calc_report(start.isoformat(), end.isoformat()))
