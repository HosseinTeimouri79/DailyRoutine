import Card from "../ui/Card";
import Button from "../ui/Button";
import { formatDateTimeFromSql } from "../../lib/date";
import { t } from "../../lib/i18n";
import "./Notes.css";

function getNoteDisplayDate(note, language, calendarType) {
  const hasEdit =
    note.updated_at && note.created_at && note.updated_at !== note.created_at;
  return {
    label: hasEdit
      ? t("notes.updatedDate", language)
      : t("notes.createdDate", language),
    value: formatDateTimeFromSql(
      hasEdit ? note.updated_at : note.created_at,
      language,
      calendarType,
    ),
  };
}

export default function Notes({
  notes,
  notesLoading,
  notesSearch,
  setNotesSearch,
  onOpenAdd,
  onOpenEdit,
  onRequestDelete,
  language,
  calendarType,
}) {
  return (
    <Card
      title={t("notes.title", language)}
      subtitle={t("notes.subtitle", language)}
    >
      <div className="notes-toolbar">
        <input
          className="input"
          placeholder={t("notes.searchPlaceholder", language)}
          value={notesSearch}
          onChange={(event) => setNotesSearch(event.target.value)}
        />
        <Button onClick={onOpenAdd}>{t("notes.add", language)}</Button>
      </div>

      {notesLoading ? (
        <p className="muted">{t("notes.loading", language)}</p>
      ) : null}

      {!notesLoading && !notes.length ? (
        <p className="empty-state-message">{t("notes.noNotes", language)}</p>
      ) : null}

      <ul className="notes-list">
        {notes.map((note) => {
          const displayDate = getNoteDisplayDate(note, language, calendarType);
          return (
            <li className="note-item" key={note.id}>
              <p className="note-content">{note.content}</p>
              <div className="note-meta-row">
                <span className="note-date muted">
                  {displayDate.label}: {displayDate.value}
                </span>
                <div className="note-actions">
                  <button
                    className="icon-btn"
                    onClick={() => onOpenEdit(note)}
                    title={t("notes.edit", language)}
                  >
                    <i className="fa-solid fa-pen" aria-hidden="true" />
                  </button>
                  <button
                    className="icon-btn delete"
                    onClick={() => onRequestDelete(note)}
                    title={t("notes.delete", language)}
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
