'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import RolePicker from '@/components/auth/RolePicker';
import { useAuth } from '@/context/AuthContext';
import { IconMail, IconLock, IconUser, IconPhone, IconUpload, IconCalendar, IconShieldCheck, IconMapPin, IconFile, IconX } from '@tabler/icons-react';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [role, setRole] = useState<'client' | 'provider'>('client');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        identity_card_expiry: '',
        insurance_status: false,
        intervention_city: '',
        company_name: '',
        services: '',
        langue: 'Français',
        tarif: '',
    });
    const [cniFile, setCniFile] = useState<File | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const updateField = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validate = (): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (!formData.first_name.trim()) errors.first_name = 'Le prénom est obligatoire.';
        if (!formData.last_name.trim()) errors.last_name = 'Le nom est obligatoire.';

        if (!formData.email.trim()) errors.email = "L'email est obligatoire.";
        else if (!EMAIL_RE.test(formData.email.trim())) errors.email = 'Veuillez saisir une adresse email valide.';

        if (!formData.password) errors.password = 'Le mot de passe est obligatoire.';
        else if (formData.password.length < 8) errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';

        if (role === 'provider') {
            if (!formData.company_name.trim()) errors.company_name = "Le nom de l'entreprise / activité est obligatoire.";
            if (!formData.intervention_city.trim()) errors.intervention_city = "La ville d'intervention est obligatoire pour un prestataire.";
            if (!formData.identity_card_expiry) errors.identity_card_expiry = "La date d'expiration de la pièce d'identité est obligatoire.";
            if (!cniFile) errors.cniFile = "La pièce d'identité est obligatoire.";
            if (!photoFile) errors.photoFile = 'La photo est obligatoire.';
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setError('Veuillez corriger les champs indiqués ci-dessous.');
            return;
        }

        if (role === 'provider') {
            // Prestataire registration — send multipart to the backend proxy
            if (!cniFile || !photoFile) return; // déjà validé par validate() ci-dessus

            setSubmitting(true);
            setError('');

            try {
                const fd = new FormData();
                // Nested user fields for PrestataireCreateSerializer
                fd.append('user.email', formData.email);
                fd.append('user.password', formData.password);
                fd.append('user.re_password', formData.password);
                fd.append('user.first_name', formData.first_name);
                fd.append('user.last_name', formData.last_name);
                fd.append('user.username', formData.email.split('@')[0]);
                fd.append('user.role', 'PRESTATAIRE');
                fd.append('user.pays', 'Burkina Faso');
                fd.append('company_name', formData.company_name);
                fd.append('services', formData.services || 'À définir');
                fd.append('zones_couvertes', formData.intervention_city);
                fd.append('langue', formData.langue);
                fd.append('tarif', formData.tarif || 'À définir');
                fd.append('cni_passeport', cniFile);
                fd.append('justificatif', cniFile); // use same doc as justificatif
                fd.append('photo', photoFile);

                const res = await fetch('/api/backend/Info_utilisateurs/prestataires/', {
                    method: 'POST',
                    body: fd,
                    credentials: 'same-origin',
                });

                const body = await res.json().catch(() => null);
                if (!res.ok) {
                    // Extract readable error from proxy response: { error, details }
                    let msg = 'Inscription impossible.';
                    if (body?.details && typeof body.details === 'object') {
                        // DRF validation errors: { field: ["message", ...] } — mais aussi
                        // nichés sous 'user' pour les champs du sous-serializer (email,
                        // username, password), ex. { user: { email: ["..."] } }.
                        const messages: string[] = [];
                        const collect = (val: unknown): void => {
                            if (Array.isArray(val)) messages.push(...val.map(String));
                            else if (typeof val === 'string') messages.push(val);
                            else if (val && typeof val === 'object') {
                                for (const nested of Object.values(val)) collect(nested);
                            }
                        };
                        collect(body.details);
                        if (messages.length) msg = messages.join(' ');
                    } else if (body?.error) {
                        msg = String(body.error);
                    }
                    setError(msg);
                    setSubmitting(false);
                    return;
                }

                router.push('/register/pending');
            } catch {
                setError('Erreur serveur. Réessayez.');
            } finally {
                setSubmitting(false);
            }
            return;
        }

        // Client registration — standard flow
        setSubmitting(true);
        setError('');
        const result = await register({
            email: formData.email,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            role,
            pays: 'Burkina Faso',
            intervention_city: undefined,
        });
        setSubmitting(false);
        if (!result.success) {
            setError(result.error ?? 'Une erreur est survenue.');
            return;
        }
        router.push('/login?registered=true');
    };

    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 transition-transform group-hover:scale-105">
                            <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-7 h-7" />
                        </div>
                        <span className="text-xl font-extrabold text-brand-teal">Simple<span className="text-brand-coral">Ô</span>Quotidien</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 sm:p-10">
                    <h1 className="text-3xl font-extrabold text-brand-dark mb-2 text-center">Créer votre compte</h1>
                    <p className="text-slate-500 text-center mb-8">Rejoignez la communauté SimpleÔQuotidien</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Picker */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Je suis :</label>
                            <RolePicker selectedRole={role} onChange={setRole} />
                        </div>

                        {/* Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Prénom"
                                placeholder="Votre prénom"
                                value={formData.first_name}
                                onChange={(e) => updateField('first_name', e.target.value)}
                                icon={<IconUser className="w-5 h-5" />}
                                error={fieldErrors.first_name}
                                required
                            />
                            <Input
                                label="Nom"
                                placeholder="Votre nom"
                                value={formData.last_name}
                                onChange={(e) => updateField('last_name', e.target.value)}
                                icon={<IconUser className="w-5 h-5" />}
                                error={fieldErrors.last_name}
                                required
                            />
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            placeholder="votre@email.com"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            icon={<IconMail className="w-5 h-5" />}
                            error={fieldErrors.email}
                            required
                        />

                        <Input
                            label="Téléphone"
                            type="tel"
                            placeholder="+226 70 00 00 00"
                            value={formData.phone_number}
                            onChange={(e) => updateField('phone_number', e.target.value)}
                            icon={<IconPhone className="w-5 h-5" />}
                        />

                        <Input
                            label="Mot de passe"
                            type="password"
                            placeholder="Minimum 8 caractères"
                            value={formData.password}
                            onChange={(e) => updateField('password', e.target.value)}
                            icon={<IconLock className="w-5 h-5" />}
                            error={fieldErrors.password}
                            required
                        />

                        {/* Provider-specific fields */}
                        {role === 'provider' && (
                            <div className="space-y-5 p-5 bg-brand-tealLight/30 rounded-2xl border border-brand-teal/10 animate-in">
                                <h3 className="text-sm font-bold text-brand-teal flex items-center gap-2">
                                    <IconShieldCheck className="w-4 h-4" />
                                    Informations prestataire
                                </h3>

                                <Input
                                    label="Nom de l'entreprise / activité"
                                    placeholder="Ex : Plomberie Express"
                                    value={formData.company_name}
                                    onChange={(e) => updateField('company_name', e.target.value)}
                                    icon={<IconUser className="w-5 h-5" />}
                                    error={fieldErrors.company_name}
                                    required
                                />

                                <Input
                                    label="Services proposés"
                                    placeholder="Ex : Plomberie, Électricité"
                                    value={formData.services}
                                    onChange={(e) => updateField('services', e.target.value)}
                                    icon={<IconShieldCheck className="w-5 h-5" />}
                                />

                                <Input
                                    label="Ville d'intervention"
                                    placeholder="Ex : Ouagadougou"
                                    value={formData.intervention_city}
                                    onChange={(e) => updateField('intervention_city', e.target.value)}
                                    icon={<IconMapPin className="w-5 h-5" />}
                                    error={fieldErrors.intervention_city}
                                    required
                                />

                                <Input
                                    label="Tarif indicatif"
                                    placeholder="Ex : 5000 FCFA/h"
                                    value={formData.tarif}
                                    onChange={(e) => updateField('tarif', e.target.value)}
                                    icon={<IconShieldCheck className="w-5 h-5" />}
                                />

                                <Input
                                    label="Date d'expiration de la pièce d'identité"
                                    type="date"
                                    value={formData.identity_card_expiry}
                                    onChange={(e) => updateField('identity_card_expiry', e.target.value)}
                                    icon={<IconCalendar className="w-5 h-5" />}
                                    error={fieldErrors.identity_card_expiry}
                                    required
                                />

                                {/* CNI File upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pièce d&apos;identité *</label>
                                    {cniFile ? (
                                        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                                            <IconFile className="w-5 h-5 flex-shrink-0" />
                                            <span className="truncate flex-1">{cniFile.name}</span>
                                            <button type="button" onClick={() => setCniFile(null)} className="text-green-600 hover:text-red-500 transition-colors">
                                                <IconX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand-teal hover:bg-brand-tealLight/20 transition-all text-sm text-slate-500">
                                            <IconUpload className="w-5 h-5" />
                                            <span>Cliquez pour télécharger</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={(e) => { setCniFile(e.target.files?.[0] ?? null); setFieldErrors(prev => { const next = { ...prev }; delete next.cniFile; return next; }); }}
                                            />
                                        </label>
                                    )}
                                    {fieldErrors.cniFile && <p className="text-xs text-red-500 font-medium mt-1.5">{fieldErrors.cniFile}</p>}
                                </div>

                                {/* Photo upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Photo récente *</label>
                                    {photoFile ? (
                                        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                                            <IconFile className="w-5 h-5 flex-shrink-0" />
                                            <span className="truncate flex-1">{photoFile.name}</span>
                                            <button type="button" onClick={() => setPhotoFile(null)} className="text-green-600 hover:text-red-500 transition-colors">
                                                <IconX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand-teal hover:bg-brand-tealLight/20 transition-all text-sm text-slate-500">
                                            <IconUpload className="w-5 h-5" />
                                            <span>Cliquez pour télécharger</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => { setPhotoFile(e.target.files?.[0] ?? null); setFieldErrors(prev => { const next = { ...prev }; delete next.photoFile; return next; }); }}
                                            />
                                        </label>
                                    )}
                                    {fieldErrors.photoFile && <p className="text-xs text-red-500 font-medium mt-1.5">{fieldErrors.photoFile}</p>}
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.insurance_status}
                                        onChange={(e) => updateField('insurance_status', e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                                    />
                                    <span className="text-sm text-slate-600">Je possède une assurance professionnelle</span>
                                </label>
                            </div>
                        )}

                        <Button type="submit" fullWidth size="lg" disabled={submitting}>
                            {submitting ? 'Envoi en cours…' : role === 'provider' ? 'Soumettre ma candidature' : 'Créer mon compte'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Déjà un compte ?{' '}
                        <Link href="/login" className="font-bold text-brand-teal hover:text-brand-tealDark transition-colors">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
