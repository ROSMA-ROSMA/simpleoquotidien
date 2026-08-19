'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProviderRating from '@/components/reviews/ProviderRating';
import StarRating from '@/components/ui/StarRating';
import { providerService } from '@/services/provider.service';
import { reviewService } from '@/services/review.service';
import { mapProviderFromBackend } from '@/lib/mappers/backend';
import { getInitials, formatDateTime } from '@/lib/utils';
import { BackendNote } from '@/types/backend';
import {
    IconArrowLeft, IconMail, IconMapPin, IconLanguage, IconCoin,
    IconFileText, IconId, IconBriefcase, IconPhoto, IconMessage,
} from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

type Provider = ReturnType<typeof mapProviderFromBackend>;

function statusVariant(status: string) {
    switch (status) {
        case 'VALIDE': return 'success' as const;
        case 'REJETE':
        case 'SUSPENDU': return 'danger' as const;
        default: return 'warning' as const;
    }
}

function statusLabel(status: string) {
    switch (status) {
        case 'VALIDE': return 'Vérifié';
        case 'REJETE': return 'Rejeté';
        case 'SUSPENDU': return 'Suspendu';
        default: return 'En attente';
    }
}

export default function AgentPrestataireProfilePage({ params }: Props) {
    const { id } = use(params);
    const providerId = parseInt(id, 10);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<BackendNote[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await providerService.getProfileById(providerId);
            setProvider(res.data);
        } catch { setProvider(null); }
        finally { setLoading(false); }
    }, [providerId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        setReviewsLoading(true);
        reviewService.getByProvider(providerId)
            .then(setReviews)
            .catch(() => setReviews([]))
            .finally(() => setReviewsLoading(false));
    }, [providerId]);

    const averageRating = reviews.length ? reviews.reduce((sum, r) => sum + r.etoile, 0) / reviews.length : 0;

    if (loading) {
        return (
            <AgentLayout title="Chargement…">
                <p className="text-slate-400 text-sm">Chargement du profil…</p>
            </AgentLayout>
        );
    }

    if (!provider) {
        return (
            <AgentLayout title="Prestataire introuvable">
                <Link href="/agent/prestataire" className="text-brand-teal font-bold text-sm">← Retour aux prestataires</Link>
            </AgentLayout>
        );
    }

    return (
        <AgentLayout title={provider.company_name || `${provider.first_name} ${provider.last_name}`} subtitle="Profil du prestataire">
            <Link href="/agent/prestataire" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium text-sm transition-colors mb-5">
                <IconArrowLeft className="w-4 h-4" /> Retour aux prestataires
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 text-center">
                        {provider.photo ? (
                            <img src={provider.photo} alt={provider.company_name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-brand-tealLight" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                                {getInitials(provider.first_name, provider.last_name)}
                            </div>
                        )}
                        <p className="font-extrabold text-brand-dark text-lg">{provider.company_name || `${provider.first_name} ${provider.last_name}`}</p>
                        <p className="text-sm text-slate-400 mb-3">{provider.first_name} {provider.last_name}</p>
                        <Badge variant={statusVariant(provider.verification_status)}>{statusLabel(provider.verification_status)}</Badge>
                        {!reviewsLoading && (
                            <div className="flex justify-center mt-3">
                                <ProviderRating average={averageRating} count={reviews.length} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                        <h3 className="font-bold text-brand-dark mb-4">Coordonnées & activité</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
                                <IconMail className="w-4 h-4 text-brand-teal shrink-0" />
                                <span className="text-slate-700">{provider.email}</span>
                            </div>
                            <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
                                <IconMapPin className="w-4 h-4 text-brand-mint shrink-0" />
                                <span className="text-slate-700">{provider.zones_couvertes || 'Zones non renseignées'}</span>
                            </div>
                            <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
                                <IconLanguage className="w-4 h-4 text-brand-coral shrink-0" />
                                <span className="text-slate-700">{provider.langue || 'Langue non renseignée'}</span>
                            </div>
                            <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
                                <IconCoin className="w-4 h-4 text-brand-teal shrink-0" />
                                <span className="text-slate-700 font-bold">{provider.tarif || 'Tarif non renseigné'}</span>
                            </div>
                            <div className="flex items-start gap-3 border-t border-slate-50 pt-3">
                                <IconBriefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <span className="text-slate-700">{provider.services || 'Aucune description de service.'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                        <h3 className="font-bold text-brand-dark mb-4">Documents</h3>
                        <div className="flex flex-wrap gap-3">
                            {provider.cni_passeport && (
                                <a href={provider.cni_passeport} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" icon={<IconId className="w-4 h-4" />}>CNI / Passeport</Button>
                                </a>
                            )}
                            {provider.justificatif && (
                                <a href={provider.justificatif} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" icon={<IconFileText className="w-4 h-4" />}>Justificatif</Button>
                                </a>
                            )}
                            {provider.photo && (
                                <a href={provider.photo} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" icon={<IconPhoto className="w-4 h-4" />}>Photo</Button>
                                </a>
                            )}
                            {!provider.cni_passeport && !provider.justificatif && !provider.photo && (
                                <p className="text-sm text-slate-400">Aucun document fourni.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-brand-dark flex items-center gap-2">
                                <IconMessage className="w-4 h-4 text-brand-teal" /> Avis clients
                            </h3>
                            {!reviewsLoading && reviews.length > 0 && (
                                <ProviderRating average={averageRating} count={reviews.length} />
                            )}
                        </div>
                        {reviewsLoading ? (
                            <p className="text-sm text-slate-400">Chargement des avis…</p>
                        ) : reviews.length === 0 ? (
                            <p className="text-sm text-slate-400">Aucun avis client pour l&apos;instant.</p>
                        ) : (
                            <div className="space-y-4">
                                {[...reviews]
                                    .sort((a, b) => (b.date_creation ?? '').localeCompare(a.date_creation ?? ''))
                                    .map(r => (
                                        <div key={r.id} className="border-t border-slate-50 pt-4 first:border-t-0 first:pt-0">
                                            <div className="flex items-center justify-between gap-3 mb-1">
                                                <StarRating rating={r.etoile} size="sm" />
                                                <span className="text-xs text-slate-400 shrink-0">{r.date_creation ? formatDateTime(r.date_creation) : ''}</span>
                                            </div>
                                            {r.commentaire && <p className="text-sm text-slate-600">&ldquo;{r.commentaire}&rdquo;</p>}
                                            {r.author_email && <p className="text-xs text-slate-400 mt-1">{r.author_email}</p>}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}
