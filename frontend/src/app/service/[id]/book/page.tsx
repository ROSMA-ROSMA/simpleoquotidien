'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/lib/utils';
import { IconArrowLeft, IconCalendar, IconClock, IconMapPin, IconMessage } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function BookServicePage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const { currentUser } = useAuth();
    const createBooking = useAppStore(s => s.createBooking);
    const serviceId = parseInt(id);
    const service = useAppStore(s => s.services.find(sv => sv.id === serviceId));
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ date: '', time: '', address: '', message: '' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            router.push('/login');
            return;
        }
        if (!service) return;
        if (!form.date || !form.time || !form.address.trim()) {
            setError('Veuillez renseigner la date, l\u2019heure et l\u2019adresse.');
            return;
        }
        setSubmitting(true);
        const booking = createBooking({
            client_id: currentUser.id,
            service_id: service.id,
            category_id: service.category_id,
            service,
            client: currentUser,
            scheduled_datetime: `${form.date}T${form.time}:00`,
            address: form.address.trim(),
            message: form.message.trim() || undefined,
            total_amount: service.price,
            intervention_city: service.location,
        });
        setSubmitting(false);
        router.push(`/booking/${booking.id}?booking_success=true`);
    };

    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Service introuvable</h1>
                    <Link href="/services" className="text-brand-teal font-bold">← Retour</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href={`/service/${service.id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour au service
                    </Link>

                    {/* Service summary */}
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 mb-6">
                        <div className="flex items-center gap-4">
                            {service.image && (
                                <img src={service.image} alt={service.name} className="w-20 h-20 rounded-xl object-cover" />
                            )}
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-brand-dark">{service.name}</h1>
                                <p className="text-sm text-slate-500">{service.provider?.first_name} {service.provider?.last_name}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-extrabold text-brand-teal">{formatPrice(service.price)}</span>
                                <span className="text-sm text-slate-400 block">FCFA</span>
                            </div>
                        </div>
                    </div>

                    {/* Booking form */}
                    <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                        <h2 className="text-2xl font-extrabold text-brand-dark mb-6">Réserver ce service</h2>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Date"
                                    type="date"
                                    min={minDate}
                                    value={form.date}
                                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                    icon={<IconCalendar className="w-5 h-5" />}
                                    required
                                />
                                <Input
                                    label="Heure"
                                    type="time"
                                    value={form.time}
                                    onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                                    icon={<IconClock className="w-5 h-5" />}
                                    required
                                />
                            </div>

                            <Input
                                label="Adresse d'intervention"
                                placeholder="Votre adresse complète"
                                value={form.address}
                                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                                icon={<IconMapPin className="w-5 h-5" />}
                                required
                            />

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Message (optionnel)</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 text-slate-400">
                                        <IconMessage className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        placeholder="Décrivez votre besoin en détail..."
                                        rows={4}
                                        value={form.message}
                                        onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-slate-500">Total estimé</span>
                                    <span className="text-2xl font-extrabold text-brand-teal">{formatPrice(service.price)} FCFA</span>
                                </div>
                                <Button type="submit" fullWidth size="lg" icon={<IconCalendar className="w-5 h-5" />} disabled={submitting}>
                                    {submitting ? 'Envoi en cours…' : 'Confirmer la réservation'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
