import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'coral' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
    fullWidth?: boolean;
    icon?: ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    children,
    fullWidth = false,
    icon,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-brand-teal hover:bg-brand-tealDark text-white shadow-lg shadow-brand-teal/20 hover:shadow-brand-teal/30 hover:-translate-y-0.5',
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-brand-teal hover:text-brand-teal',
        coral: 'bg-brand-coral hover:bg-brand-coralHover text-white shadow-lg shadow-brand-coral/20 hover:-translate-y-0.5',
        outline: 'bg-transparent border border-brand-teal text-brand-teal hover:bg-brand-tealLight',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-brand-teal',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-3.5 text-lg',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200',
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                disabled && 'opacity-50 cursor-not-allowed transform-none shadow-none',
                className,
            )}
            disabled={disabled}
            {...props}
        >
            {icon}
            {children}
        </button>
    );
}
