'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { serviceService } from '@/services/service.service';
import { providerService } from '@/services/provider.service';
import { IconArrowLeft } from '@tabler/icons-react';

export default function ProviderCreateServicePage() {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { categories, loading: categoriesLoading } = useCategories();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({ category_id: 0, price: '', city: '', description: '' });

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link></div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const categoryId = Number(form.category_id) || categories[0]?.id;
        if (!categoryId) {
            setError('Aucune catégorie disponible. Contactez un administrateur.');
            return;
        }
        setSubmitting(true);
        try {
            // Le backend identifie le prestataire courant via son profil associé au compte connecté.
            const providers = await providerService.getProviders();
            const myProfile = providers.data.find(p => p.email === currentUser.email);
            if (!myProfile) {
                throw new Error("Profil prestataire introuvable pour ce compte.");
            }
            await serviceService.create({
                category_id: categoryId,
                price: Number(form.price),
                city: form.city,
                description: form.description || undefined,
            });
            router.push('/dashboard/provider/services');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur lors de la création du service');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/provider/services" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-2">Créer un service</h1>
                    <p className="text-[11px] text-slate-500 mb-6">Choisissez la catégorie proposée par l&apos;administrateur, fixez votre prix et la ville où vous intervenez.</p>
                    {error && <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Catégorie</label>
                            {categoriesLoading ? (
                                <p className="text-[11px] text-slate-400">Chargement des catégories…</p>
                            ) : (
                                <select
                                    value={form.category_id || categories[0]?.id || ''}
                                    onChange={(e) => setForm(f => ({ ...f, category_id: Number(e.target.value) }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[11px] focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                                >
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}
                        </div>
                        <Input label="Prix (FCFA)" type="number" placeholder="15000" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
                        <Input label="Ville d'intervention" placeholder="Ouagadougou" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} required />
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Description (optionnel)</label>
                            <textarea placeholder="Décrivez votre service…" rows={4} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[11px] focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="submit" fullWidth disabled={submitting}>{submitting ? 'Création…' : 'Créer'}</Button>
                            <Link href="/dashboard/provider/services" className="w-full"><Button type="button" variant="secondary" fullWidth>Annuler</Button></Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
