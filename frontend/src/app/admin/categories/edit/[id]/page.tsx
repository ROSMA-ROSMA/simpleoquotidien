'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { categoryService } from '@/services/category.service';
import { Category } from '@/types';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';

interface Props { params: Promise<{ id: string }>; }

export default function AdminEditCategoryPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const categoryId = parseInt(id);
    const [cat, setCat] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', description: '', icon: '' });

    useEffect(() => {
        (async () => {
            try {
                const res = await categoryService.getById(categoryId);
                setCat(res.data);
                setForm({ name: res.data.name, description: res.data.description, icon: res.data.icon });
            } catch { setError('Catégorie introuvable'); }
            finally { setLoading(false); }
        })();
    }, [categoryId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cat) return;
        setSaving(true);
        try {
            await categoryService.update(cat.id, { name: form.name, description: form.description });
            router.push('/dashboard/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!cat) return;
        try {
            await categoryService.delete(cat.id);
            router.push('/dashboard/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Chargement…</p></div>;
    if (error && !cat) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></div>;

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Modifier la catégorie</h1>
                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-base text-red-600">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nom" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Description</label>
                            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none" required />
                        </div>
                        <Input label="Icône" value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} />
                        <div className="flex gap-3 pt-2">
                            <Button type="submit" fullWidth disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
                            <Link href="/dashboard/admin" className="w-full"><Button variant="secondary" fullWidth>Annuler</Button></Link>
                        </div>
                    </form>
                    <button onClick={handleDelete} className="mt-4 w-full flex items-center justify-center gap-2 text-base font-bold text-red-600 hover:text-red-700 py-2">
                        <IconTrash className="w-4 h-4" /> Supprimer cette catégorie
                    </button>
                </div>
            </div>
        </div>
    );
}
