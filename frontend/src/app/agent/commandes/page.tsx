'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import Badge from '@/components/ui/Badge';
import { useBookings } from '@/hooks/useOrders';
import { getInitials, getBookingTitle } from '@/lib/utils';
import { BookingStatus, BOOKING_STATUS_LABELS } from '@/types';
import { IconSearch } from '@tabler/icons-react';

function statusBadgeVariant(status: BookingStatus) {
    switch (status) {
        case BookingStatus.PENDING:
        case BookingStatus.PROCESSING: return 'warning' as const;
        case BookingStatus.ASSIGNED:
        case BookingStatus.QUOTE_SENT:
        case BookingStatus.CONFIRMED: return 'info' as const;
        case BookingStatus.COMPLETED:
        case BookingStatus.CLOSED: return 'success' as const;
        case BookingStatus.REASSIGNMENT_NEEDED:
        case BookingStatus.REJECTED:
        case BookingStatus.CANCELLED: return 'danger' as const;
        default: return 'neutral' as const;
    }
}

const PAGE_SIZE = 8;

export default function AgentCommandesPage() {
    const { bookings, loading } = useBookings();
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let items = [...bookings].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        if (statusFilter !== 'all') items = items.filter(b => b.status === statusFilter);
        if (query.trim()) {
            const q = query.toLowerCase();
            items = items.filter(b =>
                String(b.id).includes(q) ||
                b.address.toLowerCase().includes(q) ||
                getBookingTitle(b).toLowerCase().includes(q),
            );
        }
        return items;
    }, [bookings, statusFilter, query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <AgentLayout title="Commandes" subtitle={loading ? 'Chargement…' : `${filtered.length} commande${filtered.length !== 1 ? 's' : ''}`}>
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 min-w-[240px]">
                    <IconSearch className="w-4 h-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder="Rechercher une commande, un service…"
                        className="flex-1 outline-none text-sm bg-transparent"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as BookingStatus | 'all'); setPage(1); }}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 outline-none focus:border-brand-teal"
                >
                    <option value="all">Tous les statuts</option>
                    {Object.values(BookingStatus).map(s => (
                        <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/60">
                        <tr>
                            <th className="text-left py-3 px-5 font-bold text-slate-400 uppercase text-sm">Réf.</th>
                            <th className="text-left py-3 px-5 font-bold text-slate-400 uppercase text-sm">Service</th>
                            <th className="text-left py-3 px-5 font-bold text-slate-400 uppercase text-sm">Ville</th>
                            <th className="text-left py-3 px-5 font-bold text-slate-400 uppercase text-sm">Statut</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">Chargement des commandes…</td></tr>
                        ) : pageItems.map(b => (
                            <tr key={b.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                <td className="py-3 px-5 font-bold text-brand-dark">#SQ-{b.id}</td>
                                <td className="py-3 px-5 text-slate-500">{getBookingTitle(b)}</td>
                                <td className="py-3 px-5 text-slate-500">{b.intervention_city ?? b.address}</td>
                                <td className="py-3 px-5"><Badge variant={statusBadgeVariant(b.status)}>{BOOKING_STATUS_LABELS[b.status]}</Badge></td>
                                <td className="py-3 px-5 text-right">
                                    <Link href={`/agent/commandes/${b.uuid}`} className="text-sm font-bold text-brand-teal hover:text-brand-tealDark">Voir →</Link>
                                </td>
                            </tr>
                        ))}
                        {!loading && pageItems.length === 0 && (
                            <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">Aucune commande ne correspond à ces critères.</td></tr>
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-50">
                        <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 disabled:opacity-40 hover:border-brand-teal hover:text-brand-teal">Précédent</button>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 disabled:opacity-40 hover:border-brand-teal hover:text-brand-teal">Suivant</button>
                        </div>
                    </div>
                )}
            </div>
        </AgentLayout>
    );
}
