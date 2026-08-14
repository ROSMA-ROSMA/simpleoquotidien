'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import {
    IconLayoutGrid, IconCircleCheck, IconUsers, IconStack2,
    IconBriefcase, IconCalendar, IconCurrencyDollar, IconStar, IconLogout,
    IconMenu2, IconX,
} from '@tabler/icons-react';

interface AdminSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
    pendingCount?: number;
}

const sections: { label: string; items: { id: string; label: string; icon: typeof IconLayoutGrid }[] }[] = [
    {
        label: 'Principal',
        items: [
            { id: 'dashboard', label: 'Tableau de bord', icon: IconLayoutGrid },
            { id: 'validations', label: 'Validations', icon: IconCircleCheck },
        ],
    },
    {
        label: 'Catalogue',
        items: [
            { id: 'users', label: 'Utilisateurs', icon: IconUsers },
            { id: 'categories', label: 'Catégories', icon: IconStack2 },
            { id: 'services', label: 'Services actifs', icon: IconBriefcase },
        ],
    },
    {
        label: 'Activité',
        items: [
            { id: 'bookings', label: 'Réservations', icon: IconCalendar },
            { id: 'payments', label: 'Paiements', icon: IconCurrencyDollar },
            { id: 'reviews', label: 'Avis', icon: IconStar },
        ],
    },
];

export default function AdminSidebar({ activeSection, onSectionChange, pendingCount = 0 }: AdminSidebarProps) {
    const { currentUser, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSelect = (id: string) => {
        onSectionChange(id);
        setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-20 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4">
                <Link href="/dashboard/admin" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-[10px] bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                        <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-6 h-6" />
                    </div>
                    <div className="font-extrabold text-sm text-brand-dark leading-tight">Espace Admin</div>
                </Link>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Menu"
                >
                    <IconMenu2 className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/40 z-30"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`w-64 bg-white border-r border-slate-100 flex flex-col p-4 fixed h-full overflow-y-auto gap-1.5 z-40 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:z-10`}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden self-end p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors -mb-2"
                    aria-label="Fermer"
                >
                    <IconX className="w-5 h-5" />
                </button>
                <Link href="/dashboard/admin" className="flex items-center gap-2.5 px-2.5 pb-5 pt-1.5">
                    <div className="w-10 h-10 rounded-[10px] bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                        <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="font-extrabold text-base text-brand-dark leading-tight">SimpleÔQuotidien</div>
                        <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Espace Admin</div>
                    </div>
                </Link>

                {sections.map(section => (
                    <div key={section.label}>
                        <div className="text-xs uppercase tracking-widest text-slate-400 font-bold px-3 pt-3 pb-1.5">{section.label}</div>
                        {section.items.map(item => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-base font-semibold text-left transition-all ${isActive ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/30' : 'text-slate-600 hover:bg-slate-50 hover:text-brand-teal'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.id === 'validations' && pendingCount > 0 && (
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-brand-coral text-white'}`}>
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2.5 px-1">
                    <div className="w-10 h-10 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold text-base shrink-0">
                        {currentUser ? getInitials(currentUser.first_name, currentUser.last_name) : 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-brand-dark truncate">{currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Admin'}</div>
                        <div className="text-sm text-slate-400 truncate">Administrateur</div>
                    </div>
                    <button onClick={logout} title="Déconnexion" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                        <IconLogout className="w-4 h-4" />
                    </button>
                </div>
            </aside>
        </>
    );
}
