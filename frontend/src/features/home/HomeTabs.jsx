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
    <div className="flex flex-wrap gap-2 mb-0.5 max-[720px]:grid max-[720px]:grid-cols-4 max-[720px]:gap-1.5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={[
            "no-underline px-3.5 py-2.5 rounded-sm border border-border-default",
            "bg-surface text-text-secondary max-w-full whitespace-normal inline-flex items-center gap-1.5",
            "[overflow-wrap:anywhere] [word-break:break-word] cursor-pointer font-inherit",
            "max-[720px]:text-center max-[720px]:px-1.5 max-[720px]:py-2",
            "max-[720px]:text-[0.82rem] max-[720px]:leading-[1.35]",
            activeTab === tab.id
              ? "text-primary border-border-accent bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-bg-surface))]"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onChange(tab.id)}
          title={t(tab.labelKey, language)}
          aria-pressed={activeTab === tab.id}
        >
          <i className={`text-[0.9rem] ${tab.icon}`} aria-hidden="true" />
          <span>{t(tab.labelKey, language)}</span>
        </button>
      ))}
    </div>
  );
}

export default memo(HomeTabs);
