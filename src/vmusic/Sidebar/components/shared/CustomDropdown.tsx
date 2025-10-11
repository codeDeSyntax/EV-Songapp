import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Access local theme from parent component instead of Redux
  const [localTheme, setLocalTheme] = useState(
    localStorage.getItem("bmusictheme") || "white"
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue =
    options.find((opt) => opt.value === value)?.label || value;

  return (
    <div className="relative " ref={dropdownRef}>
      {label && (
        <label
          className="text-sm font-thin mb-1 block"
          style={{ fontFamily: "Georgia" }}
        >
          {label}
        </label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 rounded-lg ${
          localTheme === "creamy" ? "bg-primary/20 " : "bg-gray-50"
        } text-[12px] border border-stone-200 flex items-center justify-between hover:bg-white/60 transition-colors`}
        style={{ fontFamily: label === "Font Family" ? value : undefined }}
      >
        <span>{displayValue as string}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute z-40 w-full mt-1 flex flex-col items-center gap-1 py-3 ${
            localTheme === "creamy" ? "bg-[#faeed1]" : "bg-white"
          } rounded-lg shadow-lg border border-stone-200 py-1 max-h-48 overflow-y-auto no-scrollbar`}
        >
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-[90%] px-3 border-x-0 cursor-pointer border-t-0 border-b border-solid border-primary/20 text-left text-[12px] hover:[#9a674a]/40 hover:text-black transition-colors ${
                (option.value || option) === value
                  ? "bg-transparent text-orange-400"
                  : localTheme === "creamy"
                  ? "bg-transparent text-primary"
                  : "bg-gray-50 border text-stone-500"
              }`}
              style={{
                fontFamily: label === "Font Family" ? option.value : undefined,
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
