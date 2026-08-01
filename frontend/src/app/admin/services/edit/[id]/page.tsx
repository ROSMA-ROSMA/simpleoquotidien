'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useCategories } from '@/hooks/useCategories';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';

interface Props { params: Promise<{ id: string }>; }

export default function AdminEditServicePage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const serviceId = parseInt(id);
    const service = useAppStore(s => s.services.find(sv => sv.id === serviceId));
    const { categories } = useCategories();
    const updateService = useAppStore(s => s.updateService);
    const deleteService = useAppStore(s => s.deleteService);
    const [form, setForm] = useState({
        name: service?.name ?? '', category_id: service?.category_id ?? 0,
        price: String(service?.price ?? ''), description: service?.description ?? '', location: service?.location ?? '',
    });

    if (!service) return <div className="min-h-screen flex items-center justify-center"><p>Service introuvable</p></div>;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const category = categories.find(c => c.id === Number(form.category_id));
        updateService(service.id, {
            name: form.name,
            category_id: Number(form.category_id),
            category,
            price: Number(form.price),
            description: form.description,
            location: form.location || undefined,
        });
        router.push('/dashboard/admin');
    };

    const handleDelete = () => {
        deleteService(service.id);
        router.push('/dashboard/admin');
    };

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Modifier le service</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nom" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Catégorie</label>
                            <select value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <Input label="Prix (FCFA)" type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Description</label>
                            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none" required />
                        </div>
                        <Input label="Localisation" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
                        <div className="flex gap-3 pt-2">
                            <Button type="submit" fullWidth>Enregistrer</Button>
                            <Link href="/dashboard/admin" className="w-full"><Button variant="secondary" fullWidth>Annuler</Button></Link>
                        </div>
                    </form>
                    <button onClick={handleDelete} className="mt-4 w-full flex items-center justify-center gap-2 text-base font-bold text-red-600 hover:text-red-700 py-2">
                        <IconTrash className="w-4 h-4" /> Supprimer ce service
                    </button>
                </div>
            </div>
        </div>
    );
}
