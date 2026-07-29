import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-card border border-slate-100">
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Politique de Confidentialité</h1>
                        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
                            <section>
                                <h2 className="text-xl font-bold text-brand-dark">1. Collecte des données</h2>
                                <p className="text-slate-600">Nous collectons les informations que vous nous fournissez lors de votre inscription : nom, prénom, email, numéro de téléphone, et pour les prestataires, les documents d&apos;identité et justificatifs professionnels.</p>
                            </section>
                            <section>
                                <h2 className="text-xl font-bold text-brand-dark">2. Utilisation des données</h2>
                                <p className="text-slate-600">Vos données sont utilisées pour gérer votre compte, faciliter les réservations de services, et améliorer notre plateforme. Nous ne vendons jamais vos données à des tiers.</p>
                            </section>
                            <section>
                                <h2 className="text-xl font-bold text-brand-dark">3. Protection des données</h2>
                                <p className="text-slate-600">Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre tout accès non autorisé.</p>
                            </section>
                            <section>
                                <h2 className="text-xl font-bold text-brand-dark">4. Vos droits</h2>
                                <p className="text-slate-600">Vous avez le droit d&apos;accéder, de modifier ou de supprimer vos données personnelles. Contactez-nous à support@simpleoquotidien.com.</p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
