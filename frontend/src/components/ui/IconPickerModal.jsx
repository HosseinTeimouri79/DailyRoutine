import { useMemo, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { t } from "../../lib/i18n";
import "./IconPickerModal.css";

const ICON_CATEGORIES = [
  {
    id: "general",
    label: "General",
    icons: [
      "fa-solid fa-star",
      "fa-solid fa-heart",
      "fa-solid fa-bell",
      "fa-solid fa-flag",
      "fa-solid fa-calendar-days",
      "fa-solid fa-bookmark",
    ],
  },
  {
    id: "celebration",
    label: "Celebration",
    icons: [
      "fa-solid fa-gift",
      "fa-solid fa-cake-candles",
      "fa-solid fa-trophy",
      "fa-solid fa-sparkles",
      "fa-solid fa-fireworks",
      "fa-solid fa-glass-cheers",
    ],
  },
  {
    id: "travel",
    label: "Travel",
    icons: [
      "fa-solid fa-plane",
      "fa-solid fa-location-dot",
      "fa-solid fa-road",
      "fa-solid fa-umbrella-beach",
      "fa-solid fa-car",
      "fa-solid fa-hotel",
    ],
  },
];

const COLOR_OPTIONS = [
  "#ffbe0b",
  "#fb5607",
  "#ff006e",
  "#8338ec",
  "#3a86ff",
  "#06d6a0",
  "#2a9d8f",
  "#264653",
  "#f4a261",
  "#e76f51",
];

export default function IconPickerModal({
  isOpen,
  onClose,
  title,
  selectedIcon,
  selectedColor,
  onSelectIcon,
  onSelectColor,
  onConfirm,
  language = "fa",
}) {
  const [activeCategory, setActiveCategory] = useState(ICON_CATEGORIES[0].id);
  const category = useMemo(
    () => ICON_CATEGORIES.find((item) => item.id === activeCategory),
    [activeCategory],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="icon-picker-modal">
        <div className="icon-picker-header">
          <div className="icon-picker-preview">
            <span className="icon-picker-preview-label">
              {t("calendarTab.importantDayIconSelected", language)}
            </span>
            <span
              className="icon-picker-preview-icon"
              style={{ color: selectedColor }}
            >
              <i className={selectedIcon} aria-hidden="true" />
            </span>
          </div>
          <div className="icon-picker-color-label">
            {t("calendarTab.importantDayIconColorLabel", language)}
          </div>
        </div>

        <div className="icon-picker-categories">
          {ICON_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`icon-picker-category-button ${
                activeCategory === item.id ? "selected" : ""
              }`.trim()}
              onClick={() => setActiveCategory(item.id)}
            >
              {t(`calendarTab.iconCategory.${item.id}`, language)}
            </button>
          ))}
        </div>

        <div className="icon-picker-grid">
          {category?.icons.map((iconClass) => (
            <button
              key={iconClass}
              type="button"
              className={`icon-picker-icon-option ${
                selectedIcon === iconClass ? "selected" : ""
              }`.trim()}
              onClick={() => onSelectIcon(iconClass)}
            >
              <i className={iconClass} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="icon-picker-colors">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              className={`icon-picker-color-swatch ${
                selectedColor === color ? "selected" : ""
              }`.trim()}
              onClick={() => onSelectColor(color)}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="icon-picker-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel", language)}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {t("calendarTab.importantDayIconSave", language)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
