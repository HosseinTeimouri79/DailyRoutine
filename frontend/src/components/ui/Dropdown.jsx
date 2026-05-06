import { useState, useRef, useEffect } from "react";

export default function Dropdown({
  options = [],
  placeholder = "Select...",
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef();

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
    onSelect && onSelect(option);
  };

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-64" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex justify-between items-center px-4 py-2 border rounded-lg bg-white shadow-sm hover:bg-gray-50"
      >
        <span className="text-sm">
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu */}
      {isOpen && (
        <div className="absolute mt-2 w-full bg-white border rounded-lg shadow-lg z-50">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">No options</div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
