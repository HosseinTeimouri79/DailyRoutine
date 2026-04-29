import { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import PersianMonthCalendar from "../calendar/PersianMonthCalendar";
import holidays from "../../data/holidays.json";
import {
  formatDateParts,
  formatMonthYear,
  getMonthCursorFromISO,
  getPersianDatePartsNumeric,
  getTodayISO,
  shiftMonthCursor,
} from "../../lib/date";
import { t } from "../../lib/i18n";
import "./CalendarTab.css";

function buildHolidayMap(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const month = Number(entry?.date?.month);
    const day = Number(entry?.date?.day);
    if (!month || !day) return;
    const key = `${month}-${day}`;
    const list = map.get(key) || [];
    list.push({
      name: entry.event_name,
      isHoliday: Boolean(entry.is_holiday),
    });
    map.set(key, list);
  });
  return map;
}

function getGregorianKey(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function getJalaliKey(isoDate) {
  const parts = getPersianDatePartsNumeric(isoDate);
  if (!parts) return null;
  return `${parts.month}-${parts.day}`;
}

export default function CalendarTab({ language, calendarType }) {
  const todayISO = useMemo(() => getTodayISO(), []);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [month, setMonth] = useState(() =>
    getMonthCursorFromISO(todayISO, calendarType),
  );

  const holidayMaps = useMemo(
    () => ({
      jalali: buildHolidayMap(holidays.jalali || []),
      gregorian: buildHolidayMap(holidays.gregorian || []),
    }),
    [],
  );

  useEffect(() => {
    setMonth(getMonthCursorFromISO(selectedDate, calendarType));
  }, [selectedDate, calendarType]);

  function getHolidayKey(isoDate) {
    return calendarType === "gregorian"
      ? getGregorianKey(isoDate)
      : getJalaliKey(isoDate);
  }

  function getHolidayEvents(isoDate) {
    const key = getHolidayKey(isoDate);
    if (!key) return [];
    const map =
      calendarType === "gregorian" ? holidayMaps.gregorian : holidayMaps.jalali;
    return map.get(key) || [];
  }

  function getHolidayDayStatus(isoDate) {
    const events = getHolidayEvents(isoDate);
    return events.some((item) => item.isHoliday) ? "holiday" : null;
  }

  function getDayBadge(isoDate) {
    const events = getHolidayEvents(isoDate);
    return events.length ? "has-events" : null;
  }

  const selectedEvents = useMemo(
    () => getHolidayEvents(selectedDate),
    [selectedDate, calendarType, holidayMaps],
  );

  return (
    <Card
      title={t("calendarTab.title", language)}
      subtitle={t("calendarTab.subtitle", language)}
    >
      <PersianMonthCalendar
        className="calendar-tab-month"
        month={month}
        calendarType={calendarType}
        onPrevMonth={() => setMonth((prev) => shiftMonthCursor(prev, -1))}
        onNextMonth={() => setMonth((prev) => shiftMonthCursor(prev, 1))}
        onSetMonth={setMonth}
        onGoToday={() => {
          setMonth(getMonthCursorFromISO(todayISO, calendarType));
          setSelectedDate(todayISO);
        }}
        selectedDate={selectedDate}
        onSelectDay={setSelectedDate}
        getDayStatus={getHolidayDayStatus}
        getDayBadge={getDayBadge}
        language={language}
      />

      <div className="calendar-tab-events">
        <p className="muted calendar-selected-date">
          {t("calendarTab.selectedDate", language)}:{" "}
          {formatDateParts(selectedDate, language, calendarType).day}{" "}
          {formatMonthYear(selectedDate, language, calendarType)}
        </p>

        {!selectedEvents.length ? (
          <p className="empty-state-message">
            {t("calendarTab.noEvents", language)}
          </p>
        ) : (
          <ul className="calendar-events-list">
            {selectedEvents.map((event, index) => (
              <li
                key={`${selectedDate}-${event.name}-${index}`}
                className={`calendar-event ${event.isHoliday ? "holiday" : ""}`.trim()}
              >
                <span className="calendar-event-title">{event.name}</span>
                <span
                  className={`calendar-event-badge ${event.isHoliday ? "holiday" : "event"}`.trim()}
                >
                  {event.isHoliday
                    ? t("calendarTab.holidayBadge", language)
                    : t("calendarTab.eventBadge", language)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
