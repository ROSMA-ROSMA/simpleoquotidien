'use client';

import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { useBookings } from '@/hooks/useOrders';
import { formatDateTime, getBookingTitle } from '@/lib/utils';
import { BookingStatus } from '@/types';
import { IconRefresh } from '@tabler/icons-react';

export default function AgentReassignationsPage() {
    const { bookings: allBookings, loading } = useBookings();
    const bookings = allBookings.filter(b => b.status === BookingStatus.REASSIGNMENT_NEEDED);

    if (loading) {
        return (
            <AgentLayout title="À réassigner" subtitle="Chargement…">
                <p className="text-slate-400 text-[11px]">Chargement…</p>
            </AgentLayout>
        );
    }

    return (
        <AgentLayout title="À réassigner" subtitle={`${bookings.length} commande${bookings.length !== 1 ? 's' : ''} nécessitant une réassignation`}>
            {bookings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {bookings.map(b => (
                        <div key={b.id} className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 flex flex-wrap items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-orange-50 text-brand-coral flex items-center justify-center font-bold shrink-0">
                                #
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <p className="font-bold text-brand-dark text-[11px]">#SQ-{b.id} · {getBookingTitle(b)}</p>
                                <p className="text-[11px] text-slate-500">{formatDateTime(b.scheduled_datetime)}</p>
                                {b.reassignment_reason && <p className="text-[11px] text-brand-coral mt-1 font-semibold">{b.reassignment_reason}</p>}
                            </div>
                            <Badge variant="danger">À réassigner</Badge>
                            <Link href={`/agent/commandes/${b.id}`} className="px-4 py-2 rounded-xl bg-brand-teal text-white text-[11px] font-bold hover:bg-brand-tealDark transition-colors">
                                Réassigner
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<IconRefresh className="w-8 h-8" />} title="Aucune réassignation en attente" description="Toutes les commandes ont un prestataire actif." />
            )}
        </AgentLayout>
    );
}
