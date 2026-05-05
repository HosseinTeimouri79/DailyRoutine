import { memo, useCallback, useMemo, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { t } from "../../lib/i18n";

const ICON_CATEGORIES = [
  {
    id: "general",
    fa: "fa-solid fa-shapes",
    icons: [
      "fa-solid fa-star","fa-solid fa-heart","fa-solid fa-bell","fa-solid fa-flag",
      "fa-solid fa-bookmark","fa-solid fa-tag","fa-solid fa-circle-info",
      "fa-solid fa-circle-check","fa-solid fa-circle-xmark","fa-solid fa-circle-exclamation",
      "fa-solid fa-circle-question","fa-solid fa-lightbulb","fa-solid fa-thumbs-up",
      "fa-solid fa-thumbs-down","fa-solid fa-eye","fa-solid fa-lock",
      "fa-solid fa-unlock","fa-solid fa-shield-halved",
    ],
  },
  {
    id: "celebration",
    fa: "fa-solid fa-party-horn",
    icons: [
      "fa-solid fa-gift","fa-solid fa-cake-candles","fa-solid fa-trophy","fa-solid fa-sparkles",
      "fa-solid fa-champagne-glasses","fa-solid fa-medal","fa-solid fa-ribbon","fa-solid fa-crown",
      "fa-solid fa-award","fa-solid fa-fire","fa-solid fa-bolt","fa-solid fa-wand-magic-sparkles",
      "fa-solid fa-music","fa-solid fa-masks-theater","fa-solid fa-dice","fa-solid fa-gamepad",
      "fa-solid fa-puzzle-piece","fa-solid fa-bullhorn",
    ],
  },
  {
    id: "calendar",
    fa: "fa-solid fa-calendar-days",
    icons: [
      "fa-solid fa-calendar-days","fa-solid fa-calendar-check","fa-solid fa-calendar-plus",
      "fa-solid fa-calendar-xmark","fa-solid fa-clock","fa-solid fa-hourglass-half",
      "fa-solid fa-stopwatch","fa-solid fa-alarm-clock","fa-regular fa-clock",
      "fa-solid fa-calendar-week","fa-solid fa-calendar","fa-solid fa-timer",
      "fa-solid fa-business-time","fa-solid fa-timeline","fa-solid fa-history",
      "fa-solid fa-rotate-right","fa-solid fa-rotate-left","fa-solid fa-arrows-rotate",
    ],
  },
  {
    id: "travel",
    fa: "fa-solid fa-plane",
    icons: [
      "fa-solid fa-plane","fa-solid fa-plane-departure","fa-solid fa-plane-arrival",
      "fa-solid fa-location-dot","fa-solid fa-map","fa-solid fa-map-location-dot",
      "fa-solid fa-compass","fa-solid fa-road","fa-solid fa-car","fa-solid fa-train",
      "fa-solid fa-bus","fa-solid fa-ship","fa-solid fa-umbrella-beach",
      "fa-solid fa-mountain","fa-solid fa-campground","fa-solid fa-tent",
      "fa-solid fa-hotel","fa-solid fa-suitcase",
    ],
  },
  {
    id: "health",
    fa: "fa-solid fa-heart-pulse",
    icons: [
      "fa-solid fa-heart-pulse","fa-solid fa-dumbbell","fa-solid fa-person-running",
      "fa-solid fa-bicycle","fa-solid fa-apple-whole","fa-solid fa-salad","fa-solid fa-pills",
      "fa-solid fa-syringe","fa-solid fa-stethoscope","fa-solid fa-hospital",
      "fa-solid fa-bed-pulse","fa-solid fa-tooth","fa-solid fa-brain",
      "fa-solid fa-eye-dropper","fa-solid fa-scale-balanced","fa-solid fa-spa",
      "fa-solid fa-hand-holding-heart","fa-solid fa-droplet",
    ],
  },
  {
    id: "work",
    fa: "fa-solid fa-briefcase",
    icons: [
      "fa-solid fa-briefcase","fa-solid fa-laptop","fa-solid fa-computer",
      "fa-solid fa-keyboard","fa-solid fa-mouse","fa-solid fa-print","fa-solid fa-fax",
      "fa-solid fa-phone","fa-solid fa-envelope","fa-solid fa-file","fa-solid fa-file-lines",
      "fa-solid fa-file-pdf","fa-solid fa-folder","fa-solid fa-chart-bar",
      "fa-solid fa-chart-line","fa-solid fa-chart-pie","fa-solid fa-magnifying-glass-chart",
      "fa-solid fa-handshake",
    ],
  },
  {
    id: "education",
    fa: "fa-solid fa-graduation-cap",
    icons: [
      "fa-solid fa-graduation-cap","fa-solid fa-book","fa-solid fa-book-open",
      "fa-solid fa-book-open-reader","fa-solid fa-pen","fa-solid fa-pencil",
      "fa-solid fa-pen-ruler","fa-solid fa-ruler","fa-solid fa-calculator",
      "fa-solid fa-microscope","fa-solid fa-flask","fa-solid fa-atom",
      "fa-solid fa-chalkboard-user","fa-solid fa-school","fa-solid fa-university",
      "fa-solid fa-certificate","fa-solid fa-brain","fa-solid fa-lightbulb",
    ],
  },
  {
    id: "nature",
    fa: "fa-solid fa-leaf",
    icons: [
      "fa-solid fa-leaf","fa-solid fa-tree","fa-solid fa-seedling","fa-solid fa-flower",
      "fa-solid fa-sun","fa-solid fa-moon","fa-solid fa-cloud","fa-solid fa-cloud-sun",
      "fa-solid fa-cloud-rain","fa-solid fa-snowflake","fa-solid fa-rainbow","fa-solid fa-wind",
      "fa-solid fa-fire-flame-curved","fa-solid fa-water","fa-solid fa-mountain-sun",
      "fa-solid fa-globe","fa-solid fa-earth-americas","fa-solid fa-paw",
    ],
  },
  {
    id: "food",
    fa: "fa-solid fa-utensils",
    icons: [
      "fa-solid fa-utensils","fa-solid fa-pizza-slice","fa-solid fa-burger",
      "fa-solid fa-bowl-food","fa-solid fa-mug-hot","fa-solid fa-coffee",
      "fa-solid fa-wine-glass","fa-solid fa-beer-mug-empty","fa-solid fa-martini-glass",
      "fa-solid fa-cake-slice","fa-solid fa-ice-cream","fa-solid fa-candy",
      "fa-solid fa-cookie","fa-solid fa-carrot","fa-solid fa-apple-whole",
      "fa-solid fa-lemon","fa-solid fa-kitchen-set","fa-solid fa-plate-wheat",
    ],
  },
  {
    id: "finance",
    fa: "fa-solid fa-coins",
    icons: [
      "fa-solid fa-coins","fa-solid fa-money-bill","fa-solid fa-money-bill-wave",
      "fa-solid fa-wallet","fa-solid fa-credit-card","fa-solid fa-piggy-bank",
      "fa-solid fa-building-columns","fa-solid fa-hand-holding-dollar","fa-solid fa-chart-line",
      "fa-solid fa-arrow-trend-up","fa-solid fa-arrow-trend-down","fa-solid fa-percent",
      "fa-solid fa-receipt","fa-solid fa-file-invoice-dollar","fa-solid fa-cash-register",
      "fa-solid fa-bag-shopping","fa-solid fa-cart-shopping","fa-solid fa-tag",
    ],
  },
  {
    id: "home",
    fa: "fa-solid fa-house",
    icons: [
      "fa-solid fa-house","fa-solid fa-house-chimney","fa-solid fa-bed","fa-solid fa-couch",
      "fa-solid fa-bath","fa-solid fa-kitchen-set","fa-solid fa-shirt","fa-solid fa-broom",
      "fa-solid fa-screwdriver-wrench","fa-solid fa-hammer","fa-solid fa-paintbrush",
      "fa-solid fa-paint-roller","fa-solid fa-lightbulb","fa-solid fa-plug",
      "fa-solid fa-faucet","fa-solid fa-tv","fa-solid fa-key","fa-solid fa-door-open",
    ],
  },
  {
    id: "social",
    fa: "fa-solid fa-users",
    icons: [
      "fa-solid fa-users","fa-solid fa-user","fa-solid fa-user-group","fa-solid fa-user-tie",
      "fa-solid fa-baby","fa-solid fa-child","fa-solid fa-person","fa-solid fa-people-group",
      "fa-solid fa-comments","fa-solid fa-comment","fa-solid fa-message",
      "fa-solid fa-share-nodes","fa-solid fa-at","fa-solid fa-hashtag",
      "fa-solid fa-phone-volume","fa-solid fa-video","fa-solid fa-hand-wave",
      "fa-solid fa-handshake",
    ],
  },
];

const COLOR_OPTIONS = [
  { hex: "#ffbe0b", label: "زرد" },{ hex: "#fb5607", label: "نارنجی" },
  { hex: "#ff006e", label: "صورتی" },{ hex: "#8338ec", label: "بنفش" },
  { hex: "#3a86ff", label: "آبی" },{ hex: "#06d6a0", label: "سبز آبی" },
  { hex: "#2a9d8f", label: "فیروزه‌ای" },{ hex: "#e63946", label: "قرمز" },
  { hex: "#f4a261", label: "هلویی" },{ hex: "#457b9d", label: "آبی خاکستری" },
  { hex: "#2dc653", label: "سبز" },{ hex: "#9b2226", label: "قرمز تیره" },
  { hex: "#7b2d8b", label: "بنفش تیره" },{ hex: "#0077b6", label: "آبی اقیانوس" },
  { hex: "#6d6875", label: "خاکستری بنفش" },{ hex: "#264653", label: "سبز شب" },
  { hex: "#c77dff", label: "لیلاک" },{ hex: "#4cc9f0", label: "آبی آسمانی" },
  { hex: "#f72585", label: "سرخابی" },{ hex: "#606c38", label: "زیتونی" },
];

const CategoryTab = memo(({ category, isActive, onClick, language }) => (
  <button
    type="button"
    className={[
      "inline-flex flex-col items-center gap-1 shrink-0 px-2.5 py-2 w-14",
      "border rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] cursor-pointer text-[0.7rem]",
      "transition-colors duration-150 max-[480px]:px-2 max-[480px]:py-1.5",
      isActive
        ? "bg-[var(--color-primary-soft)] border-[var(--color-accent-border)] text-[var(--color-primary)] font-semibold"
        : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-soft)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]",
    ].join(" ")}
    onClick={onClick}
    title={t(`calendarTab.iconCategory.${category.id}`, language)}
    aria-pressed={isActive}
  >
    <i className={`${category.fa} text-[0.95rem]`} aria-hidden="true" />
    <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[56px]">
      {t(`calendarTab.iconCategory.${category.id}`, language)}
    </span>
  </button>
));

const IconBtn = memo(({ iconClass, isSelected, onClick }) => (
  <button
    type="button"
    className={[
      "inline-flex items-center justify-center aspect-square border rounded-[var(--radius-sm)]",
      "text-[var(--color-text-secondary)] cursor-pointer text-base transition duration-150",
      "hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] hover:border-[var(--color-accent-border)] hover:-translate-y-[1px]",
      isSelected
        ? "bg-[var(--color-primary-soft)] border-[var(--color-primary)] text-[var(--color-primary)] [box-shadow:0_0_0_2px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
        : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-soft)]",
    ].join(" ")}
    onClick={onClick}
    aria-pressed={isSelected}
  >
    <i className={iconClass} aria-hidden="true" />
  </button>
));

const ColorSwatch = memo(({ color, isSelected, onClick }) => (
  <button
    type="button"
    className={[
      "w-full aspect-square rounded-full border-2 cursor-pointer transition duration-150",
      "hover:scale-[1.15]",
      isSelected
        ? "border-[var(--color-text-primary)] scale-110 [box-shadow:0_0_0_2px_var(--color-bg-surface),0_0_0_4px_currentColor]"
        : "border-transparent",
    ].join(" ")}
    onClick={onClick}
    style={{ backgroundColor: color.hex }}
    title={color.label}
    aria-label={color.label}
    aria-pressed={isSelected}
  />
));

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
  const [activeCategoryId, setActiveCategoryId] = useState(ICON_CATEGORIES[0].id);

  const activeCategory = useMemo(
    () => ICON_CATEGORIES.find((c) => c.id === activeCategoryId) ?? ICON_CATEGORIES[0],
    [activeCategoryId],
  );

  const displayedIcons = useMemo(() => activeCategory.icons, [activeCategory]);

  const handleCategoryClick = useCallback((id) => setActiveCategoryId(id), []);
  const handleIconClick = useCallback((iconClass) => onSelectIcon(iconClass), [onSelectIcon]);
  const handleColorClick = useCallback((hex) => onSelectColor(hex), [onSelectColor]);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleConfirm = useCallback(() => onConfirm(), [onConfirm]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="grid gap-3.5">
        {/* Preview */}
        <div className="flex items-center gap-3 px-3.5 py-3 bg-[var(--color-bg-surface-soft)] border border-[var(--color-border-default)] rounded-[var(--radius-md)]">
          <div
            className="inline-flex items-center justify-center w-[46px] h-[46px] shrink-0 rounded-[12px] bg-[var(--color-bg-surface)] border border-[var(--color-border-strong)] text-[1.3rem] transition-colors duration-200"
            style={{ color: selectedColor }}
          >
            <i className={selectedIcon} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[0.8rem] text-[var(--color-text-secondary)]">
              {t("calendarTab.importantDayIconSelected", language)}
            </span>
            <code className="text-[0.75rem] text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-[7px] py-[2px] rounded-[6px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px] max-[480px]:max-w-[160px] font-mono">
              {selectedIcon}
            </code>
          </div>
        </div>

        <div className="text-[0.82rem] font-semibold text-[var(--color-text-secondary)] -mb-1.5">
          {t("calendarTab.importantDayIconCategoryLabel", language)}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {ICON_CATEGORIES.map((cat) => (
            <CategoryTab
              key={cat.id}
              category={cat}
              isActive={cat.id === activeCategoryId}
              onClick={() => handleCategoryClick(cat.id)}
              language={language}
            />
          ))}
        </div>

        <div className="text-[0.82rem] font-semibold text-[var(--color-text-secondary)] -mb-1.5">
          {t("calendarTab.importantDayIconLabel", language)}
        </div>

        {/* Icon grid */}
        <div
          className="grid grid-cols-9 gap-1.5 max-h-[220px] overflow-y-auto max-[480px]:grid-cols-7 [scrollbar-width:thin] [scrollbar-color:var(--color-accent-border)_transparent]"
          role="listbox"
          aria-label="icons"
        >
          {displayedIcons.length > 0 ? (
            displayedIcons.map((iconClass) => (
              <IconBtn
                key={iconClass}
                iconClass={iconClass}
                isSelected={selectedIcon === iconClass}
                onClick={() => handleIconClick(iconClass)}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-[var(--color-text-muted)] py-4 m-0 text-[0.88rem]">
              نتیجه‌ای یافت نشد
            </p>
          )}
        </div>

        {/* Color picker */}
        <div className="text-[0.82rem] font-semibold text-[var(--color-text-secondary)] -mb-1.5">
          {t("calendarTab.importantDayIconColorLabel", language)}
        </div>
        <div className="grid grid-cols-10 gap-[7px]" role="listbox" aria-label="colors">
          {COLOR_OPTIONS.map((color) => (
            <ColorSwatch
              key={color.hex}
              color={color}
              isSelected={selectedColor === color.hex}
              onClick={() => handleColorClick(color.hex)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-[var(--color-border-soft)]">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t("common.cancel", language)}
          </Button>
          <Button type="button" onClick={handleConfirm}>
            {t("calendarTab.importantDayIconSave", language)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
