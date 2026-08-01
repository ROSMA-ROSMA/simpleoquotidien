interface FeatureBannerProps {
    title?: string;
    message?: string;
}

/** Bandeau pour fonctionnalités non connectées au backend Django. */
export default function FeatureBanner({
    title = 'Fonctionnalité à venir',
    message = 'Cette section n\'est pas encore disponible via l\'API. Elle sera activée dans une prochaine version.',
}: FeatureBannerProps) {
    return (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm mb-6">
            <p className="font-bold">{title}</p>
            <p className="text-amber-800/90 mt-0.5">{message}</p>
        </div>
    );
}
