'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useBooking } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { formatPrice, getBookingTitle } from '@/lib/utils';
import { IconArrowLeft, IconCalendar, IconClock, IconMapPin } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

export default function EditBookingPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const bookingId = parseInt(id, 10);
    const { booking, loading } = useBooking(bookingId);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ date: '', time: '', address: '', message: '' });

    useEffect(() => {
        if (!booking) return;
        const scheduled = new Date(booking.scheduled_datetime);
        setForm({
            date: scheduled.toISOString().split('T')[0],
            time: scheduled.toTimeString().slice(0, 5),
            address: booking.address,
            message: booking.message ?? '',
        });
    }, [booking]);

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
        setError('');
        try {
            await orderService.update(booking.id, {
                scheduled_datetime: `${form.date}T${form.time}:00`,
                address: form.address,
                message: form.message || undefined,
            });
            router.push(`/booking/${booking.id}?updated=true`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible de modifier la commande');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href={`/booking/${booking.id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour
                    </Link>

                    <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                        <h1 className="text-2xl font-extrabold text-brand-dark mb-2">Modifier la réservation</h1>
                        <p className="text-slate-500 text-sm mb-6">{getBookingTitle(booking)} — {formatPrice(booking.total_amount)} FCFA</p>

                        {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Date" type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} icon={<IconCalendar className="w-5 h-5" />} required />
                                <Input label="Heure" type="time" value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} icon={<IconClock className="w-5 h-5" />} required />
                            </div>
                            <Input label="Adresse" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} icon={<IconMapPin className="w-5 h-5" />} required />
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                                <textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" fullWidth disabled={submitting}>{submitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
                                <Link href={`/booking/${booking.id}`} className="w-full"><Button variant="secondary" fullWidth>Annuler</Button></Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
