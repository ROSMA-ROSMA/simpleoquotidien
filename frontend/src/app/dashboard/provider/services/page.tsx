'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { serviceService } from '@/services/service.service';
import { providerService } from '@/services/provider.service';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { ProviderService } from '@/types';
import { IconBriefcase, IconPlus, IconMapPin, IconClock, IconEdit, IconTrash, IconEye, IconAlertTriangle } from '@tabler/icons-react';

export default function ProviderServicesPage() {
    const { currentUser } = useAuth();
    const [services, setServices] = useState<ProviderService[]>([]);
    const [loading, setLoading] = useState(true);
    const [isValidated, setIsValidated] = useState(false);
    const [detailTarget, setDetailTarget] = useState<ProviderService | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ProviderService | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const providers = await providerService.getProviders();
            const myProfile = providers.data.find(p => p.email === currentUser.email);
            setIsValidated(myProfile?.verification_status === 'VALIDE');
            if (!myProfile) { setServices([]); return; }
            const res = await serviceService.getAll({ prestataire_id: myProfile.id });
            setServices(res.data);
        } catch { setServices([]); }
        finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => { load(); }, [load]);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await serviceService.delete(deleteTarget.id);
            setServices(prev => prev.filter(s => s.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
        } finally {
            setDeleting(false);
        }
    };

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link></div>;
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="services" />
            <main className="flex-1 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <h1 className="text-2xl font-extrabold text-brand-dark">Mes services</h1>
                        {!loading && isValidated && (
                            <Link href="/dashboard/provider/services/create">
                                <Button size="sm" icon={<IconPlus className="w-4 h-4" />}>Créer un service</Button>
                            </Link>
                        )}
                    </div>
                    {!loading && !isValidated && (
                        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6 text-sm text-yellow-800">
                            <IconClock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>
                                Votre profil doit d&apos;abord être validé par l&apos;administrateur avant de pouvoir créer un service.
                            </p>
                        </div>
                    )}
                    {loading ? (
                        <p className="text-[11px] text-slate-400">Chargement…</p>
                    ) : services.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map(service => (
                                <div key={service.id} className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                                    {service.image ? (
                                        <img src={service.image} alt={service.category_name ?? 'Service'} className="w-full h-36 object-cover" />
                                    ) : (
                                        <div className="w-full h-36 bg-brand-tealLight flex items-center justify-center">
                                            <IconBriefcase className="w-8 h-8 text-brand-teal/50" />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-teal mb-1">{service.category_name ?? 'Catégorie'}</p>
                                        <p className="text-lg font-extrabold text-brand-dark mb-2">{formatPrice(service.price)} FCFA</p>
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
                                            <IconMapPin className="w-3.5 h-3.5" /> {service.city}
                                        </div>
                                        {service.description && <p className="text-[11px] text-slate-500 line-clamp-2">{service.description}</p>}
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                                            <Button variant="secondary" size="sm" onClick={() => setDetailTarget(service)} icon={<IconEye className="w-3.5 h-3.5" />}>Détail</Button>
                                            <Link href={`/dashboard/provider/services/${service.id}/edit`}>
                                                <Button variant="secondary" size="sm" icon={<IconEdit className="w-3.5 h-3.5" />}>Modifier</Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="!text-red-500 hover:!bg-red-50"
                                                onClick={() => { setDeleteError(null); setDeleteTarget(service); }}
                                                icon={<IconTrash className="w-3.5 h-3.5" />}
                                            >
                                                Supprimer
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<IconBriefcase className="w-8 h-8" />} title="Aucun service" description="Créez votre premier service à partir des catégories disponibles." />
                    )}
                </div>
            </main>
            <Footer />

            <Modal open={detailTarget !== null} onClose={() => setDetailTarget(null)} title="Détail du service">
                {detailTarget && (
                    <div className="space-y-4">
                        {detailTarget.image && (
                            <img src={detailTarget.image} alt={detailTarget.category_name ?? 'Service'} className="w-full h-44 object-cover rounded-xl border border-slate-200" />
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400 text-xs font-bold uppercase">Catégorie</span>
                                <p className="text-slate-700 font-medium">{detailTarget.category_name ?? '—'}</p>
                            </div>
                            <div>
                                <span className="text-slate-400 text-xs font-bold uppercase">Prix</span>
                                <p className="text-slate-700 font-medium">{formatPrice(detailTarget.price)} FCFA</p>
                            </div>
                            <div>
                                <span className="text-slate-400 text-xs font-bold uppercase">Ville</span>
                                <p className="text-slate-700 font-medium">{detailTarget.city}</p>
                            </div>
                            <div>
                                <span className="text-slate-400 text-xs font-bold uppercase">Créé le</span>
                                <p className="text-slate-700 font-medium">{detailTarget.created_at ? formatDateTime(detailTarget.created_at) : '—'}</p>
                            </div>
                        </div>
                        {detailTarget.description && (
                            <div>
                                <span className="text-slate-400 text-xs font-bold uppercase">Description</span>
                                <p className="text-slate-600 text-sm mt-1">{detailTarget.description}</p>
                            </div>
                        )}
                        <div className="flex justify-end pt-2">
                            <Button variant="secondary" onClick={() => setDetailTarget(null)}>Fermer</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)} title="Supprimer ce service ?">
                {deleteTarget && (
                    <div>
                        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                            <IconAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">
                                Voulez-vous vraiment supprimer ce service ({deleteTarget.category_name ?? 'Service'} — {formatPrice(deleteTarget.price)} FCFA) ?
                                Il sera immédiatement retiré du catalogue.
                            </p>
                        </div>
                        {deleteError && <p className="text-[11px] text-red-600 mt-3">{deleteError}</p>}
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Annuler</Button>
                            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Suppression…' : 'Confirmer la suppression'}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
