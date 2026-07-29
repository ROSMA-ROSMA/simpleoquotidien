'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { orderService } from '@/services/order.service';
import { categoryService } from '@/services/category.service';
import { Category } from '@/types';
import { IconArrowLeft, IconCalendar, IconClock, IconMapPin, IconCurrencyDollar } from '@tabler/icons-react';
import Link from 'next/link';

export default function AdminCreateBookingPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        category_id: 0, date: '', time: '', address: '', message: '', budget: '',
    });

    const loadCategories = useCallback(async () => {
        try {
            const res = await categoryService.getAll();
            setCategories(res.data);
            if (res.data.length > 0) setForm(f => ({ ...f, category_id: res.data[0].id }));
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await orderService.create({
                category_id: form.category_id,
                scheduled_datetime: `${form.date}T${form.time}:00`,
                address: form.address,
                message: form.message || undefined,
                budget: Number(form.budget),
            });
            router.push('/dashboard/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Chargement…</p></div>;

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Créer une réservation</h1>
                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-base text-red-600">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Catégorie</label>
                            <select value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} icon={<IconCalendar className="w-5 h-5" />} required />
                            <Input label="Heure" type="time" value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} icon={<IconClock className="w-5 h-5" />} required />
                        </div>
                        <Input label="Adresse" placeholder="Adresse d'intervention" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} icon={<IconMapPin className="w-5 h-5" />} required />
                        <Input label="Budget (FCFA)" type="number" placeholder="15000" value={form.budget} onChange={(e) => setForm(f => ({ ...f, budget: e.target.value }))} icon={<IconCurrencyDollar className="w-5 h-5" />} required />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Description</label>
                            <textarea placeholder="Décrivez votre besoin..." rows={3} value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="submit" fullWidth disabled={saving}>{saving ? 'Création…' : 'Créer'}</Button>
                            <Link href="/dashboard/admin" className="w-full"><Button variant="secondary" fullWidth>Annuler</Button></Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
