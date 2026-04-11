from datetime import date, datetime, timedelta


def parse_iso_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def month_range(month_ym: str) -> tuple[date, date]:
    start = datetime.strptime(f"{month_ym}-01", "%Y-%m-%d").date()
    if start.month == 12:
        next_month = date(start.year + 1, 1, 1)
    else:
        next_month = date(start.year, start.month + 1, 1)
    return start, next_month - timedelta(days=1)


def week_range(today: date | None = None) -> tuple[date, date]:
    today = today or date.today()
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=6)
    return start, end
