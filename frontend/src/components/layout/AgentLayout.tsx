'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useOrders';
import { notificationService } from '@/services/notification.service';
import { getInitials } from '@/lib/utils';
import {
    IconLayoutGrid, IconList, IconHistory, IconRefresh, IconSearch, IconScale,
    IconFileCheck, IconBell, IconSettings, IconLogout, IconUsers,
} from '@tabler/icons-react';
import { BookingStatus, UserRole } from '@/types';
import { ReactNode } from 'react';

interface NavItem {
    href: string;
    label: string;
    icon: ReactNode;
    badge?: number;
}

export default function AgentLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
    const pathname = usePathname();
    const { currentUser, logout } = useAuth();
    const { bookings } = useBookings();
    const [unreadNotifs, setUnreadNotifs] = useState(0);

    useEffect(() => {
        if (!currentUser) return;
        notificationService.getAll(UserRole.AGENT)
            .then(res => setUnreadNotifs(res.data.filter(n => !n.is_read).length))
            .catch(() => setUnreadNotifs(0));
    }, [currentUser, pathname]);

    const toAssign = bookings.filter(b => [BookingStatus.PENDING, BookingStatus.PROCESSING].includes(b.status)).length;
    const toReassign = bookings.filter(b => b.status === BookingStatus.REASSIGNMENT_NEEDED).length;
    const toQuote = bookings.filter(b => b.status === BookingStatus.ASSIGNED && b.quote_id === undefined).length;

    const sections: { label: string; items: NavItem[] }[] = [
        {
            label: 'Principal',
            items: [
                { href: '/agent/dashboard', label: 'Tableau de bord', icon: <IconLayoutGrid className="w-5 h-5" /> },
                { href: '/agent/commandes', label: 'Commandes', icon: <IconList className="w-5 h-5" />, badge: toAssign },
                { href: '/agent/historique-commande', label: 'Historique', icon: <IconHistory className="w-5 h-5" /> },
                { href: '/agent/reassignations', label: 'À réassigner', icon: <IconRefresh className="w-5 h-5" />, badge: toReassign },
            ],
        },
        {
            label: 'Prestataires',
            items: [
                { href: '/agent/recherche', label: 'Rechercher', icon: <IconSearch className="w-5 h-5" /> },
                { href: '/agent/prestataire', label: 'Prestataires', icon: <IconUsers className="w-5 h-5" /> },
                { href: '/agent/comparaison', label: 'Comparer', icon: <IconScale className="w-5 h-5" /> },
            ],
        },
        {
            label: 'Gestion',
            items: [
                { href: '/agent/devis', label: 'Validation des devis', icon: <IconFileCheck className="w-5 h-5" />, badge: toQuote },
                { href: '/agent/notifications', label: 'Notifications', icon: <IconBell className="w-5 h-5" />, badge: unreadNotifs },
                { href: '/agent/parametres', label: 'Paramètres', icon: <IconSettings className="w-5 h-5" /> },
            ],
        },
    ];

    return (
        <div className="min-h-screen grid grid-cols-[264px_1fr] bg-brand-surface">
            <aside className="bg-white border-r border-slate-100 p-4 sticky top-0 h-screen flex flex-col gap-1.5 overflow-y-auto">
                <Link href="/agent/dashboard" className="flex items-center gap-2.5 px-2.5 pb-5 pt-1.5">
                    <div className="w-10 h-10 rounded-[10px] bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                        <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="font-extrabold text-base text-brand-dark leading-tight">SimpleÔQuotidien</div>
                        <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Espace Agent</div>
                    </div>
                </Link>

                {sections.map(section => (
                    <div key={section.label}>
                        <div className="text-xs uppercase tracking-widest text-slate-400 font-bold px-3 pt-3 pb-1.5">{section.label}</div>
                        {section.items.map(item => {
                            const isActive = pathname?.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-base font-semibold transition-all ${isActive ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/30' : 'text-slate-600 hover:bg-slate-50 hover:text-brand-teal'
                                        }`}
                                >
                                    {item.icon}
                                    <span className="flex-1">{item.label}</span>
                                    {!!item.badge && item.badge > 0 && (
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-brand-coral text-white'}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2.5 px-1">
                    <div className="w-10 h-10 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold text-base shrink-0">
                        {currentUser ? getInitials(currentUser.first_name, currentUser.last_name) : 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-brand-dark truncate">{currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Agent'}</div>
                        <div className="text-sm text-slate-400 truncate">Agent{currentUser?.intervention_city ? ` · ${currentUser.intervention_city}` : ''}</div>
                    </div>
                    <button onClick={logout} title="Déconnexion" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                        <IconLogout className="w-4 h-4" />
                    </button>
                </div>
            </aside>

            <div className="flex flex-col min-w-0">
                <header className="h-[72px] bg-white border-b border-slate-100 flex items-center gap-4 px-8 sticky top-0 z-20">
                    <div>
                        <div className="text-lg font-bold text-brand-dark tracking-tight">{title}</div>
                        {subtitle && <div className="text-sm text-slate-400 mt-0.5">{subtitle}</div>}
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <Link href="/agent/notifications" className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-brand-tealLight hover:text-brand-teal text-slate-600 flex items-center justify-center relative transition-colors">
                            <IconBell className="w-5 h-5" />
                            {unreadNotifs > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-coral" />}
                        </Link>
                        <Link href="/agent/parametres" className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-brand-tealLight hover:text-brand-teal text-slate-600 flex items-center justify-center transition-colors">
                            <IconSettings className="w-5 h-5" />
                        </Link>
                    </div>
                </header>

                {currentUser && currentUser.role !== UserRole.AGENT && currentUser.role !== UserRole.ADMIN ? (
                    <div className="p-8">
                        <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                            <h2 className="text-lg font-bold text-brand-dark mb-2">Accès réservé aux agents</h2>
                            <Link href="/login" className="text-brand-teal font-bold">Se connecter avec un compte agent →</Link>
                        </div>
                    </div>
                ) : (
                    <section className="p-8 flex-1">{children}</section>
                )}
            </div>
        </div>
    );
}
