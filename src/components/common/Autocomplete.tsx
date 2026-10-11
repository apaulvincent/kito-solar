// src/components/common/Autocomplete.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export interface AutocompleteProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  getOptionLabel: (option: T) => string;
  getOptionKey?: (option: T) => string | number;
  isOptionEqualToValue?: (option: T, value: T) => boolean;
  renderOption?: (
    option: T,
    state: { selected: boolean; active: boolean; inputValue: string }
  ) => ReactNode;
  filterOptions?: (
    options: T[],
    state: { inputValue: string; getOptionLabel: (opt: T) => string }
  ) => T[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  noOptionsText?: ReactNode;
  id?: string;
  ariaLabel?: string;
}

/**
 * Text highlight helper that highlights the matched query inside an option label
 */
export function HighlightMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query.trim()) return <span>{text}</span>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200/80 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 font-bold rounded-xs px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function Autocomplete<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionKey,
  isOptionEqualToValue,
  renderOption,
  filterOptions,
  placeholder = 'Select option...',
  disabled = false,
  clearable = true,
  className = '',
  noOptionsText = 'No matching options found',
  id,
  ariaLabel,
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() =>
    value ? getOptionLabel(value) : ''
  );
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync input text with currently selected value when dropdown closes or value changes
  useEffect(() => {
    if (!isOpen) {
      setInputValue(value ? getOptionLabel(value) : '');
    }
  }, [value, getOptionLabel, isOpen]);

  // Default equality comparison
  const defaultIsOptionEqualToValue = useCallback(
    (opt: T, val: T): boolean => {
      if (getOptionKey) {
        return getOptionKey(opt) === getOptionKey(val);
      }
      return getOptionLabel(opt) === getOptionLabel(val);
    },
    [getOptionKey, getOptionLabel]
  );

  const areEqual = isOptionEqualToValue || defaultIsOptionEqualToValue;

  // Filter options based on input value
  const filteredOptions = useMemo(() => {
    if (filterOptions) {
      return filterOptions(options, { inputValue, getOptionLabel });
    }
    const q = inputValue.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter((opt) =>
      getOptionLabel(opt).toLowerCase().includes(q)
    );
  }, [options, inputValue, filterOptions, getOptionLabel]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
        setInputValue(value ? getOptionLabel(value) : '');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, getOptionLabel]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-autocomplete-item]');
      const activeEl = items[activeIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleSelect = (option: T) => {
    onChange(option);
    setInputValue(getOptionLabel(option));
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setInputValue('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        setInputValue(value ? getOptionLabel(value) : '');
        break;
      case 'Tab':
        setIsOpen(false);
        setActiveIndex(-1);
        setInputValue(value ? getOptionLabel(value) : '');
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {/* Input container */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`flex items-center w-full bg-white dark:bg-slate-800 border rounded-lg transition-all shadow-xs cursor-text ${
          isOpen
            ? 'border-amber-600 ring-2 ring-amber-500/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <div className="pl-2.5 text-slate-400 dark:text-slate-500 flex-shrink-0">
          <Search className="w-3.5 h-3.5" />
        </div>

        <input
          ref={inputRef}
          id={id}
          aria-label={ariaLabel}
          type="text"
          disabled={disabled}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent px-2.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
        />

        {/* Clear Button */}
        {clearable && !disabled && (value || inputValue) && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear selection"
            className="p-1 mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown Chevron */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }
          }}
          className="pr-2.5 pl-1 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-transform duration-200"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''
            }`}
          />
        </button>
      </div>

      {/* Floating Dropdown Menu (Direct options list without count or sort header) */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {noOptionsText}
              </li>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = Boolean(value && areEqual(option, value));
                const isActive = activeIndex === idx;
                const key = getOptionKey ? getOptionKey(option) : getOptionLabel(option) + idx;

                return (
                  <li
                    key={key}
                    data-autocomplete-item
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-semibold'
                        : isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {renderOption ? (
                        renderOption(option, {
                          selected: isSelected,
                          active: isActive,
                          inputValue,
                        })
                      ) : (
                        <HighlightMatch
                          text={getOptionLabel(option)}
                          query={inputValue}
                        />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
