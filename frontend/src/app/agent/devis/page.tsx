'use client';

import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { useBookings } from '@/hooks/useOrders';
import { formatPrice, formatDateTime, getBookingTitle } from '@/lib/utils';
import { BookingStatus } from '@/types';
import { IconFileCheck } from '@tabler/icons-react';

export default function AgentDevisPage() {
    const { bookings, loading } = useBookings();
    const awaitingQuote = bookings.filter(b => b.status === BookingStatus.ASSIGNED || b.status === BookingStatus.CONFIRMED);
    const sentQuotes = bookings.filter(b => b.status === BookingStatus.QUOTE_SENT || (b.quote_amount !== undefined));

    if (loading) {
        return (
            <AgentLayout title="Validation des devis" subtitle="Chargement…">
                <p className="text-slate-400 text-[11px]">Chargement des devis…</p>
            </AgentLayout>
        );
    }

    return (
        <AgentLayout title="Validation des devis" subtitle="Devis à établir et suivi des devis envoyés">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">À établir</h2>
                    {awaitingQuote.length > 0 ? (
                        <div className="space-y-3">
                            {awaitingQuote.map(b => (
                                <Link key={b.id} href={`/agent/commandes/${b.id}`} className="block bg-white rounded-2xl p-5 shadow-card border border-slate-100 hover:border-brand-teal/30 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-brand-dark text-[11px]">#SQ-{b.id} · {getBookingTitle(b)}</span>
                                        <Badge variant="info">Assignée</Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-500">{formatDateTime(b.scheduled_datetime)}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<IconFileCheck className="w-8 h-8" />} title="Rien à établir" description="Aucune commande n'attend de devis." />
                    )}
                </div>

                <div>
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Devis envoyés</h2>
                    {sentQuotes.length > 0 ? (
                        <div className="space-y-3">
                            {sentQuotes.map(b => (
                                <Link key={b.id} href={`/agent/commandes/${b.id}`} className="block bg-white rounded-2xl p-5 shadow-card border border-slate-100 hover:border-brand-teal/30 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-brand-dark text-[11px]">#SQ-{b.id} · {getBookingTitle(b)}</span>
                                        <span className="font-extrabold text-brand-teal text-[11px]">{formatPrice(b.quote_amount ?? b.total_amount)} F</span>
                                    </div>
                                    <Badge variant={b.status === BookingStatus.CONFIRMED ? 'success' : 'info'} className="mt-2">
                                        {b.status === BookingStatus.CONFIRMED ? 'Validé par le client' : 'En attente de validation'}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<IconFileCheck className="w-8 h-8" />} title="Aucun devis envoyé" />
                    )}
                </div>
            </div>
        </AgentLayout>
    );
}
