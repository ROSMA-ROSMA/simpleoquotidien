import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-brand-dark text-gray-400 mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-6 h-6" />
                            </div>
                            <span className="text-lg font-extrabold text-white">
                                Simple<span className="text-brand-coral">Ô</span>Quotidien
                            </span>
                        </Link>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            La plateforme qui connecte les particuliers aux meilleurs prestataires de services à domicile.
                        </p>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Services</h3>
                        <ul className="space-y-3">
                            <li><Link href="/services" className="text-sm hover:text-brand-mint transition-colors">Tous les services</Link></li>
                            <li><Link href="/services" className="text-sm hover:text-brand-mint transition-colors">Ménage</Link></li>
                            <li><Link href="/services" className="text-sm hover:text-brand-mint transition-colors">Plomberie</Link></li>
                            <li><Link href="/services" className="text-sm hover:text-brand-mint transition-colors">Beauté</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Support</h3>
                        <ul className="space-y-3">
                            <li><Link href="/privacy" className="text-sm hover:text-brand-mint transition-colors">Confidentialité</Link></li>
                            <li><Link href="/terms" className="text-sm hover:text-brand-mint transition-colors">CGU</Link></li>
                            <li><a href="mailto:support@simpleoquotidien.com" className="text-sm hover:text-brand-mint transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Devenir Prestataire */}
                    <div>
                        <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Prestataires</h3>
                        <p className="text-sm text-gray-500 mb-4">Rejoignez notre réseau et développez votre activité.</p>
                        <Link
                            href="/register"
                            className="inline-block px-5 py-2.5 bg-brand-coral hover:bg-brand-coralHover text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-brand-coral/20"
                        >
                            Devenir prestataire
                        </Link>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        &copy; {currentYear} SimpleÔQuotidien. Tous droits réservés.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-600">
                            Une solution de DigiScia
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
