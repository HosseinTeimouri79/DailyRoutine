from datetime import datetime, timezone


def parse_iso_date_to_timestamp(value):
    if not value or not isinstance(value, str):
        return None

    value = value.strip()
    if not value:
        return None

    try:
        if "T" in value:
            dt = datetime.fromisoformat(value)
        else:
            dt = datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return int(dt.timestamp())


def normalize_date_to_iso(value):
    if value is None:
        return None

    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None
        if value.isdigit():
            try:
                ts = int(value)
            except ValueError:
                ts = None
            else:
                return datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
        try:
            if "T" in value:
                dt = datetime.fromisoformat(value)
            else:
                return datetime.strptime(value, "%Y-%m-%d").date().isoformat()
        except ValueError:
            return None
        return dt.date().isoformat() if isinstance(dt, datetime) else dt

    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(int(value), tz=timezone.utc).date().isoformat()
        except (OverflowError, OSError, ValueError):
            return None

    return None
