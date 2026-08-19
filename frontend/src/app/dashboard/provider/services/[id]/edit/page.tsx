'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { serviceService } from '@/services/service.service';
import { VILLES_COTE_DIVOIRE } from '@/lib/constants/cities';
import { IconArrowLeft, IconPhoto } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

export default function ProviderEditServicePage({ params }: Props) {
    const { id } = use(params);
    const serviceId = parseInt(id, 10);
    const router = useRouter();
    const { currentUser } = useAuth();
    const { categories, loading: categoriesLoading } = useCategories();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({ category_id: 0, price: '', city: '', description: '' });
    const [existingImage, setExistingImage] = useState<string | undefined>(undefined);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await serviceService.getById(serviceId);
                setForm({
                    category_id: res.data.category_id,
                    price: String(res.data.price),
                    city: res.data.city,
                    description: res.data.description ?? '',
                });
                setExistingImage(res.data.image);
            } catch {
                setError('Service introuvable.');
            } finally {
                setLoading(false);
            }
        })();
    }, [serviceId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImage(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link></div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
            setError('Le prix doit être un nombre strictement supérieur à 0.');
            return;
        }
        if (!form.city) {
            setError('Merci de choisir une ville d’intervention.');
            return;
        }
        setSubmitting(true);
        try {
            await serviceService.update(serviceId, {
                category_id: form.category_id,
                price: Number(form.price),
                city: form.city,
                description: form.description || undefined,
                image: image ?? undefined,
            });
            router.push('/dashboard/provider/services');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur lors de la modification du service');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/provider/services" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-2">Modifier le service</h1>
                    {loading ? (
                        <p className="text-[11px] text-slate-400">Chargement…</p>
                    ) : (
                        <>
                            {error && <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Catégorie</label>
                                    {categoriesLoading ? (
                                        <p className="text-[11px] text-slate-400">Chargement des catégories…</p>
                                    ) : (
                                        <select
                                            value={form.category_id}
                                            onChange={(e) => setForm(f => ({ ...f, category_id: Number(e.target.value) }))}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[11px] focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                                        >
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    )}
                                </div>
                                <Input label="Prix (FCFA)" type="number" min={1} step={1} value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Ville d&apos;intervention</label>
                                    <select
                                        value={form.city}
                                        onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[11px] focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                                    >
                                        <option value="">Choisir une ville…</option>
                                        {VILLES_COTE_DIVOIRE.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Description (optionnel)</label>
                                    <textarea rows={4} maxLength={2000} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[11px] focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Photo du service (optionnel)</label>
                                    {(preview ?? existingImage) && (
                                        <img src={preview ?? existingImage} alt="Aperçu" className="w-full h-36 object-cover rounded-xl mb-3 border border-slate-200" />
                                    )}
                                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[11px] font-semibold text-slate-500 cursor-pointer hover:border-brand-teal hover:text-brand-teal transition-colors">
                                        <IconPhoto className="w-4 h-4" />
                                        {image ? image.name : 'Changer l’image…'}
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="submit" fullWidth disabled={submitting}>{submitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
                                    <Link href="/dashboard/provider/services" className="w-full"><Button type="button" variant="secondary" fullWidth>Annuler</Button></Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
