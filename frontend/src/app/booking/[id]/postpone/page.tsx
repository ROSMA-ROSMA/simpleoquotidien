'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useBooking } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { BookingStatus } from '@/types';
import { getBookingTitle } from '@/lib/utils';
import { IconArrowLeft, IconCalendar, IconClock } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

export default function PostponeBookingPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const { booking, loading } = useBooking(id);
    const [reason, setReason] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
                    <Link href="/dashboard/client" className="text-brand-teal font-bold">← Retour</Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const note = reason.trim() || 'Report demandé';
            await orderService.update(id, {
                scheduled_datetime: `${newDate}T${newTime}:00`,
                message: booking.message ? `${booking.message}\n[Report] ${note}` : `[Report] ${note}`,
                status: BookingStatus.POSTPONED,
            });
            router.push(`/booking/${id}?postponed=true`);
        } catch {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href={`/booking/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour
                    </Link>

                    <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <IconClock className="w-7 h-7 text-orange-500" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark">Reporter la réservation</h1>
                            <p className="text-slate-500 text-sm mt-1">{getBookingTitle(booking)}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Nouvelle date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} icon={<IconCalendar className="w-5 h-5" />} required />
                                <Input label="Nouvelle heure" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} icon={<IconClock className="w-5 h-5" />} required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Raison du report</label>
                                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Précisez la raison..." rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all resize-none" required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" fullWidth variant="coral" disabled={submitting}>Confirmer le report</Button>
                                <Link href={`/booking/${id}`} className="w-full"><Button variant="secondary" fullWidth>Annuler</Button></Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
