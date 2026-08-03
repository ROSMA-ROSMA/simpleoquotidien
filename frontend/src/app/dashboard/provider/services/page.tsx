'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { serviceService } from '@/services/service.service';
import { providerService } from '@/services/provider.service';
import { formatPrice } from '@/lib/utils';
import { ProviderService } from '@/types';
import { IconBriefcase, IconPlus, IconMapPin } from '@tabler/icons-react';

export default function ProviderServicesPage() {
    const { currentUser } = useAuth();
    const [services, setServices] = useState<ProviderService[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const providers = await providerService.getProviders();
            const myProfile = providers.data.find(p => p.email === currentUser.email);
            if (!myProfile) { setServices([]); return; }
            const res = await serviceService.getAll({ prestataire_id: myProfile.id });
            setServices(res.data);
        } catch { setServices([]); }
        finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => { load(); }, [load]);

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link></div>;
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="services" />
            <main className="flex-1 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-extrabold text-brand-dark">Mes services</h1>
                        <Link href="/dashboard/provider/services/create">
                            <Button size="sm" icon={<IconPlus className="w-4 h-4" />}>Créer un service</Button>
                        </Link>
                    </div>
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
                                        {service.description && <p className="text-[11px] text-slate-500">{service.description}</p>}
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
        </div>
    );
}
