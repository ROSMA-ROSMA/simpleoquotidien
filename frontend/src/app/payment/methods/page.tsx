import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import { IconDeviceMobile, IconCash, IconBuildingBank, IconCreditCard, IconCircleCheck } from '@tabler/icons-react';

const methods = [
    { label: 'Mobile Money', detail: 'Orange, Moov, Free', icon: <IconDeviceMobile className="w-5 h-5" />, status: 'Actif' },
    { label: 'Espèces', detail: 'Paiement direct', icon: <IconCash className="w-5 h-5" />, status: 'Actif' },
    { label: 'Virement bancaire', detail: 'BOA, Coris Bank', icon: <IconBuildingBank className="w-5 h-5" />, status: 'Actif' },
    { label: 'Carte bancaire', detail: 'Visa, Mastercard', icon: <IconCreditCard className="w-5 h-5" />, status: 'Bientôt' },
];

export default function PaymentMethodsPage() {
    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Moyens de paiement</h1>
                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 divide-y divide-slate-50">
                        {methods.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-5">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">{m.icon}</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-brand-dark text-sm">{m.label}</h3>
                                    <p className="text-xs text-slate-400">{m.detail}</p>
                                </div>
                                {m.status === 'Actif' ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full"><IconCircleCheck className="w-3.5 h-3.5" /> Actif</span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Bientôt</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
