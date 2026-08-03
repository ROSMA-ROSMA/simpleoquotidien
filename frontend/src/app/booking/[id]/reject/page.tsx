'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { useBooking } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { getBookingTitle } from '@/lib/utils';
import { IconArrowLeft, IconX } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

export default function RejectBookingPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const { booking, loading } = useBooking(id);
    const [reason, setReason] = useState('');
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
            if (!booking.assignment_id) throw new Error('Aucune assignation trouvée pour cette commande.');
            await orderService.refuse(booking.assignment_id, reason);
            router.push('/dashboard/provider?rejected=true');
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
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <IconX className="w-7 h-7 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark">Refuser la réservation</h1>
                            <p className="text-slate-500 text-sm mt-1">{getBookingTitle(booking)}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Raison du refus</label>
                                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Expliquez la raison du refus..." rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all resize-none" required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" fullWidth variant="danger" disabled={submitting}>Confirmer le refus</Button>
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
