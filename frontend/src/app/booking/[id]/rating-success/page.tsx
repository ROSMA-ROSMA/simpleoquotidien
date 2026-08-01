import Link from 'next/link';
import { IconCircleCheck } from '@tabler/icons-react';

export default function RatingSuccessPage() {
    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconCircleCheck className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-extrabold text-brand-dark mb-4">Merci pour votre avis !</h1>
                <p className="text-slate-500 mb-8">Votre évaluation aide la communauté à trouver les meilleurs prestataires.</p>
                <Link
                    href="/dashboard/client"
                    className="inline-flex items-center justify-center px-6 py-3 bg-brand-teal text-white rounded-xl font-bold hover:bg-brand-tealDark transition-all shadow-lg shadow-brand-teal/20"
                >
                    Retour au tableau de bord
                </Link>
            </div>
        </div>
    );
}
