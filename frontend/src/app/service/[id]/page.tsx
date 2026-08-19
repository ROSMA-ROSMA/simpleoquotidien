'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { serviceService } from '@/services/service.service';
import { formatPrice } from '@/lib/utils';
import { ProviderService } from '@/types';
import { IconMapPin, IconUser, IconArrowLeft, IconBriefcase } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function ServiceDetailPage({ params }: Props) {
    const { id } = use(params);
    const serviceId = parseInt(id, 10);
    const [service, setService] = useState<ProviderService | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        serviceService.getById(serviceId)
            .then(res => setService(res.data))
            .catch(() => setService(null))
            .finally(() => setLoading(false));
    }, [serviceId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <p className="text-slate-500">Chargement…</p>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Service introuvable</h1>
                    <Link href="/services" className="text-brand-teal font-bold">← Retour aux services</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href={`/services/category/${service.category_id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour à {service.category_name ?? 'la catégorie'}
                    </Link>

                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                        {service.image ? (
                            <img src={service.image} alt={service.category_name ?? 'Service'} className="w-full h-56 object-cover" />
                        ) : (
                            <div className="w-full h-56 bg-brand-tealLight flex items-center justify-center">
                                <IconBriefcase className="w-12 h-12 text-brand-teal/50" />
                            </div>
                        )}
                        <div className="p-6 sm:p-8">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-brand-teal mb-1">{service.category_name ?? 'Catégorie'}</p>
                                    <h1 className="text-2xl font-extrabold text-brand-dark">{formatPrice(service.price)} FCFA</h1>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
                                {service.prestataire_name && (
                                    <span className="flex items-center gap-1.5"><IconUser className="w-4 h-4" /> {service.prestataire_name}</span>
                                )}
                                <span className="flex items-center gap-1.5"><IconMapPin className="w-4 h-4" /> {service.city}</span>
                            </div>
                            {service.description && (
                                <p className="text-slate-600 mb-6">{service.description}</p>
                            )}
                            {/* Le client ne choisit pas ce prestataire précis : il ouvre une demande sur la
                                catégorie, et c'est un agent qui assigne le prestataire le plus adapté. */}
                            <Link href={`/services/category/${service.category_id}/book`}>
                                <Button fullWidth size="lg">Demander une intervention dans cette catégorie</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
