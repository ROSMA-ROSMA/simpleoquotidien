'use client';

import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import CategoryCard from '@/components/services/CategoryCard';
import { useCategories } from '@/hooks/useCategories';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const { categories, loading } = useCategories();

    const q = query.trim().toLowerCase();
    const results = q
        ? categories.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        )
        : [];

    return (
        <main className="flex-1 pt-28 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold text-brand-dark mb-2">
                    Résultats pour &ldquo;{query}&rdquo;
                </h1>
                <p className="text-slate-500 mb-8">
                    {loading ? 'Recherche…' : `${results.length} catégorie${results.length !== 1 ? 's' : ''} trouvée${results.length !== 1 ? 's' : ''}`}
                </p>

                {loading ? (
                    <p className="text-center text-slate-500 py-12">Chargement…</p>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map(category => (
                            <CategoryCard key={category.id} category={category} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-card">
                        <h3 className="text-lg font-bold text-brand-dark mb-1">Aucun résultat trouvé</h3>
                        <p className="text-slate-500 text-sm mb-6">Essayez un terme de recherche différent (ex. plomberie, ménage, baby-sitting…).</p>
                        <Link href="/services" className="text-brand-teal font-bold hover:text-brand-tealDark">
                            Explorer toutes les catégories →
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
