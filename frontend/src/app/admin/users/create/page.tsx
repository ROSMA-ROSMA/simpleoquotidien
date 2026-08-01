'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authFetch } from '@/lib/api/client';
import { UserRole } from '@/types';
import { IconArrowLeft, IconUser, IconMail, IconPhone, IconLock, IconMapPin } from '@tabler/icons-react';
import Link from 'next/link';

export default function AdminCreateUserPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', phone_number: '', password: '',
        role: UserRole.CLIENT as string, intervention_city: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await authFetch('register', {
                method: 'POST',
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    role: form.role,
                    pays: 'Burkina Faso',
                }),
            });
            router.push('/dashboard/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création');
        } finally { setSaving(false); }
    };

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Créer un utilisateur</h1>
                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-base text-red-600">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Prénom" placeholder="Prénom" value={form.first_name} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} icon={<IconUser className="w-5 h-5" />} required />
                            <Input label="Nom" placeholder="Nom" value={form.last_name} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} icon={<IconUser className="w-5 h-5" />} required />
                        </div>
                        <Input label="Email" type="email" placeholder="email@exemple.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} icon={<IconMail className="w-5 h-5" />} required />
                        <Input label="Téléphone" type="tel" placeholder="+226 70 00 00 00" value={form.phone_number} onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))} icon={<IconPhone className="w-5 h-5" />} />
                        <Input label="Mot de passe" type="password" placeholder="Minimum 8 caractères" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} icon={<IconLock className="w-5 h-5" />} required />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Rôle</label>
                            <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none">
                                <option value="client">Client</option>
                                <option value="provider">Prestataire</option>
                                <option value="agent">Agent</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        {form.role === 'provider' && (
                            <Input label="Ville d'intervention" placeholder="Ex: Ouagadougou" value={form.intervention_city} onChange={(e) => setForm(f => ({ ...f, intervention_city: e.target.value }))} icon={<IconMapPin className="w-5 h-5" />} required />
                        )}
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
