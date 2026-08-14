'use client';

import { useState } from 'react';
import { IconSearch } from '@tabler/icons-react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Rechercher un service...', className = '' }: SearchBarProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className={`relative ${className}`}>
            <div className="relative">
                <IconSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 sm:pl-12 pr-20 sm:pr-32 py-3.5 sm:py-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all shadow-card hover:shadow-card-hover"
                />
                <button
                    type="submit"
                    className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 px-3.5 sm:px-6 py-2 sm:py-2.5 bg-brand-teal text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-brand-tealDark transition-all shadow-lg shadow-brand-teal/20"
                >
                    Rechercher
                </button>
            </div>
        </form>
    );
}
