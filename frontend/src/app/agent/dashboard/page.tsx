'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AgentLayout from '@/components/layout/AgentLayout';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useOrders';
import { notificationService } from '@/services/notification.service';
import { getInitials, timeAgo, getBookingTitle } from '@/lib/utils';
import { AppNotification, BookingStatus, BOOKING_STATUS_LABELS, UserRole } from '@/types';
import { IconPackage, IconClockHour4, IconUserCheck, IconCircleCheck, IconArrowRight, IconBellRinging } from '@tabler/icons-react';

function statusBadgeVariant(status: BookingStatus) {
    switch (status) {
        case BookingStatus.PENDING:
        case BookingStatus.PROCESSING: return 'brandCoral' as const;
        case BookingStatus.ASSIGNED:
        case BookingStatus.QUOTE_SENT:
        case BookingStatus.CONFIRMED: return 'brandTeal' as const;
        case BookingStatus.COMPLETED:
        case BookingStatus.CLOSED: return 'success' as const;
        case BookingStatus.REASSIGNMENT_NEEDED:
        case BookingStatus.REJECTED:
        case BookingStatus.CANCELLED: return 'danger' as const;
        default: return 'neutral' as const;
    }
}

export default function AgentDashboardPage() {
    const { currentUser } = useAuth();
    const { bookings, loading } = useBookings();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        notificationService.getAll(UserRole.AGENT)
            .then(res => setNotifications(res.data))
            .catch(() => setNotifications([]));
    }, []);

    const toAssign = bookings.filter(b => [BookingStatus.PENDING, BookingStatus.PROCESSING].includes(b.status));
    const assigned = bookings.filter(b => [BookingStatus.ASSIGNED, BookingStatus.QUOTE_SENT, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(b.status));
    const completedThisMonth = bookings.filter(b => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CLOSED);
    const recent = [...bookings].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 5);
    const myNotifs = notifications.slice(0, 4);

    return (
        <AgentLayout title="Tableau de bord" subtitle="Vue d'ensemble de votre activité">
            <div className="bg-gradient-to-r from-brand-teal to-brand-tealDark rounded-2xl p-7 mb-8 text-white flex items-center gap-6 flex-wrap">
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                    <IconPackage className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-[240px]">
                    <h1 className="text-xl font-extrabold mb-1">Bonjour {currentUser?.first_name ?? 'Agent'}</h1>
                    <p className="text-brand-tealLight/85 text-base">
                        {loading ? 'Chargement…' : <>Vous avez <strong>{toAssign.length} commande{toAssign.length !== 1 ? 's' : ''} en attente d&apos;assignation</strong> à traiter.</>}
                    </p>
                </div>
                <Link href="/agent/commandes">
                    <Button variant="coral" icon={<IconArrowRight className="w-4 h-4" />}>Voir les commandes</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Commandes totales" value={loading ? '…' : bookings.length} icon={<IconPackage className="w-6 h-6" />} color="teal" />
                <StatCard label="En attente d'assignation" value={loading ? '…' : toAssign.length} icon={<IconClockHour4 className="w-6 h-6" />} color="coral" />
                <StatCard label="Assignées / en cours" value={loading ? '…' : assigned.length} icon={<IconUserCheck className="w-6 h-6" />} color="teal" />
                <StatCard label="Terminées" value={loading ? '…' : completedThisMonth.length} icon={<IconCircleCheck className="w-6 h-6" />} color="coral" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-slate-50">
                        <span className="font-bold text-brand-dark">Commandes récentes</span>
                        <Link href="/agent/commandes" className="text-sm font-bold text-brand-teal hover:text-brand-tealDark">Tout voir →</Link>
                    </div>
                    <table className="w-full text-base">
                        <thead className="bg-slate-50/60">
                            <tr>
                                <th className="text-left py-2.5 px-5 font-bold text-slate-400 uppercase text-xs">Réf.</th>
                                <th className="text-left py-2.5 px-5 font-bold text-slate-400 uppercase text-xs">Service</th>
                                <th className="text-left py-2.5 px-5 font-bold text-slate-400 uppercase text-xs">Statut</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-base">Chargement…</td></tr>
                            ) : recent.map(b => (
                                <tr key={b.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                    <td className="py-3 px-5 font-bold text-brand-dark">#SQ-{b.id}</td>
                                    <td className="py-3 px-5 text-slate-500">{getBookingTitle(b)}</td>
                                    <td className="py-3 px-5"><Badge variant={statusBadgeVariant(b.status)}>{BOOKING_STATUS_LABELS[b.status]}</Badge></td>
                                    <td className="py-3 px-5 text-right">
                                        <Link href={`/agent/commandes/${b.uuid}`} className="text-sm font-bold text-brand-teal hover:text-brand-tealDark">Voir →</Link>
                                    </td>
                                </tr>
                            ))}
                            {!loading && recent.length === 0 && (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-base">Aucune commande pour le moment.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-slate-50">
                        <span className="font-bold text-brand-dark">Notifications récentes</span>
                        <Link href="/agent/notifications" className="text-sm font-bold text-brand-teal hover:text-brand-tealDark">Voir tout →</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {myNotifs.map(n => (
                            <div key={n.id} className="flex items-start gap-3 p-4">
                                <div className="w-9 h-9 rounded-lg bg-brand-tealLight text-brand-teal flex items-center justify-center shrink-0">
                                    <IconBellRinging className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-brand-dark truncate">{n.title}</p>
                                    <p className="text-sm text-slate-500 line-clamp-2">{n.message}</p>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                            </div>
                        ))}
                        {myNotifs.length === 0 && (
                            <p className="p-6 text-center text-slate-400 text-base">Aucune notification.</p>
                        )}
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}
