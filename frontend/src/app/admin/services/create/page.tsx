'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useCategories } from '@/hooks/useCategories';
import { providerService } from '@/services/provider.service';
import { User } from '@/types';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function AdminCreateServicePage() {
    const router = useRouter();
    const { categories } = useCategories();
    const [providers, setProviders] = useState<User[]>([]);
    const createService = useAppStore(s => s.createService);

    const loadProviders = useCallback(async () => {
        try {
            const res = await providerService.getAll();
            setProviders(res.data);
        } catch { setProviders([]); }
    }, []);

    useEffect(() => { loadProviders(); }, [loadProviders]);

    const [form, setForm] = useState({
        name: '', category_id: 0, provider_id: 0,
        price: '', description: '', location: '',
    });

    // Set defaults when data loads
    useEffect(() => {
        if (categories.length > 0 && form.category_id === 0) {
            setForm(f => ({ ...f, category_id: categories[0].id }));
        }
    }, [categories, form.category_id]);

    useEffect(() => {
        if (providers.length > 0 && form.provider_id === 0) {
            setForm(f => ({ ...f, provider_id: providers[0].id }));
        }
    }, [providers, form.provider_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const category = categories.find(c => c.id === Number(form.category_id));
        const provider = providers.find(p => p.id === Number(form.provider_id));
        createService({
            name: form.name,
            category_id: Number(form.category_id),
            category,
            provider_id: Number(form.provider_id),
            provider,
            price: Number(form.price),
            description: form.description,
            location: form.location || undefined,
            is_active: true,
        });
        router.push('/dashboard/admin');
    };

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Créer un service</h1>
                    <p className="text-sm text-slate-400 mb-4">Le backend ne gère pas les services — cette création est locale uniquement.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nom du service" placeholder="Ex: Plomberie générale" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Catégorie</label>
                            <select value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Prestataire</label>
                            <select value={form.provider_id} onChange={(e) => setForm(f => ({ ...f, provider_id: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none">
                                {providers.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                            </select>
                        </div>
                        <Input label="Prix (FCFA)" type="number" placeholder="15000" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Description</label>
                            <textarea placeholder="Décrivez le service..." rows={4} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none" required />
                        </div>
                        <Input label="Localisation" placeholder="Ouagadougou" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
                        <div className="flex gap-3 pt-2">
                            <Button type="submit" fullWidth>Créer</Button>
                            <Link href="/dashboard/admin" className="w-full"><Button variant="secondary" fullWidth>Annuler</Button></Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
