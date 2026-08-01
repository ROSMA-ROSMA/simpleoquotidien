'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import CategoryCard from '@/components/services/CategoryCard';
import SearchBar from '@/components/services/SearchBar';
import { useCategories } from '@/hooks/useCategories';

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

            <section className="pt-32 pb-12 bg-mesh relative overflow-hidden">
                <div className="absolute top-20 right-10 w-72 h-72 bg-brand-mint/15 rounded-full filter blur-3xl opacity-70" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark mb-4">
                            Nos <span className="gradient-text">Univers</span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Explorez nos catégories et demandez une intervention par univers de service.
                        </p>
                    </div>

                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Rechercher un service ou une catégorie..."
                        className="max-w-2xl mx-auto"
                    />
                </div>
            </section>

            <section className="py-16 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
