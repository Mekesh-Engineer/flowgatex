import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { EventItem } from './types';

interface Props {
    value: string;
    onChange: (v: string) => void;
    onSearch: () => void;
    events?: EventItem[];
}

export default function SearchAutocomplete({ value, onChange, onSearch, events = [] }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const suggestions = value.length > 1
        ? events.filter(e =>
            e.title.toLowerCase().includes(value.toLowerCase()) ||
            e.category.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5)
        : [];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch();
            setOpen(false);
        }
    };

    return (
        <div ref={ref} className="relative w-full">
            <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-[var(--color-primary)] transition-all shadow-sm">
                <Search size={20} className="text-[var(--text-muted)] shrink-0" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search events, categories, locations..."
                    className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm outline-none"
                    aria-label="Search events"
                    role="combobox"
                    aria-expanded={open && suggestions.length > 0}
                />
                <button
                    onClick={() => { onSearch(); setOpen(false); }}
                    className="shrink-0 px-5 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 text-white text-sm font-bold hover:shadow-lg transition-shadow"
                >
                    Search
                </button>
            </div>

            {/* Autocomplete dropdown */}
            {open && suggestions.length > 0 && (
                <div className="absolute z-30 top-full mt-2 w-full bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl overflow-hidden" role="listbox">
                    {suggestions.map((s) => (
                        <button
                            key={s.id}
                            role="option"
                            aria-selected={false}
                            onClick={() => {
                                onChange(s.title);
                                onSearch();
                                setOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-surface)] transition-colors text-left"
                        >
                            <img src={s.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{s.title}</p>
                                <p className="text-xs text-[var(--text-muted)]">{s.category} • {s.city}</p>
                            </div>
                            <span className="ml-auto text-sm font-bold text-[var(--text-primary)] shrink-0">₹{s.price}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
