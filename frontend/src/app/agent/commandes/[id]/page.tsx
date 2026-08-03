'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/order.service';
import { providerService } from '@/services/provider.service';
import { formatPrice, formatDateTime, getInitials, getBookingTitle } from '@/lib/utils';
import { BookingStatus, BOOKING_STATUS_LABELS, Booking, User } from '@/types';
import {
    IconMapPin, IconUser, IconMail, IconMessage, IconArrowLeft,
    IconRefresh, IconFileText, IconUserPlus, IconUsers,
} from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

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

function assignmentStatusBadge(status?: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE') {
    switch (status) {
        case 'ACCEPTEE': return <Badge variant="success">Acceptée</Badge>;
        case 'REFUSEE': return <Badge variant="danger">Refusée</Badge>;
        case 'EXPIREE': return <Badge variant="danger">Expirée — délai dépassé</Badge>;
        default: return <Badge variant="warning">En attente de réponse</Badge>;
    }
}

export default function AgentCommandeDetailPage({ params }: Props) {
    const { id } = use(params);
    const { currentUser } = useAuth();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [providers, setProviders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [showContact, setShowContact] = useState(false);
    const [contactMessage, setContactMessage] = useState('');
    const [contactSending, setContactSending] = useState(false);
    const [contactSent, setContactSent] = useState(false);

    const loadBooking = useCallback(async () => {
        try {
            const res = await orderService.getById(id);
            setBooking(res.data);
        } catch { setBooking(null); }
        finally { setLoading(false); }
    }, [id]);

    const loadProviders = useCallback(async () => {
        try {
            const res = await providerService.getAll();
            setProviders(res.data);
        } catch { setProviders([]); }
    }, []);

    useEffect(() => { loadBooking(); loadProviders(); }, [loadBooking, loadProviders]);

    if (loading) {
        return (
            <AgentLayout title="Chargement…">
                <p className="text-slate-400">Chargement de la commande…</p>
            </AgentLayout>
        );
    }

    if (!booking) {
        return (
            <AgentLayout title="Commande introuvable">
                <Link href="/agent/commandes" className="text-brand-teal font-bold">← Retour aux commandes</Link>
            </AgentLayout>
        );
    }

    const assignedProvider = providers.find(p => p.id === booking.assigned_provider_id);

    const canAssign = [BookingStatus.PENDING, BookingStatus.PROCESSING, BookingStatus.REASSIGNMENT_NEEDED].includes(booking.status);
    const canReassign = booking.status === BookingStatus.REASSIGNMENT_NEEDED;
    const canClose = booking.status === BookingStatus.COMPLETED;

    const defaultContactMessage = `Bonjour ${booking.client?.first_name ?? ''},\n\nNous vous contactons au sujet de votre commande "${getBookingTitle(booking)}". N'hésitez pas à revenir vers nous pour toute question.\n\nCordialement,\nL'équipe SimpleÔQuotidien`;

    const handleOpenContact = () => {
        setContactMessage(defaultContactMessage);
        setContactSent(false);
        setShowContact(true);
    };

    const handleSendContact = async () => {
        setContactSending(true);
        try {
            await orderService.contactClient(booking.uuid ?? id, contactMessage);
            setContactSent(true);
        } catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
        finally { setContactSending(false); }
    };

    const handleClose = async () => {
        try {
            await orderService.close(booking.uuid ?? id);
            loadBooking();
        } catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
    };

    return (
        <AgentLayout title={`Commande #SQ-${booking.id}`} subtitle="Détails et actions">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <Link href="/agent/commandes" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium text-sm transition-colors">
                    <IconArrowLeft className="w-4 h-4" /> Retour aux commandes
                </Link>
                <Badge variant={statusBadgeVariant(booking.status)}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
                {booking.created_at && <span className="text-sm text-slate-400">Créée le {formatDateTime(booking.created_at)}</span>}
            </div>

            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div>
                    <h1 className="text-xl font-extrabold text-brand-dark">Commande #SQ-{booking.id}</h1>
                    <p className="text-sm text-slate-500 mt-1">{getBookingTitle(booking)}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Button variant="secondary" icon={<IconMessage className="w-4 h-4" />} onClick={handleOpenContact}>
                        Contacter le client
                    </Button>
                    {canAssign && (
                        <Link href={`/agent/commandes/${id}/assignation`}>
                            <Button variant="coral" icon={<IconUserPlus className="w-4 h-4" />}>
                                Assigner un prestataire
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {showContact && (
                <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 mb-6">
                    <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2"><IconMail className="w-4 h-4 text-brand-teal" /> Contacter le client par email</h3>
                    <textarea
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm mb-3 outline-none focus:border-brand-teal resize-none"
                    />
                    <div className="flex items-center gap-3">
                        <Button disabled={contactSending || !contactMessage.trim()} onClick={handleSendContact}>
                            {contactSending ? 'Envoi…' : 'Envoyer'}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowContact(false)}>Fermer</Button>
                        {contactSent && <span className="text-sm font-semibold text-emerald-600">Message envoyé au client.</span>}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                        <h3 className="font-bold text-brand-dark mb-4">Informations client</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold text-lg shrink-0">
                                {booking.client ? getInitials(booking.client.first_name, booking.client.last_name) : '—'}
                            </div>
                            <div>
                                <p className="font-bold text-brand-dark">{booking.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'Client inconnu'}</p>
                                <p className="text-sm text-slate-400">{booking.client?.email ?? '—'}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Email</span><span className="font-semibold text-slate-700">{booking.client?.email ?? '—'}</span></div>
                            <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Adresse</span><span className="font-semibold text-slate-700 text-right">{booking.address}</span></div>
                            <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Ville</span><span className="font-semibold text-slate-700">{booking.intervention_city ?? '—'}</span></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                        <h3 className="font-bold text-brand-dark mb-4">Détails du service</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Catégorie</span><span className="font-semibold text-slate-700">{booking.category_name ?? '—'}</span></div>
                            <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Date souhaitée</span><span className="font-semibold text-slate-700">{formatDateTime(booking.scheduled_datetime)}</span></div>
                            <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Budget indicatif</span><span className="font-bold text-brand-teal">{formatPrice(booking.total_amount)} F</span></div>
                        </div>
                        {booking.message && <p className="text-sm text-slate-500 italic mt-4 pt-4 border-t border-slate-100">&ldquo;{booking.message}&rdquo;</p>}
                    </div>

                    {booking.quote_id && (
                        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                            <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2"><IconFileText className="w-4 h-4 text-brand-teal" /> Devis du prestataire</h3>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl font-extrabold text-brand-teal">{formatPrice(booking.quote_amount ?? 0)} F</span>
                                <Badge variant={booking.quote_status === 'ACCEPTE' ? 'success' : booking.quote_status === 'REFUSE' ? 'danger' : 'warning'}>
                                    {booking.quote_status === 'ACCEPTE' ? 'Validé par le client' : booking.quote_status === 'REFUSE' ? 'Refusé par le client' : 'En attente de réponse du client'}
                                </Badge>
                            </div>
                            {booking.quote_description && (
                                <p className="text-sm text-slate-500 italic border-t border-slate-100 pt-3">&ldquo;{booking.quote_description}&rdquo;</p>
                            )}
                        </div>
                    )}

                    {canClose && (
                        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                            <Button variant="primary" onClick={handleClose}>Clôturer la commande</Button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                        <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2"><IconMapPin className="w-4 h-4 text-brand-mint" /> Localisation</h3>
                        <p className="text-sm text-slate-600">{booking.address}</p>
                        <p className="text-sm text-slate-400 mt-1">{booking.intervention_city ?? 'Ville non renseignée'}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                        <h3 className="font-bold text-brand-dark mb-4">Prestataire assigné</h3>
                        {assignedProvider ? (
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold shrink-0">
                                        {getInitials(assignedProvider.first_name, assignedProvider.last_name)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-brand-dark text-sm">{assignedProvider.first_name} {assignedProvider.last_name}</p>
                                        <p className="text-sm text-slate-400">{assignedProvider.intervention_city ?? 'Ville non renseignée'}</p>
                                    </div>
                                </div>
                                {assignmentStatusBadge(booking.assignment_status)}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400">
                                <IconUsers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                <p className="font-semibold text-slate-600 text-sm">Aucun prestataire assigné</p>
                                <p className="text-sm mt-1">Utilisez la recherche pour trouver le meilleur profil.</p>
                                {canAssign && (
                                    <Link href={`/agent/commandes/${id}/assignation`}>
                                        <Button className="mt-4" size="sm">Assigner maintenant</Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {canReassign && (
                        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                            <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2"><IconRefresh className="w-4 h-4 text-brand-coral" /> À réassigner</h3>
                            <p className="text-sm text-slate-400 mb-3">
                                {booking.assignment_status === 'EXPIREE'
                                    ? "Le prestataire précédent n'a pas répondu dans les 30 minutes — assignez-en un nouveau."
                                    : 'Le prestataire précédent a refusé cette commande — assignez-en un nouveau.'}
                            </p>
                            <Link href={`/agent/commandes/${id}/assignation`}>
                                <Button variant="coral" icon={<IconUserPlus className="w-4 h-4" />}>Réassigner un prestataire</Button>
                            </Link>
                        </div>
                    )}

                    {currentUser && (
                        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                            <Link href="/messages">
                                <Button variant="secondary" fullWidth icon={<IconUser className="w-4 h-4" />}>Messages</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AgentLayout>
    );
}
