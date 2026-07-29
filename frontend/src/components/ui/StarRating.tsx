import { IconStar, IconStarFilled } from '@tabler/icons-react';

interface StarRatingProps {
    rating: number;
    maxStars?: number;
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    interactive?: boolean;
    onChange?: (rating: number) => void;
}

export default function StarRating({
    rating,
    maxStars = 5,
    size = 'md',
    showValue = false,
    interactive = false,
    onChange,
}: StarRatingProps) {
    const sizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: maxStars }, (_, i) => {
                const starIndex = i + 1;
                const isFilled = starIndex <= Math.round(rating);

                return interactive ? (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange?.(starIndex)}
                        className="transition-transform hover:scale-110"
                    >
                        {isFilled ? (
                            <IconStarFilled className={`${sizes[size]} text-yellow-400`} />
                        ) : (
                            <IconStar className={`${sizes[size]} text-slate-300`} />
                        )}
                    </button>
                ) : isFilled ? (
                    <IconStarFilled key={i} className={`${sizes[size]} text-yellow-400`} />
                ) : (
                    <IconStar key={i} className={`${sizes[size]} text-slate-300`} />
                );
            })}
            {showValue && (
                <span className="ml-1 text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
            )}
        </div>
    );
}
