import { memo } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import { formatDateTimeFromSql } from "../../lib/date";
import { t } from "../../lib/i18n";
// Notes styles moved to Tailwind utilities in component

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

const NoteListItem = memo(function NoteListItem({
  note,
  onEdit,
  onDelete,
  language,
  calendarType,
}) {
  const displayDate = getNoteDisplayDate(note, language, calendarType);

  return (
    <li className="note-item">
      <p className="note-content">{note.content}</p>
      <div className="note-meta-row">
        <span className="note-date muted">
          {displayDate.label}: {displayDate.value}
        </span>
        <div className="note-actions">
          <IconButton
            icon="fa-solid fa-pen"
            label={t("notes.edit", language)}
            onClick={() => onEdit(note)}
          />
          <IconButton
            icon="fa-solid fa-trash"
            label={t("notes.delete", language)}
            className="delete"
            onClick={() => onDelete(note)}
          />
        </div>
      </div>
    </li>
  );
});

function Notes({
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
        <Button icon="fa-solid fa-plus" onClick={onOpenAdd}>
          {t("notes.add", language)}
        </Button>
      </div>

      {notesLoading ? (
        <p className="text-text-muted">{t("notes.loading", language)}</p>
      ) : null}

      {!notesLoading && !notes.length ? (
        <p className="empty-state-message">{t("notes.noNotes", language)}</p>
      ) : null}

      <ul className="notes-list">
        {notes.map((note) => (
          <NoteListItem
            key={note.id}
            note={note}
            onEdit={onOpenEdit}
            onDelete={onRequestDelete}
            language={language}
            calendarType={calendarType}
          />
        ))}
      </ul>
    </Card>
  );
}

export default memo(Notes);
