'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { categoryService } from '@/services/category.service';
import { IconArrowLeft, IconPhoto } from '@tabler/icons-react';
import Link from 'next/link';

export default function AdminCreateCategoryPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', description: '' });
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImage(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await categoryService.create({ name: form.name, description: form.description, image: image ?? undefined });
            router.push('/dashboard/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création');
        } finally { setSaving(false); }
    };

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Créer une catégorie</h1>
                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-base text-red-600">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nom" placeholder="Ex: Beauté & Bien-être" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Description</label>
                            <textarea placeholder="Décrivez la catégorie..." rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none" required />
                        </div>
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Image de la catégorie</label>
                            {preview && (
                                <img src={preview} alt="Aperçu" className="w-full h-40 object-cover rounded-xl mb-3 border border-slate-200" />
                            )}
                            <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-base font-semibold text-slate-500 cursor-pointer hover:border-brand-teal hover:text-brand-teal transition-colors">
                                <IconPhoto className="w-5 h-5" />
                                {image ? image.name : 'Choisir une image…'}
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
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
