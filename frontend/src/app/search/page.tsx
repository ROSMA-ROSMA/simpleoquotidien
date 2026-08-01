'use client';

import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import ServiceCard from '@/components/services/ServiceCard';
import { useAppStore } from '@/store/useAppStore';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const services = useAppStore(s => s.services);

    const results = query
        ? services.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.description.toLowerCase().includes(query.toLowerCase()) ||
            s.category?.name.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    return (
        <main className="flex-1 pt-28 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold text-brand-dark mb-2">
                    Résultats pour &ldquo;{query}&rdquo;
                </h1>
                <p className="text-slate-500 mb-8">{results.length} résultat{results.length !== 1 ? 's' : ''}</p>

                {results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map(service => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-card">
                        <p className="text-4xl mb-4">🔍</p>
                        <h3 className="text-lg font-bold text-brand-dark mb-1">Aucun résultat trouvé</h3>
                        <p className="text-slate-500 text-sm mb-6">Essayez un terme de recherche différent.</p>
                        <Link href="/services" className="text-brand-teal font-bold hover:text-brand-tealDark">
                            Explorer les catégories →
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <Suspense fallback={<div className="flex-1 pt-28 pb-16 flex items-center justify-center"><p>Chargement...</p></div>}>
                <SearchContent />
            </Suspense>
            <Footer />
        </div>
    );
}
