import Card from "../ui/Card";
import Button from "../ui/Button";
import { formatPersianDateTimeFromSql } from "../../lib/date";
import "./Notes.css";

function getNoteDisplayDate(note) {
  const hasEdit =
    note.updated_at && note.created_at && note.updated_at !== note.created_at;
  return {
    label: hasEdit ? "آخرین ویرایش" : "تاریخ ایجاد",
    value: formatPersianDateTimeFromSql(
      hasEdit ? note.updated_at : note.created_at,
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
}) {
  return (
    <Card
      title="یادداشت‌ها"
      subtitle="یادداشت‌های شخصی را جستجو، ویرایش و حذف کن"
    >
      <div className="notes-toolbar">
        <input
          className="input"
          placeholder="جستجو در یادداشت‌ها"
          value={notesSearch}
          onChange={(event) => setNotesSearch(event.target.value)}
        />
        <Button onClick={onOpenAdd}>افزودن یادداشت</Button>
      </div>

      {notesLoading ? <p className="muted">در حال بارگذاری...</p> : null}

      {!notesLoading && !notes.length ? (
        <p className="muted">یادداشتی برای نمایش وجود ندارد.</p>
      ) : null}

      <ul className="notes-list">
        {notes.map((note) => {
          const displayDate = getNoteDisplayDate(note);
          return (
            <li className="note-item" key={note.id}>
              <p className="note-content">{note.content}</p>
              <div className="note-meta-row">
                <span className="note-date muted">
                  {displayDate.label}: {displayDate.value}
                </span>
                <div className="note-actions">
                  <button
                    className="routine-icon-btn"
                    onClick={() => onOpenEdit(note)}
                    title="ویرایش یادداشت"
                  >
                    <i className="fa-solid fa-pen" aria-hidden="true" />
                  </button>
                  <button
                    className="routine-icon-btn delete"
                    onClick={() => onRequestDelete(note)}
                    title="حذف یادداشت"
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
