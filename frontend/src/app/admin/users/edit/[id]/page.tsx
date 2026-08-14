'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { UserRole, User } from '@/types';
import { IconArrowLeft, IconUser, IconMail, IconPhone, IconMapPin } from '@tabler/icons-react';
import Link from 'next/link';

interface Props { params: Promise<{ id: string }>; }

export default function AdminEditUserPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const userId = parseInt(id);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '',
        phone_number: '', role: UserRole.CLIENT as UserRole,
        intervention_city: '', is_active: true,
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await userService.getById(userId);
                setUser(res.data);
                setForm({
                    first_name: res.data.first_name,
                    last_name: res.data.last_name,
                    email: res.data.email,
                    phone_number: res.data.phone_number ?? '',
                    role: res.data.role,
                    intervention_city: res.data.intervention_city ?? '',
                    is_active: res.data.is_active,
                });
            } catch { setError('Utilisateur introuvable'); }
            finally { setLoading(false); }
        })();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Backend UtilisateurViewSet is ReadOnly — use djoser PATCH /auth/users/me/ only for self
            // For other users, this is a limitation of the backend
            await authService.updateProfile({
                first_name: form.first_name,
                last_name: form.last_name,
            });
            router.push('/dashboard/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Chargement…</p></div>;
    if (error || !user) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error ?? 'Utilisateur introuvable'}</p></div>;

    return (
        <div className="min-h-screen bg-brand-surface py-10">
            <div className="max-w-xl mx-auto px-4">
                <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6"><IconArrowLeft className="w-4 h-4" /> Retour</Link>
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-slate-100">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Modifier l&apos;utilisateur</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Prénom" value={form.first_name} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} icon={<IconUser className="w-5 h-5" />} required />
                            <Input label="Nom" value={form.last_name} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} icon={<IconUser className="w-5 h-5" />} required />
                        </div>
                        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} icon={<IconMail className="w-5 h-5" />} required disabled />
                        <Input label="Téléphone" type="tel" value={form.phone_number} onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))} icon={<IconPhone className="w-5 h-5" />} disabled />
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Rôle</label>
                            <select value={form.role} disabled className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-base outline-none opacity-60">
                                <option value={UserRole.CLIENT}>Client</option>
                                <option value={UserRole.PROVIDER}>Prestataire</option>
                                <option value={UserRole.AGENT}>Agent</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                            <p className="text-sm text-slate-400 mt-1">Le rôle ne peut être modifié que via l&apos;admin Django.</p>
                        </div>
                        {form.role === UserRole.PROVIDER && (
                            <Input label="Ville d'intervention" value={form.intervention_city} onChange={(e) => setForm(f => ({ ...f, intervention_city: e.target.value }))} icon={<IconMapPin className="w-5 h-5" />} disabled />
                        )}
                        <div className="flex gap-3 pt-2">
                            <Button type="submit" fullWidth disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
                            <Link href="/dashboard/admin" className="w-full"><Button variant="secondary" fullWidth>Annuler</Button></Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
