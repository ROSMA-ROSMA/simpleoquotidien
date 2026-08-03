'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import CategoryCard from '@/components/services/CategoryCard';
import SearchBar from '@/components/services/SearchBar';
import { useCategories } from '@/hooks/useCategories';
import { IconSparkles } from '@tabler/icons-react';

export default function ServicesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const { categories, loading, error } = useCategories();

    const filteredCategories = searchQuery
        ? categories.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : categories;

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />

            <section className="relative overflow-hidden border-b border-slate-100">
                <img
                    src="/hero-catalogue.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-surface/85 backdrop-blur-[2px]" />
                <div className="relative z-10 max-w-3xl mx-auto px-5 pt-32 pb-16 sm:pt-40 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-tealLight px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-teal">
                        <IconSparkles className="w-3.5 h-3.5" />
                        {loading ? 'Catalogue de services' : `${categories.length} univers de services disponibles`}
                    </span>
                    <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold text-brand-dark">
                        De quoi avez-vous besoin aujourd&apos;hui&nbsp;?
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
                        Choisissez une catégorie, puis le service qu&apos;il vous faut. On s&apos;occupe du reste.
                    </p>
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Plomberie, baby-sitting, location voiture…"
                        className="max-w-xl mx-auto mt-8 text-left"
                    />
                </div>
            </section>

            <section className="py-16 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">Toutes les catégories</h2>
                        {!loading && <p className="text-sm text-slate-500">{categories.length} univers de services</p>}
                    </div>
                    {loading && (
                        <p className="text-center text-slate-500 py-12">Chargement des catégories…</p>
                    )}
                    {error && (
                        <div className="text-center py-12">
                            <p className="text-red-600 mb-2">{error}</p>
                            <p className="text-sm text-slate-500">Vérifiez que le backend Django est démarré (BACKEND_URL).</p>
                        </div>
                    )}
                    {!loading && !error && filteredCategories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCategories.map(category => (
                                <CategoryCard key={category.id} category={category} />
                            ))}
                        </div>
                    ) : null}
                    {!loading && !error && filteredCategories.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-2xl mb-2">🔍</p>
                            <h3 className="text-lg font-bold text-brand-dark mb-1">Aucun résultat</h3>
                            <p className="text-slate-500 text-sm">Essayez un autre terme de recherche.</p>
                        </div>
                    ) : null}
                </div>
            </section>

            <Footer />
        </div>
    );
}
