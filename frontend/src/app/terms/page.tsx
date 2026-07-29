import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-card border border-slate-100">
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Conditions Générales d&apos;Utilisation</h1>
                        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
                            <section>
                                <h2 className="text-xl font-bold text-brand-dark">1. Objet</h2>
                                <p className="text-slate-600">Les présentes CGU régissent l&apos;utilisation de la plateforme SimpleÔQuotidien, service de mise en relation entre particuliers et prestataires de services à domicile.</p>
                            </section>
                            <section>
                                <h2 className="text-xl font-bold text-brand-dark">2. Inscription</h2>
                                <p className="text-slate-600">L&apos;inscription est gratuite. Les prestataires doivent fournir des documents d&apos;identité valides et sont soumis à une vérification par notre équipe.</p>
                            </section>
                            <section>
                                <h2 className="text-xl font-bold text-brand-dark">3. Réservations</h2>
                                <p className="text-slate-600">Toute réservation doit être effectuée au minimum 24 heures à l&apos;avance. L&apos;annulation est possible jusqu&apos;à la confirmation par le prestataire.</p>
                            </section>
                            <section>
                                <h2 className="text-xl font-bold text-brand-dark">4. Responsabilité</h2>
                                <p className="text-slate-600">SimpleÔQuotidien agit en tant qu&apos;intermédiaire. Nous ne sommes pas responsables de la qualité des prestations fournies par les prestataires enregistrés.</p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
