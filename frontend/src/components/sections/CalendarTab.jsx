import { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
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
import { api } from "../../lib/api";
import { t } from "../../lib/i18n";
import IconPickerModal from "../ui/IconPickerModal";
import "./CalendarTab.css";

const IMPORTANT_DAY_ICON_OPTIONS = [
  { label: "Star", value: "fa-solid fa-star" },
  { label: "Heart", value: "fa-solid fa-heart" },
  { label: "Gift", value: "fa-solid fa-gift" },
  { label: "Cake", value: "fa-solid fa-cake-candles" },
  { label: "Calendar", value: "fa-solid fa-calendar-days" },
  { label: "Flag", value: "fa-solid fa-flag" },
  { label: "Bell", value: "fa-solid fa-bell" },
  { label: "Trophy", value: "fa-solid fa-trophy" },
  { label: "Rocket", value: "fa-solid fa-rocket" },
  { label: "Sparkles", value: "fa-solid fa-sparkles" },
];

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
  const [isImportantDayModalOpen, setIsImportantDayModalOpen] = useState(false);
  const [importantModalMonth, setImportantModalMonth] = useState(() =>
    getMonthCursorFromISO(todayISO, calendarType),
  );
  const [importantTitle, setImportantTitle] = useState("");
  const [importantDescription, setImportantDescription] = useState("");
  const [importantDate, setImportantDate] = useState(todayISO);
  const [importantTime, setImportantTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
  });
  const [importantIcon, setImportantIcon] = useState(
    IMPORTANT_DAY_ICON_OPTIONS[0].value,
  );
  const [importantIconColor, setImportantIconColor] = useState("#ffbe0b");
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [importantDays, setImportantDays] = useState([]);
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function loadImportantDays() {
      try {
        const rows = await api.getImportantDays();
        if (cancelled) return;
        setImportantDays(rows || []);
      } catch {
        // ignore backend load failure for now
      }
    }

    loadImportantDays();
    return () => {
      cancelled = true;
    };
  }, [todayISO]);

  useEffect(() => {
    setImportantModalMonth(getMonthCursorFromISO(importantDate, calendarType));
  }, [calendarType, importantDate]);

  function openImportantDayModal() {
    setImportantTitle("");
    setImportantDescription("");
    setImportantDate(todayISO);
    setImportantIcon(IMPORTANT_DAY_ICON_OPTIONS[0].value);
    setImportantIconColor("#ffbe0b");
    setImportantModalMonth(getMonthCursorFromISO(todayISO, calendarType));
    setImportantTime(
      `${String(new Date().getHours()).padStart(2, "0")}:${String(
        new Date().getMinutes(),
      ).padStart(2, "0")}`,
    );
    setFormMessage({ type: "", text: "" });
    setIsImportantDayModalOpen(true);
  }

  function closeImportantDayModal() {
    setIsImportantDayModalOpen(false);
    setFormMessage({ type: "", text: "" });
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function getCountdownLabel(date, time) {
    const target = new Date(`${date}T${time || "00:00"}:00`);
    if (Number.isNaN(target.getTime())) {
      return { label: "", expired: false };
    }

    const diffSeconds = Math.floor((target.getTime() - now) / 1000);
    if (diffSeconds <= 0) {
      return {
        label: t("calendarTab.importantDayExpired", language),
        expired: true,
      };
    }

    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor((diffSeconds % 86400) / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    if (days >= 1) {
      return {
        label: t("calendarTab.importantDayCountdownDays", language, {
          days,
          hours,
        }),
        expired: false,
      };
    }

    return {
      label: t("calendarTab.importantDayCountdownHours", language, {
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      }),
      expired: false,
    };
  }

  async function handleSaveImportantDay(event) {
    event.preventDefault();
    const title = importantTitle.trim();
    if (!title) {
      setFormMessage({
        type: "error",
        text: t("calendarTab.importantDayNoTitleError", language),
      });
      return;
    }

    try {
      const payload = {
        title,
        description: importantDescription.trim(),
        date: importantDate,
        time: importantTime,
        icon: importantIcon,
        icon_color: importantIconColor,
      };
      const saved = await api.createImportantDay(payload);
      setImportantDays((prev) => [saved, ...prev]);
      setFormMessage({
        type: "success",
        text: t("calendarTab.importantDaySavedMessage", language),
      });
      setTimeout(() => {
        closeImportantDayModal();
      }, 1500);
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.message || t("calendarTab.importantDaySaveError", language),
      });
    }
  }

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

  const importantDayIcons = useMemo(() => {
    const map = new Map();
    importantDays.forEach((item) => {
      if (item.date) {
        map.set(item.date, {
          icon: item.icon || IMPORTANT_DAY_ICON_OPTIONS[0].value,
          color: item.icon_color || "#ffbe0b",
        });
      }
    });
    return map;
  }, [importantDays]);

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
        getDayIcon={(isoDate) => importantDayIcons.get(isoDate)}
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
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="calendar-important-day-section">
        <div className="calendar-important-day-header">
          <div>
            <h3>{t("calendarTab.importantDaySectionTitle", language)}</h3>
            <p className="muted">
              {t("calendarTab.importantDaySectionDescription", language)}
            </p>
          </div>
          <Button onClick={openImportantDayModal}>
            {t("calendarTab.importantDayAdd", language)}
          </Button>
        </div>

        {importantDays.length ? (
          <div className="important-day-list">
            {importantDays.map((item) => {
              const countdown = getCountdownLabel(item.date, item.time);
              return (
                <div key={item.id} className="important-day-summary">
                  <span className="important-day-summary-icon">
                    <i
                      className={
                        item.icon || IMPORTANT_DAY_ICON_OPTIONS[0].value
                      }
                      style={{ color: item.icon_color || "#ffbe0b" }}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="important-day-summary-title">
                    {item.title}
                  </span>
                  {item.description ? (
                    <p className="important-day-summary-desc">
                      {item.description}
                    </p>
                  ) : null}
                  <div className="important-day-summary-meta">
                    <span>
                      {t("calendarTab.importantDayDateLabel", language)}:{" "}
                      {formatDateParts(item.date, language, calendarType).day}{" "}
                      {formatMonthYear(item.date, language, calendarType)}
                    </span>
                    <span>
                      {t("calendarTab.importantDayTimeLabel", language)}:{" "}
                      {item.time}
                    </span>
                  </div>
                  {countdown.label && (
                    <p
                      className={`important-day-countdown ${countdown.expired ? "expired" : ""}`.trim()}
                    >
                      {countdown.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-state-message">
            {t("calendarTab.importantDaysEmptyMessage", language)}
          </p>
        )}
      </div>

      <Modal
        isOpen={isImportantDayModalOpen}
        onClose={closeImportantDayModal}
        title={t("calendarTab.importantDayModalTitle", language)}
      >
        <form onSubmit={handleSaveImportantDay} className="modal-form">
          <div className="field">
            <label htmlFor="modal-important-title">
              {t("calendarTab.importantDayTitleLabel", language)}
            </label>
            <input
              id="modal-important-title"
              className="input"
              value={importantTitle}
              onChange={(event) => setImportantTitle(event.target.value)}
              placeholder={t(
                "calendarTab.importantDayTitlePlaceholder",
                language,
              )}
              autoFocus
            />
          </div>

          <div className="field">
            <label>{t("calendarTab.importantDayDateLabel", language)}</label>
            <PersianMonthCalendar
              month={importantModalMonth}
              calendarType={calendarType}
              showMonthSwitchButtons={false}
              onSetMonth={setImportantModalMonth}
              onGoToday={() => {
                setImportantModalMonth(
                  getMonthCursorFromISO(todayISO, calendarType),
                );
                setImportantDate(todayISO);
              }}
              selectedDate={importantDate}
              onSelectDay={setImportantDate}
              language={language}
            />
          </div>

          <div className="field">
            <label htmlFor="modal-important-time">
              {t("calendarTab.importantDayTimeLabel", language)}
            </label>
            <input
              id="modal-important-time"
              className="input"
              type="time"
              value={importantTime}
              onChange={(event) => setImportantTime(event.target.value)}
            />
          </div>

          <div className="field">
            <label>{t("calendarTab.importantDayIconLabel", language)}</label>
            <button
              type="button"
              className="important-day-icon-picker-button"
              onClick={() => setIsIconPickerOpen(true)}
            >
              <i
                className={importantIcon}
                style={{ color: importantIconColor }}
                aria-hidden="true"
              />
              <span>{t("calendarTab.importantDayIconSelect", language)}</span>
            </button>
          </div>

          <IconPickerModal
            isOpen={isIconPickerOpen}
            onClose={() => setIsIconPickerOpen(false)}
            title={t("calendarTab.importantDayIconPickerTitle", language)}
            selectedIcon={importantIcon}
            selectedColor={importantIconColor}
            onSelectIcon={setImportantIcon}
            onSelectColor={setImportantIconColor}
            onConfirm={() => setIsIconPickerOpen(false)}
            language={language}
          />

          <div className="field">
            <label htmlFor="modal-important-description">
              {t("calendarTab.importantDayDescriptionLabel", language)}
            </label>
            <textarea
              id="modal-important-description"
              className="input"
              value={importantDescription}
              onChange={(event) => setImportantDescription(event.target.value)}
              placeholder={t(
                "calendarTab.importantDayDescriptionPlaceholder",
                language,
              )}
              rows="3"
            />
          </div>

          {formMessage.text ? (
            <p className={`important-day-message ${formMessage.type}`.trim()}>
              {formMessage.text}
            </p>
          ) : null}

          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={closeImportantDayModal}
              type="button"
            >
              {t("common.cancel", language)}
            </Button>
            <Button type="submit">
              {t("calendarTab.importantDaySave", language)}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
