'use client';

import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import { useBookings } from '@/hooks/useOrders';
import { formatDateTime, getBookingTitle } from '@/lib/utils';
import { BOOKING_STATUS_LABELS, BookingHistoryEntry } from '@/types';
import { IconHistory } from '@tabler/icons-react';

export default function AgentHistoriqueCommandePage() {
    const { bookings, loading } = useBookings();

    const entries: (BookingHistoryEntry & { bookingId: number; serviceName?: string })[] = bookings
        .flatMap(b => (b.history ?? []).map(h => ({ ...h, bookingId: b.id, serviceName: getBookingTitle(b) })))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return (
        <AgentLayout title="Historique des commandes" subtitle="Journal complet de toutes les transitions de statut">
            {loading ? (
                <p className="text-slate-400 text-[11px] text-center py-10">Chargement…</p>
            ) : entries.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <table className="w-full text-[11px]">
                        <thead className="bg-slate-50/60">
                            <tr>
                                <th className="text-left py-3 px-5 font-bold text-slate-400 uppercase text-[11px]">Commande</th>
                                <th className="text-left py-3 px-5 font-bold text-slate-400 uppercase text-[11px]">Statut</th>
                                <th className="text-left py-3 px-5 font-bold text-slate-400 uppercase text-[11px]">Note</th>
                                <th className="text-left py-3 px-5 font-bold text-slate-400 uppercase text-[11px]">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.slice(0, 100).map(e => (
                                <tr key={e.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                    <td className="py-3 px-5">
                                        <Link href={`/agent/commandes/${e.bookingId}`} className="font-bold text-brand-teal hover:text-brand-tealDark">
                                            #SQ-{e.bookingId}
                                        </Link>
                                        <span className="text-slate-400"> · {e.serviceName}</span>
                                    </td>
                                    <td className="py-3 px-5 text-slate-700 font-semibold">{BOOKING_STATUS_LABELS[e.status]}</td>
                                    <td className="py-3 px-5 text-slate-500 max-w-xs truncate">{e.note ?? '—'}</td>
                                    <td className="py-3 px-5 text-slate-400">{formatDateTime(e.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                    <IconHistory className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400">Aucun historique pour le moment.</p>
                </div>
            )}
        </AgentLayout>
    );
}
