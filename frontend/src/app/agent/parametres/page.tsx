'use client';

import { useState } from 'react';
import AgentLayout from '@/components/layout/AgentLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import { IconUser, IconPhone, IconMapPin } from '@tabler/icons-react';

export default function AgentParametresPage() {
    const { currentUser } = useAuth();
    const [success, setSuccess] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        first_name: currentUser?.first_name ?? '',
        last_name: currentUser?.last_name ?? '',
        phone_number: currentUser?.phone_number ?? '',
        intervention_city: currentUser?.intervention_city ?? '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        setError(null);
        try {
            await authService.updateProfile({
                first_name: form.first_name,
                last_name: form.last_name,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        } finally { setSaving(false); }
    };

    return (
        <AgentLayout title="Paramètres" subtitle="Gérez vos informations d'agent">
            <div className="max-w-xl bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                {success && <Alert variant="success" title="Paramètres enregistrés" className="mb-6" />}
                {error && <Alert variant="error" title={error} className="mb-6" />}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Prénom" value={form.first_name} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} icon={<IconUser className="w-5 h-5" />} required />
                        <Input label="Nom" value={form.last_name} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} icon={<IconUser className="w-5 h-5" />} required />
                    </div>
                    <Input label="Téléphone" type="tel" value={form.phone_number} onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))} icon={<IconPhone className="w-5 h-5" />} disabled />
                    <Input label="Zone d'intervention" value={form.intervention_city} onChange={(e) => setForm(f => ({ ...f, intervention_city: e.target.value }))} icon={<IconMapPin className="w-5 h-5" />} disabled />
                    <p className="text-[11px] text-slate-400">Le téléphone et la zone d&apos;intervention ne sont modifiables que via l&apos;admin Django.</p>
                    <Button type="submit" fullWidth size="lg" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
                </form>
            </div>
        </AgentLayout>
    );
}
