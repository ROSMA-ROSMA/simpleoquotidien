'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import { providerService } from '@/services/provider.service';
import { useProviderProfile } from '@/hooks/useProviderProfile';
import { getInitials } from '@/lib/utils';
import { UserRole } from '@/types';
import { IconUser, IconMail, IconPhone, IconLock, IconGlobe, IconMapPin, IconCamera } from '@tabler/icons-react';

export default function ProfilePage() {
    const { currentUser, refreshUser } = useAuth();
    const { profile: providerProfile, loading: providerProfileLoading, reload: reloadProviderProfile } = useProviderProfile();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        preferred_language: 'fr',
        intervention_city: '',
        pays: 'Burkina Faso',
    });

    useEffect(() => {
        if (!currentUser) return;
        setForm({
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            phone_number: currentUser.phone_number ?? '',
            preferred_language: currentUser.preferred_language ?? 'fr',
            intervention_city: currentUser.intervention_city ?? '',
            pays: currentUser.pays ?? 'Burkina Faso',
        });
    }, [currentUser]);

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link></div>;
    }

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !providerProfile) return;
        setUploadingPhoto(true);
        setError('');
        try {
            await providerService.updatePhoto(providerProfile.id, file);
            await reloadProviderProfile();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible de mettre à jour la photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await authService.updateProfile({
                first_name: form.first_name,
                last_name: form.last_name,
                pays: form.pays,
            });
            await refreshUser();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible de mettre à jour le profil');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar />
            <main className="flex-1 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-8">Mon profil</h1>

                    {success && <Alert variant="success" title="Profil mis à jour avec succès !" className="mb-6" />}
                    {error && <Alert variant="error" title={error} className="mb-6" />}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 text-center">
                            <div className="relative w-24 h-24 mx-auto mb-4">
                                {providerProfile?.photo ? (
                                    <img src={providerProfile.photo} alt={currentUser.first_name} className="w-24 h-24 rounded-full object-cover ring-4 ring-brand-tealLight" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center text-3xl font-bold ring-4 ring-brand-tealLight">
                                        {getInitials(currentUser.first_name, currentUser.last_name)}
                                    </div>
                                )}
                                {currentUser.role === UserRole.PROVIDER && !providerProfileLoading && providerProfile && (
                                    <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center cursor-pointer border-2 border-white hover:bg-brand-tealDark transition-colors" title="Changer la photo">
                                        {uploadingPhoto ? (
                                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <IconCamera className="w-4 h-4" />
                                        )}
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
                                    </label>
                                )}
                            </div>
                            <h3 className="font-bold text-brand-dark text-lg">{currentUser.first_name} {currentUser.last_name}</h3>
                            <p className="text-slate-500 text-sm capitalize">{currentUser.role}</p>
                            <p className="text-xs text-slate-400 mt-1">{currentUser.email}</p>
                        </div>

                        <div className="md:col-span-2 bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                            <h2 className="text-lg font-bold text-brand-dark mb-6">Informations personnelles</h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Prénom" value={form.first_name} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} icon={<IconUser className="w-5 h-5" />} required />
                                    <Input label="Nom" value={form.last_name} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} icon={<IconUser className="w-5 h-5" />} required />
                                </div>
                                <Input label="Email" type="email" defaultValue={currentUser.email} icon={<IconMail className="w-5 h-5" />} disabled />
                                <Input label="Pays" value={form.pays} onChange={(e) => setForm(f => ({ ...f, pays: e.target.value }))} icon={<IconMapPin className="w-5 h-5" />} />
                                <Input label="Téléphone" type="tel" value={form.phone_number} onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))} icon={<IconPhone className="w-5 h-5" />} disabled />
                                {currentUser.role === UserRole.PROVIDER && (
                                    <Input label="Ville d'intervention" value={form.intervention_city} onChange={(e) => setForm(f => ({ ...f, intervention_city: e.target.value }))} icon={<IconMapPin className="w-5 h-5" />} disabled />
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Langue préférée</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconGlobe className="w-5 h-5" /></div>
                                        <select value={form.preferred_language} onChange={(e) => setForm(f => ({ ...f, preferred_language: e.target.value }))} disabled className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none">
                                            <option value="fr">Français</option>
                                            <option value="en">Anglais</option>
                                            <option value="moore">Mooré</option>
                                            <option value="dioula">Dioula</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 mb-4">Le changement de mot de passe et certains champs seront disponibles prochainement via l&apos;API.</p>
                                    <Input label="Nouveau mot de passe" type="password" placeholder="Non disponible" disabled icon={<IconLock className="w-5 h-5" />} />
                                </div>

                                <Button type="submit" size="lg" fullWidth disabled={submitting}>
                                    {submitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
