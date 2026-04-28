from datetime import datetime, timezone
from enum import Enum


class RecurrenceMode(str, Enum):
    SPECIFIC_WEEKDAYS = "specific_weekdays"
    WEEKLY_DAY = "weekly_day"
    MONTHLY_DAY = "monthly_day"


WEEKDAY_NAMES = {
    "monday": 0,
    "mon": 0,
    "tuesday": 1,
    "tue": 1,
    "tues": 1,
    "wednesday": 2,
    "wed": 2,
    "thursday": 3,
    "thu": 3,
    "thur": 3,
    "thurs": 3,
    "friday": 4,
    "fri": 4,
    "saturday": 5,
    "sat": 5,
    "sunday": 6,
    "sun": 6,
}

DEFAULT_SPECIFIC_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]


def recurrence_modes():
    return {mode.value for mode in RecurrenceMode}


def parse_weekday(value):
    if isinstance(value, bool):
        raise ValueError("weekday must be an integer in range 0..6")

    if isinstance(value, int):
        day = value
    elif isinstance(value, str):
        raw = value.strip().lower()
        if not raw:
            raise ValueError("weekday must be an integer in range 0..6")
        if raw in WEEKDAY_NAMES:
            day = WEEKDAY_NAMES[raw]
        elif raw.isdigit() or (raw.startswith("-") and raw[1:].isdigit()):
            day = int(raw)
        else:
            raise ValueError("weekday must be an integer in range 0..6")
    else:
        raise ValueError("weekday must be an integer in range 0..6")

    if day < 0 or day > 6:
        raise ValueError("weekday must be an integer in range 0..6")

    return day


def normalize_weekdays(value):
    if value is None:
        raise ValueError("recurrence_weekdays is required for specific_weekdays mode")

    if not isinstance(value, (list, tuple)):
        raise ValueError("recurrence_weekdays must be a list of weekdays")

    days = sorted({parse_weekday(item) for item in value})
    if not days:
        raise ValueError("recurrence_weekdays cannot be empty")

    return days


def normalize_day_of_month(value):
    if isinstance(value, bool):
        raise ValueError("recurrence_day_of_month must be an integer in range 1..31")

    if isinstance(value, int):
        day = value
    elif isinstance(value, str):
        raw = value.strip()
        if not raw or not raw.isdigit():
            raise ValueError("recurrence_day_of_month must be an integer in range 1..31")
        day = int(raw)
    else:
        raise ValueError("recurrence_day_of_month must be an integer in range 1..31")

    if day < 1 or day > 31:
        raise ValueError("recurrence_day_of_month must be an integer in range 1..31")

    return day


def normalize_recurrence_payload(
    data,
    current_mode=None,
    current_weekdays=None,
    current_day_of_week=None,
    current_day_of_month=None,
):
    mode_raw = data.get("recurrence_mode")
    mode = current_mode or RecurrenceMode.SPECIFIC_WEEKDAYS.value

    if mode_raw is not None:
        mode = str(mode_raw).strip().lower()

    if mode not in recurrence_modes():
        allowed = ", ".join(sorted(recurrence_modes()))
        raise ValueError(f"recurrence_mode must be one of: {allowed}")

    has_weekdays = "recurrence_weekdays" in data
    has_day_of_week = "recurrence_day_of_week" in data
    has_day_of_month = "recurrence_day_of_month" in data

    if mode == RecurrenceMode.SPECIFIC_WEEKDAYS.value:
        if has_weekdays:
            weekdays = normalize_weekdays(data.get("recurrence_weekdays"))
        elif current_mode == RecurrenceMode.SPECIFIC_WEEKDAYS.value and current_weekdays is not None:
            weekdays = normalize_weekdays(current_weekdays)
        else:
            weekdays = list(DEFAULT_SPECIFIC_WEEKDAYS)

        return mode, weekdays, None, None

    if mode == RecurrenceMode.WEEKLY_DAY.value:
        if has_day_of_week:
            day_of_week = parse_weekday(data.get("recurrence_day_of_week"))
        elif current_mode == RecurrenceMode.WEEKLY_DAY.value and current_day_of_week is not None:
            day_of_week = parse_weekday(current_day_of_week)
        else:
            day_of_week = 0

        return mode, [], day_of_week, None

    if has_day_of_month:
        day_of_month = normalize_day_of_month(data.get("recurrence_day_of_month"))
    elif current_mode == RecurrenceMode.MONTHLY_DAY.value and current_day_of_month is not None:
        day_of_month = normalize_day_of_month(current_day_of_month)
    else:
        day_of_month = 1

    return mode, [], None, day_of_month


def is_routine_due_on_timestamp(routine, timestamp_value):
    dt = datetime.fromtimestamp(int(timestamp_value), tz=timezone.utc)
    weekday = dt.weekday()
    day_of_month = dt.day

    mode = (routine.get("recurrence_mode") or RecurrenceMode.SPECIFIC_WEEKDAYS.value).strip().lower()

    if mode == RecurrenceMode.SPECIFIC_WEEKDAYS.value:
        weekdays = routine.get("recurrence_weekdays") or []
        return weekday in {parse_weekday(day) for day in weekdays}

    if mode == RecurrenceMode.WEEKLY_DAY.value:
        raw_day = routine.get("recurrence_day_of_week")
        if raw_day is None:
            return False
        return weekday == parse_weekday(raw_day)

    if mode == RecurrenceMode.MONTHLY_DAY.value:
        raw_day = routine.get("recurrence_day_of_month")
        if raw_day is None:
            return False
        return day_of_month == normalize_day_of_month(raw_day)

    return False
