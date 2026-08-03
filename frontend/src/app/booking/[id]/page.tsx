'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FeatureBanner from '@/components/ui/FeatureBanner';
import { useBooking } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { providerService } from '@/services/provider.service';
import { formatPrice, formatDateTime, getBookingTitle } from '@/lib/utils';
import { BookingStatus, BOOKING_STATUS_LABELS, User } from '@/types';
import { IconCalendar, IconMapPin, IconUser, IconArrowLeft, IconCreditCard, IconEdit, IconClockPause, IconStar, IconMessage, IconCircleCheck, IconX } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: Props) {
    const { id } = use(params);
    const { booking, loading, reload } = useBooking(id);
    const [provider, setProvider] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [contacted, setContacted] = useState(false);

    useEffect(() => {
        if (!booking?.assigned_provider_id) {
            setProvider(null);
            return;
        }
        providerService.getById(booking.assigned_provider_id)
            .then(res => setProvider(res.data))
            .catch(() => setProvider(null));
    }, [booking?.assigned_provider_id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <p className="text-slate-500">Chargement…</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Réservation introuvable</h1>
                    <Link href="/dashboard/client" className="text-brand-teal font-bold">← Retour au tableau de bord</Link>
                </div>
            </div>
        );
    }

    const title = getBookingTitle(booking);
    const assignedProvider = provider ?? booking.assigned_provider;

    const statusVariant = () => {
        switch (booking.status) {
            case BookingStatus.CONFIRMED:
            case BookingStatus.QUOTE_SENT:
            case BookingStatus.ASSIGNED: return 'info' as const;
            case BookingStatus.PENDING:
            case BookingStatus.PROCESSING: return 'warning' as const;
            case BookingStatus.COMPLETED:
            case BookingStatus.CLOSED: return 'success' as const;
            case BookingStatus.CANCELLED:
            case BookingStatus.REJECTED:
            case BookingStatus.REASSIGNMENT_NEEDED: return 'danger' as const;
            default: return 'neutral' as const;
        }
    };

    const canModify = booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED;
    const canRate = booking.status === BookingStatus.COMPLETED;
    const canPay = booking.status === BookingStatus.CONFIRMED;
    const canContactProvider = !!booking.assigned_provider_id;
    const canValidateQuote = booking.status === BookingStatus.QUOTE_SENT;
    const canMarkCompleted = booking.status === BookingStatus.IN_PROGRESS;

    const handleValidateQuote = async () => {
        setActionLoading(true);
        try {
            await orderService.validateQuote(id);
            await reload();
        } finally {
            setActionLoading(false);
        }
    };

    const handleRefuseQuote = async () => {
        setActionLoading(true);
        try {
            await orderService.refuseQuote(id);
            await reload();
        } finally {
            setActionLoading(false);
        }
    };

    const handleContactProvider = async () => {
        await orderService.contactProvider(id);
        setContacted(true);
    };

    const handleMarkCompleted = async () => {
        setActionLoading(true);
        try {
            await orderService.complete(id);
            await reload();
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/dashboard/client" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour au dashboard
                    </Link>

                    <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100 mb-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-extrabold text-brand-dark mb-2">Réservation #{booking.id}</h1>
                                <Badge variant={statusVariant()}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-extrabold text-brand-teal">{formatPrice(booking.total_amount)}</span>
                                <span className="text-sm text-slate-500 block">FCFA</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5 mb-6">
                            <h3 className="font-bold text-brand-dark mb-3">{title}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <IconCalendar className="w-4 h-4 text-brand-mint" />
                                    {formatDateTime(booking.scheduled_datetime)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <IconMapPin className="w-4 h-4 text-brand-mint" />
                                    {booking.address}
                                </div>
                                {assignedProvider && (
                                    <div className="flex items-center gap-2">
                                        <IconUser className="w-4 h-4 text-brand-mint" />
                                        {assignedProvider.first_name} {assignedProvider.last_name}
                                    </div>
                                )}
                            </div>
                            {booking.message && (
                                <p className="text-sm text-slate-500 italic mt-3 pt-3 border-t border-slate-200">&ldquo;{booking.message}&rdquo;</p>
                            )}
                            {booking.status === BookingStatus.QUOTE_SENT && booking.quote_amount && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <span className="text-sm text-slate-600">Devis proposé : <strong className="text-brand-teal">{formatPrice(booking.quote_amount)} FCFA</strong></span>
                                    {booking.quote_description && (
                                        <p className="text-sm text-slate-500 italic mt-2">&ldquo;{booking.quote_description}&rdquo;</p>
                                    )}
                                </div>
                            )}
                            {contacted && (
                                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                                    <IconCircleCheck className="w-4 h-4" /> Demande de contact enregistrée (messagerie à venir)
                                </div>
                            )}
                        </div>

                        {canPay && (
                            <FeatureBanner
                                title="Paiement en ligne"
                                message="Le paiement en ligne n'est pas encore connecté au backend. Vous pourrez régler directement le prestataire."
                            />
                        )}

                        <div className="flex flex-wrap gap-3">
                            {canMarkCompleted && (
                                <Button variant="primary" icon={<IconCircleCheck className="w-4 h-4" />} disabled={actionLoading} onClick={handleMarkCompleted}>
                                    Marquer comme exécutée
                                </Button>
                            )}
                            {canPay && (
                                <Link href={`/payment/initiate/${booking.id}`}>
                                    <Button variant="coral" icon={<IconCreditCard className="w-4 h-4" />}>Payer maintenant</Button>
                                </Link>
                            )}
                            {canValidateQuote && (
                                <>
                                    <Button variant="primary" icon={<IconCircleCheck className="w-4 h-4" />} disabled={actionLoading} onClick={handleValidateQuote}>
                                        Valider le devis
                                    </Button>
                                    <Button variant="danger" icon={<IconX className="w-4 h-4" />} disabled={actionLoading} onClick={handleRefuseQuote}>
                                        Refuser le devis
                                    </Button>
                                </>
                            )}
                            {canContactProvider && (
                                <Button variant="secondary" icon={<IconMessage className="w-4 h-4" />} onClick={handleContactProvider}>
                                    {contacted ? 'Recontacter le prestataire' : 'Contacter le prestataire'}
                                </Button>
                            )}
                            {canModify && (
                                <>
                                    <Link href={`/booking/${id}/edit`}>
                                        <Button variant="secondary" icon={<IconEdit className="w-4 h-4" />}>Modifier</Button>
                                    </Link>
                                    <Link href={`/booking/${id}/postpone`}>
                                        <Button variant="ghost" icon={<IconClockPause className="w-4 h-4" />}>Reporter</Button>
                                    </Link>
                                </>
                            )}
                            {canRate && (
                                <Link href={`/booking/${id}/rate`}>
                                    <Button variant="primary" icon={<IconStar className="w-4 h-4" />}>Évaluer</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
