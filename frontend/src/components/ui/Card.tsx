import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ children, className, hover = false, padding = 'lg' }: CardProps) {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={cn(
                'bg-white rounded-2xl shadow-card border border-slate-100',
                paddings[padding],
                hover && 'hover:shadow-card-hover transition-all duration-300',
                className,
            )}
        >
            {children}
        </div>
    );
}
