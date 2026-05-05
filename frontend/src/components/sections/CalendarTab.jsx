import { memo, useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmModal from "../ui/ConfirmModal";
import IconButton from "../ui/IconButton";
import DatePicker from "../ui/DatePicker";
import holidays from "../../data/holidays.json";
import {
  formatDateParts,
  formatMonthYear,
  getMonthCursorFromISO,
  getPersianDatePartsNumeric,
  getTodayISO,
  shiftMonthCursor,
} from "../../lib/date";
import { api, getUser } from "../../lib/api";
import { t } from "../../lib/i18n";
import IconPickerModal from "../ui/IconPickerModal";
import TimePicker from "../ui/TimePicker";
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

function CalendarTab({ language, calendarType }) {
  const todayISO = useMemo(() => getTodayISO(), []);
  const isAdmin = Boolean(getUser()?.is_admin);
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
  const [isImportantDatePickerOpen, setIsImportantDatePickerOpen] =
    useState(false);
  const [importantDays, setImportantDays] = useState([]);
  const [editingImportantDayId, setEditingImportantDayId] = useState(null);
  const [editingImportantDayIsGlobal, setEditingImportantDayIsGlobal] =
    useState(false);
  const [isGlobalImportantDay, setIsGlobalImportantDay] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingImportantDayId, setDeletingImportantDayId] = useState(null);
  const [deletingImportantDayIsGlobal, setDeletingImportantDayIsGlobal] =
    useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function loadImportantDays() {
      try {
        const [rows, globalDay] = await Promise.all([
          api.getImportantDays(),
          api.getGlobalImportantDay().catch(() => null),
        ]);
        if (cancelled) return;
        const combined = [...(rows || [])];
        if (globalDay) {
          combined.unshift({ ...globalDay, is_global: true });
        }
        setImportantDays(combined);
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
    setEditingImportantDayIsGlobal(false);
    setIsGlobalImportantDay(false);
    setIsImportantDatePickerOpen(false);
  }

  function closeImportantDayModal() {
    setIsImportantDayModalOpen(false);
    setEditingImportantDayId(null);
    setFormMessage({ type: "", text: "" });
    setEditingImportantDayIsGlobal(false);
    setIsGlobalImportantDay(false);
    setIsImportantDatePickerOpen(false);
  }

  function openEditImportantDay(item) {
    setEditingImportantDayId(item.id);
    setEditingImportantDayIsGlobal(Boolean(item.is_global));
    setImportantTitle(item.title || "");
    setImportantDescription(item.description || "");
    setImportantDate(item.date || todayISO);
    setImportantTime(item.time || "09:00");
    setImportantIcon(item.icon || IMPORTANT_DAY_ICON_OPTIONS[0].value);
    setImportantIconColor(item.icon_color || "#ffbe0b");
    setImportantModalMonth(
      getMonthCursorFromISO(item.date || todayISO, calendarType),
    );
    setIsGlobalImportantDay(Boolean(item.is_global));
    setFormMessage({ type: "", text: "" });
    setIsImportantDayModalOpen(true);
    setIsImportantDatePickerOpen(false);
  }

  async function handleDeleteImportantDay(item) {
    setDeletingImportantDayId(item.id);
    setDeletingImportantDayIsGlobal(Boolean(item.is_global));
    setIsDeleteModalOpen(true);
  }

  async function confirmDeleteImportantDay() {
    if (!deletingImportantDayId) return;

    try {
      if (deletingImportantDayIsGlobal) {
        await api.deleteGlobalImportantDay();
        setImportantDays((prev) => prev.filter((item) => !item.is_global));
      } else {
        await api.deleteImportantDay(deletingImportantDayId);
        setImportantDays((prev) =>
          prev.filter((item) => item.id !== deletingImportantDayId),
        );
      }
      setIsDeleteModalOpen(false);
      setDeletingImportantDayId(null);
      setDeletingImportantDayIsGlobal(false);
    } catch (error) {
      setFormMessage({
        type: "error",
        text:
          error.message || t("calendarTab.importantDayDeleteError", language),
      });
      setIsDeleteModalOpen(false);
      setDeletingImportantDayId(null);
      setDeletingImportantDayIsGlobal(false);
    }
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

      let saved;
      if (isGlobalImportantDay) {
        saved = await api.upsertGlobalImportantDay(payload);
        if (editingImportantDayId && !editingImportantDayIsGlobal) {
          await api.deleteImportantDay(editingImportantDayId);
        }
        setImportantDays((prev) => {
          const withoutGlobal = prev.filter((item) => !item.is_global);
          const withoutEdited = editingImportantDayId
            ? withoutGlobal.filter((item) => item.id !== editingImportantDayId)
            : withoutGlobal;
          return [{ ...saved, is_global: true }, ...withoutEdited];
        });
      } else if (editingImportantDayId) {
        saved = await api.updateImportantDay(editingImportantDayId, payload);
        setImportantDays((prev) =>
          prev.map((item) => (item.id === saved.id ? saved : item)),
        );
      } else {
        saved = await api.createImportantDay(payload);
        setImportantDays((prev) => [saved, ...prev]);
      }

      setFormMessage({
        type: "success",
        text: editingImportantDayId
          ? t("calendarTab.importantDayUpdatedMessage", language)
          : t("calendarTab.importantDaySavedMessage", language),
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

  const importantDateDisplay = importantDate
    ? `${formatDateParts(importantDate, language, calendarType).day} ${formatMonthYear(importantDate, language, calendarType)}`
    : "";

  return (
    <Card
      title={t("calendarTab.title", language)}
      subtitle={t("calendarTab.subtitle", language)}
    >
      <DatePicker
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
          <Button
            icon="fa-solid fa-calendar-plus"
            onClick={openImportantDayModal}
          >
            {t("calendarTab.importantDayAdd", language)}
          </Button>
        </div>

        {importantDays.length ? (
          <div className="important-day-list">
            {importantDays
              .filter((item) => item.date >= todayISO)
              .map((item) => {
                const countdown = getCountdownLabel(item.date, item.time);
                const canManage = !item.is_global || isAdmin;
                return (
                  <div key={item.id} className="important-day-summary">
                    <div className="calendar-important-day-actions">
                      <span className="important-day-summary-icon">
                        <i
                          className={
                            item.icon || IMPORTANT_DAY_ICON_OPTIONS[0].value
                          }
                          style={{ color: item.icon_color || "#ffbe0b" }}
                          aria-hidden="true"
                        />
                      </span>
                      {canManage ? (
                        <>
                          <IconButton
                            icon="fa-solid fa-pen"
                            label={t("calendarTab.importantDayEdit", language)}
                            onClick={() => openEditImportantDay(item)}
                          />
                          <IconButton
                            icon="fa-solid fa-trash"
                            label={t(
                              "calendarTab.importantDayDelete",
                              language,
                            )}
                            className="delete"
                            onClick={() => handleDeleteImportantDay(item)}
                          />
                        </>
                      ) : null}
                    </div>

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
        title={
          editingImportantDayId
            ? t("calendarTab.importantDayEditModalTitle", language)
            : t("calendarTab.importantDayModalTitle", language)
        }
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

          <div style={{ display: "flex", gap: "8px" }}>
            <div className="field">
              <label htmlFor="modal-important-date">
                {t("calendarTab.importantDayDateLabel", language)}
              </label>
              <input
                id="modal-important-date"
                className="input"
                type="text"
                value={importantDateDisplay}
                placeholder={t("calendarTab.importantDayDateLabel", language)}
                readOnly
                onMouseDown={() => setIsImportantDatePickerOpen(true)}
              />
            </div>

            <TimePicker
              label={t("calendarTab.importantDayTimeLabel", language)}
              value={importantTime}
              onChange={setImportantTime}
              language={language}
              defaultFormat="24"
            />
          </div>

          {isAdmin ? (
            <div className="field">
              <label className="important-day-global-toggle">
                <input
                  type="checkbox"
                  checked={isGlobalImportantDay}
                  onChange={(event) =>
                    setIsGlobalImportantDay(event.target.checked)
                  }
                  disabled={editingImportantDayIsGlobal}
                />
                <span>
                  {t("calendarTab.importantDayGlobalToggle", language)}
                </span>
              </label>
            </div>
          ) : null}

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

      <Modal
        isOpen={isImportantDatePickerOpen}
        onClose={() => setIsImportantDatePickerOpen(false)}
        title={t("calendarTab.importantDayDateLabel", language)}
      >
        <DatePicker
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
          onSelectDay={(isoDate) => {
            setImportantDate(isoDate);
            setImportantModalMonth(
              getMonthCursorFromISO(isoDate, calendarType),
            );
            setIsImportantDatePickerOpen(false);
          }}
          language={language}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("common.confirmDelete", language)}
        message={t("calendarTab.importantDayDeleteConfirmMessage", language)}
        confirmLabel={t("calendarTab.importantDayDelete", language)}
        cancelLabel={t("common.cancel", language)}
        onConfirm={confirmDeleteImportantDay}
        confirmVariant="danger"
      />
    </Card>
  );
}

export default memo(CalendarTab);
