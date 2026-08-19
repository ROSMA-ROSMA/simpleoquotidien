import StarRating from '@/components/ui/StarRating';

interface ProviderRatingProps {
    average: number;
    count: number;
    size?: 'sm' | 'md' | 'lg';
    /** Affiche "(N avis)" à côté de la note — désactivable dans les endroits très compacts. */
    showCount?: boolean;
    className?: string;
}

export default function ProviderRating({ average, count, size = 'sm', showCount = true, className }: ProviderRatingProps) {
    if (count === 0) {
        return <span className={`text-xs text-slate-400 italic ${className ?? ''}`}>Pas encore d&apos;avis</span>;
    }

    return (
        <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
            <StarRating rating={average} size={size} />
            <span className="text-sm font-bold text-slate-700">{average.toFixed(1)}</span>
            {showCount && (
                <span className="text-xs text-slate-400">({count} avis)</span>
            )}
        </div>
    );
}
