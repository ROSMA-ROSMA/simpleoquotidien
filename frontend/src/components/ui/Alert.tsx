import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconCircleCheck, IconAlertTriangle, IconX, IconInfoCircle } from '@tabler/icons-react';

interface AlertProps {
    variant?: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    onClose?: () => void;
    className?: string;
}

export default function Alert({ variant = 'info', title, message, onClose, className }: AlertProps) {
    const config = {
        success: {
            bg: 'bg-brand-tealLight/30 border-brand-mint',
            icon: <IconCircleCheck className="w-5 h-5 text-brand-mint" />,
            titleColor: 'text-brand-tealDark',
        },
        error: {
            bg: 'bg-red-50 border-red-200',
            icon: <IconX className="w-5 h-5 text-red-600" />,
            titleColor: 'text-red-800',
        },
        warning: {
            bg: 'bg-yellow-50 border-yellow-200',
            icon: <IconAlertTriangle className="w-5 h-5 text-yellow-600" />,
            titleColor: 'text-yellow-800',
        },
        info: {
            bg: 'bg-blue-50 border-blue-200',
            icon: <IconInfoCircle className="w-5 h-5 text-blue-600" />,
            titleColor: 'text-blue-800',
        },
    };

    const c = config[variant];

    return (
        <div
            className={cn(
                `${c.bg} border px-5 py-4 rounded-2xl shadow-sm animate-in`,
                className,
            )}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <span className="mt-0.5">{c.icon}</span>
                <div className="flex-1">
                    <strong className={`font-semibold ${c.titleColor}`}>{title}</strong>
                    {message && <p className="text-sm mt-1 opacity-80">{message}</p>}
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <IconX className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
