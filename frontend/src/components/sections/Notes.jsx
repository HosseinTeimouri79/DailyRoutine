import { memo } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import Input from "../ui/Input";
import { formatDateTimeFromSql } from "../../lib/date";
import { t } from "../../lib/i18n";

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
    <li className="border rounded-md p-3 bg-[var(--color-bg-surface-soft)] grid gap-[10px]">
      <p className="m-0 text-[var(--color-text-primary)] whitespace-pre-wrap break-words leading-[1.7]">
        {note.content}
      </p>
      <div className="flex items-center justify-between gap-[10px] max-[720px]:flex-col max-[720px]:items-start">
        <span className="text-[0.84rem] text-[var(--color-text-secondary)]">
          {displayDate.label}: {displayDate.value}
        </span>
        <div className="inline-flex gap-[6px]">
          <IconButton
            icon="fa-solid fa-pen"
            label={t("notes.edit", language)}
            onClick={() => onEdit(note)}
          />
          <IconButton
            icon="fa-solid fa-trash"
            label={t("notes.delete", language)}
            className="bg-[var(--color-danger-soft)] border border-[var(--color-danger-border)] text-[var(--color-danger)]"
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
      <div className="flex gap-2 mb-3">
        <Input
          placeholder={t("notes.searchPlaceholder", language)}
          value={notesSearch}
          onChange={(event) => setNotesSearch(event.target.value)}
        />
        <Button icon="fa-solid fa-plus" onClick={onOpenAdd}>
          {t("notes.add", language)}
        </Button>
      </div>

      {notesLoading ? (
        <p className="text-muted">{t("notes.loading", language)}</p>
      ) : null}

      {!notesLoading && !notes.length ? (
        <p className="mt-3 border rounded-md p-3 text-center text-[var(--color-text-secondary)] bg-[var(--color-bg-surface-soft)]">
          {t("notes.noNotes", language)}
        </p>
      ) : null}

      <ul className="list-none m-0 p-0 grid gap-[10px]">
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
