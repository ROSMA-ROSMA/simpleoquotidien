'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/hooks/useOrders';
import { useProviderProfile } from '@/hooks/useProviderProfile';
import { useMyReviews } from '@/hooks/useReviews';
import { orderService } from '@/services/order.service';
import { providerService } from '@/services/provider.service';
import { formatPrice, formatDateTime, getBookingTitle } from '@/lib/utils';
import { BookingStatus, BOOKING_STATUS_LABELS, User, UserRole, PaymentStatus } from '@/types';
import { IconCalendar, IconMapPin, IconUser, IconArrowLeft, IconCreditCard, IconEdit, IconClockPause, IconStar, IconMessage, IconCircleCheck, IconX, IconTrash, IconAlertTriangle, IconCheck } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

const DELETABLE_STATUSES = [
    BookingStatus.PENDING, BookingStatus.PROCESSING, BookingStatus.ASSIGNED,
    BookingStatus.REASSIGNMENT_NEEDED, BookingStatus.POSTPONED, BookingStatus.CANCELLED,
];

export default function BookingDetailPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const { currentUser } = useAuth();
    const { booking, loading, reload } = useBooking(id);
    const { profile: myProviderProfile } = useProviderProfile();
    const { ratedOrderUuids } = useMyReviews(currentUser?.id);
    const [provider, setProvider] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [contacted, setContacted] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    const isClient = currentUser?.role === UserRole.CLIENT;
    const isOwnAssignment = currentUser?.role === UserRole.PROVIDER
        && !!myProviderProfile
        && booking.assigned_provider_id === myProviderProfile.id;
    const isPaid = booking.payment?.status === PaymentStatus.SUCCESS;

    const canModify = booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED;
    const canDelete = DELETABLE_STATUSES.includes(booking.status);
    const canRate = booking.status === BookingStatus.COMPLETED && !!booking.uuid && !ratedOrderUuids.has(booking.uuid);
    // Payer et contacter le prestataire sont des actions client uniquement — le
    // prestataire qui valide/démarre sa propre mission ne doit pas les voir.
    const canPay = isClient && booking.status === BookingStatus.CONFIRMED && !isPaid;
    const canContactProvider = isClient && !!booking.assigned_provider_id;
    // Seul le client valide/refuse le devis reçu — le prestataire qui consulte sa
    // propre mission ne doit pas voir ces actions (elles ne le concernent pas).
    const canValidateQuote = booking.status === BookingStatus.QUOTE_SENT && isClient;
    // Seul le prestataire assigné termine sa propre intervention — le client ne
    // doit pas pouvoir marquer sa commande comme exécutée à sa place.
    const canMarkCompleted = booking.status === BookingStatus.IN_PROGRESS && isOwnAssignment;
    const canRespondToAssignment = booking.assignment_status === 'EN_ATTENTE' && isOwnAssignment;

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

    const handleAcceptAssignment = async () => {
        if (!booking.assignment_id) return;
        setActionLoading(true);
        try {
            await orderService.accept(booking.assignment_id);
            router.push(`/booking/${id}/accept`);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Erreur');
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await orderService.remove(id);
            router.push('/dashboard/client');
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
            setDeleting(false);
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

                    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-slate-100 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark mb-2">Réservation #{booking.id}</h1>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={statusVariant()}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
                                    {isClient && (
                                        <Badge variant={isPaid ? 'success' : 'neutral'}>{isPaid ? 'Payée' : 'Créée'}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="sm:text-right">
                                <span className="text-2xl sm:text-3xl font-extrabold text-brand-teal">{formatPrice(booking.total_amount)}</span>
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
                            {booking.audio_note && (
                                <div className={booking.message ? 'mt-3' : 'mt-3 pt-3 border-t border-slate-200'}>
                                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Message vocal du client</span>
                                    <audio src={booking.audio_note} controls className="h-9 w-full max-w-sm" />
                                </div>
                            )}
                            {booking.status === BookingStatus.QUOTE_SENT && booking.quote_amount && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <span className="text-sm text-slate-600">Devis proposé : <strong className="text-brand-teal">{formatPrice(booking.quote_amount)} FCFA</strong></span>
                                    {booking.quote_description && (
                                        <p className="text-sm text-slate-500 italic mt-2">&ldquo;{booking.quote_description}&rdquo;</p>
                                    )}
                                    {booking.quote_pdf_url && (
                                        <a href={booking.quote_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-teal hover:text-brand-tealDark mt-2">
                                            Voir le fichier de devis →
                                        </a>
                                    )}
                                </div>
                            )}
                            {contacted && (
                                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                                    <IconCircleCheck className="w-4 h-4" /> Demande de contact enregistrée (messagerie à venir)
                                </div>
                            )}
                        </div>

                        {isClient && isPaid && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-sm mb-6">
                                <p className="font-bold flex items-center gap-1.5"><IconCircleCheck className="w-4 h-4" /> Commande payée</p>
                                <p className="text-emerald-800/90 mt-0.5">
                                    Paiement reçu{booking.payment?.transaction_ref ? ` — référence ${booking.payment.transaction_ref}` : ''}.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {canRespondToAssignment && (
                                <>
                                    <Button variant="primary" icon={<IconCheck className="w-4 h-4" />} disabled={actionLoading} onClick={handleAcceptAssignment}>
                                        Accepter la mission
                                    </Button>
                                    <Link href={`/booking/${id}/reject`}>
                                        <Button variant="danger" icon={<IconX className="w-4 h-4" />}>Refuser la mission</Button>
                                    </Link>
                                </>
                            )}
                            {canMarkCompleted && (
                                <Button variant="primary" icon={<IconCircleCheck className="w-4 h-4" />} disabled={actionLoading} onClick={handleMarkCompleted}>
                                    Marquer comme exécutée
                                </Button>
                            )}
                            {canPay && (
                                <Link href={`/payment/initiate/${booking.uuid ?? booking.id}`}>
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
                            {booking.status === BookingStatus.COMPLETED && !!booking.uuid && ratedOrderUuids.has(booking.uuid) && (
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                                    <IconCircleCheck className="w-4 h-4" /> Déjà évalué
                                </span>
                            )}
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    icon={<IconTrash className="w-4 h-4" />}
                                    className="!text-red-500 hover:!bg-red-50"
                                    onClick={() => { setDeleteError(null); setShowDeleteConfirm(true); }}
                                >
                                    Supprimer la commande
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            <Modal open={showDeleteConfirm} onClose={() => !deleting && setShowDeleteConfirm(false)} title="Supprimer cette commande ?">
                <div>
                    <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                        <IconAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                            Voulez-vous vraiment supprimer la commande <span className="font-bold">{title}</span> ?
                            Cette action est définitive et ne peut pas être annulée.
                        </p>
                    </div>
                    {deleteError && <p className="text-[11px] text-red-600 mt-3">{deleteError}</p>}
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Annuler</Button>
                        <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Suppression…' : 'Confirmer la suppression'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
