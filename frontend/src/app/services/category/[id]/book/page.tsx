'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/hooks/useCategories';
import { orderService } from '@/services/order.service';
import { IconArrowLeft, IconCalendar, IconClock, IconMapPin, IconMessage } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function BookCategoryPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const categoryId = parseInt(id, 10);
    const { currentUser } = useAuth();
    const { category, loading } = useCategory(categoryId);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ date: '', time: '', address: '', message: '', budget: '5000' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            router.push(`/login?redirect=/services/category/${categoryId}/book`);
            return;
        }
        if (!category) return;
        if (!form.date || !form.time || !form.address.trim()) {
            setError('Veuillez renseigner la date, l\u2019heure et l\u2019adresse.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await orderService.create({
                category_id: category.id,
                scheduled_datetime: `${form.date}T${form.time}:00`,
                address: form.address.trim(),
                message: form.message.trim() || undefined,
                budget: Number(form.budget) || 0,
            });
            router.push(`/booking/${res.data.id}?booking_success=true`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible de créer la commande');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <p className="text-slate-500">Chargement…</p>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Catégorie introuvable</h1>
                    <Link href="/services" className="text-brand-teal font-bold">← Retour</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href={`/services/category/${category.id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour
                    </Link>

                    <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                        <h1 className="text-2xl font-extrabold text-brand-dark mb-2">Demande — {category.name}</h1>
                        <p className="text-slate-500 text-sm mb-6">{category.description}</p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Date" type="date" min={minDate} value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} icon={<IconCalendar className="w-5 h-5" />} required />
                                <Input label="Heure" type="time" value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} icon={<IconClock className="w-5 h-5" />} required />
                            </div>
                            <Input label="Adresse / localisation" placeholder="Quartier, ville…" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} icon={<IconMapPin className="w-5 h-5" />} required />
                            <Input label="Budget indicatif (FCFA)" type="number" min={0} value={form.budget} onChange={(e) => setForm(f => ({ ...f, budget: e.target.value }))} required />
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Détails</label>
                                <textarea
                                    value={form.message}
                                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                                    placeholder="Décrivez votre besoin…"
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none"
                                />
                            </div>
                            <Button type="submit" fullWidth size="lg" disabled={submitting}>
                                {submitting ? 'Envoi…' : 'Envoyer la demande'}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
