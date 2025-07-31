import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  options: { value: string; text: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Find the selected option text
  const selectedOptionText = options.find((option) => option.value === value)?.text || placeholder;

  return (
    <div ref={selectRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 
          bg-white dark:bg-black/20 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-black/30 
          transition-all duration-200 ${className}`}
      >
        <span className="truncate text-sm">{selectedOptionText}</span>
        <ChevronDown
          size={16}
          className={`transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } text-gray-400 dark:text-gray-500`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700/50 
          rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm
                  transition-colors duration-200
                  ${value === option.value
                    ? "bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black/20"
                  }`}
                style={{ fontFamily: option.value ,fontWeight: option.value }}
              >
                <span className="truncate">{option.text}</span>
                {value === option.value && (
                  <Check size={14} className="text-primary ml-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
