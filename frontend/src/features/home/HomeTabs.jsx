import { memo } from "react";
import { t } from "../../lib/i18n";

const TABS = [
  {
    id: "calendar",
    icon: "fa-solid fa-calendar-days",
    labelKey: "calendarTab.title",
  },
  {
    id: "weekly",
    icon: "fa-solid fa-calendar-week",
    labelKey: "weekly.title",
  },
  {
    id: "tasks",
    icon: "fa-solid fa-list-check",
    labelKey: "dailyTasks.title",
  },
  {
    id: "notes",
    icon: "fa-solid fa-file-lines",
    labelKey: "notes.title",
  },
];

function HomeTabs({ activeTab, onChange, language }) {
  return (
    <div className="nav-tabs page-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab tab-btn ${activeTab === tab.id ? "active" : ""}`.trim()}
          onClick={() => onChange(tab.id)}
          title={t(tab.labelKey, language)}
          aria-pressed={activeTab === tab.id}
        >
          <i className={`tab-icon ${tab.icon}`} aria-hidden="true" />
          <span className="tab-label">{t(tab.labelKey, language)}</span>
        </button>
      ))}
    </div>
  );
}

export default memo(HomeTabs);
