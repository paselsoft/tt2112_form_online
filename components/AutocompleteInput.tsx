import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface AutocompleteInputProps {
    label: string;
    name: string;
    value: string;
    error?: string;
    placeholder?: string;
    maxLength?: number;
    suggestions: string[];
    onSelect: (value: string) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearch: (query: string) => void;
    width?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
    label,
    name,
    value,
    error,
    placeholder,
    maxLength,
    suggestions,
    onSelect,
    onChange,
    onSearch,
    width = "w-full"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    console.log('[DEBUG] Autocomplete Render. Value:', value);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('[DEBUG] Autocomplete effect running. Value:', value);
            if (value && value.length >= 2) {
                console.log('[DEBUG] Calling onSearch with:', value);
                onSearch(value);
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [value, onSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                    handleSelect(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    }, [isOpen, highlightedIndex, suggestions]);

    const handleSelect = (suggestion: string) => {
        onSelect(suggestion);
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        setHighlightedIndex(-1);
    };

    return (
        <div className={width} ref={wrapperRef}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {label} {error && <span className="text-red-600 normal-case ml-1">({error})</span>}
            </label>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    value={value || ''}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => value && value.length >= 2 && setIsOpen(true)}
                    maxLength={maxLength}
                    autoComplete="off"
                    className={`w-full px-3 py-2.5 pr-10 rounded-lg outline-none transition-all shadow-sm uppercase font-bold text-sm bg-white text-slate-800 placeholder-slate-300 border-2 border-red-500 ${error
                        ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                        }`}
                    placeholder={placeholder}
                />
                <ChevronDown
                    size={16}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />

                {isOpen && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSelect(suggestion)}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${index === highlightedIndex
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutocompleteInput;
