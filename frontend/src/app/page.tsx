'use client';

import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import ServiceCard from '@/components/services/ServiceCard';
import { useAppStore } from '@/store/useAppStore';
import { useCategories } from '@/hooks/useCategories';
import { IconArrowRight, IconShieldCheck, IconClock, IconStar, IconSearch, IconSparkles } from '@tabler/icons-react';

export default function HomePage() {
  const services = useAppStore(s => s.services);
  const { categories: allCategories } = useCategories();
  const reviews = useAppStore(s => s.reviews);
  const featuredServices = services.slice(0, 6);
  const categories = allCategories.slice(0, 4);

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      <LandingNavbar />

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[85vh] flex items-center bg-mesh overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-mint/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-brand-coral/15 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-brand-teal/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" style={{ animationDelay: '4s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-brand-teal shadow-sm border border-brand-teal/10 mb-8 animate-fade-up">
              <IconSparkles className="w-4 h-4" />
              <span>La plateforme n°1 des services au Burkina</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-dark leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Vos services au quotidien,{' '}
              <span className="gradient-text">simplifiés.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Trouvez en quelques clics les meilleurs prestataires près de chez vous. Ménage, plomberie, coiffure, et bien plus.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-teal text-white rounded-full text-base font-bold hover:bg-brand-tealDark transition-all shadow-xl shadow-brand-teal/25 hover:shadow-brand-teal/35 hover:-translate-y-0.5"
              >
                <IconSearch className="w-5 h-5" />
                Trouver un service
              </Link>
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-teal rounded-full text-base font-bold hover:bg-brand-tealLight transition-all border border-brand-teal/20 shadow-lg"
              >
                Devenir prestataire
                <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 mt-12 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <IconShieldCheck className="w-5 h-5 text-brand-mint" />
                <span>Prestataires vérifiés</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <IconClock className="w-5 h-5 text-brand-mint" />
                <span>Réservation en 2 min</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <IconStar className="w-5 h-5 text-brand-mint" />
                <span>+500 avis positifs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories Section ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark mb-4">
              Explorez nos <span className="gradient-text">univers</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Des services de qualité pour tous vos besoins du quotidien.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(cat => (
              <Link key={cat.id} href={`/services/category/${cat.id}`} className="group block">
                <div className="relative rounded-2xl overflow-hidden h-56 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                  {cat.image && (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg">{cat.name}</h3>
                    <p className="text-white/70 text-sm mt-1 line-clamp-1">{cat.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services" className="inline-flex items-center gap-2 text-brand-teal font-bold hover:text-brand-tealDark transition-colors group">
              Voir toutes les catégories
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured Services ─── */}
      <section className="py-20 bg-brand-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark mb-4">
              Services <span className="gradient-text">populaires</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Les prestataires les mieux notés de la plateforme.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services" className="inline-flex items-center gap-2 px-8 py-3 bg-brand-teal text-white rounded-full font-bold hover:bg-brand-tealDark transition-all shadow-lg shadow-brand-teal/20 hover:-translate-y-0.5">
              Voir tous les services
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark mb-4">
              Ce que disent <span className="gradient-text">nos clients</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map(review => (
              <div key={review.id} className="bg-brand-surface rounded-2xl p-6 border border-slate-100 shadow-card">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <IconStar key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm italic mb-4">&quot;{review.comment}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center text-xs font-bold">
                    {review.booking?.client?.first_name?.[0] ?? 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{review.booking?.client?.first_name}</p>
                    <p className="text-xs text-slate-400">{review.booking?.service?.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 bg-brand-teal relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-white opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-brand-mint opacity-10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Vous êtes un professionnel ?
          </h2>
          <p className="text-brand-tealLight text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez SimpleÔQuotidien et accédez à des milliers de clients. Inscription gratuite, gestion simplifiée.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-coral hover:bg-brand-coralHover text-white rounded-full text-base font-bold transition-all shadow-xl shadow-brand-coral/30 hover:-translate-y-0.5"
          >
            Rejoindre la plateforme
            <IconArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
