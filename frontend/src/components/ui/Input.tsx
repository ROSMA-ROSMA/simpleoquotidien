'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className, id, type, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
        const isPasswordType = type === 'password';
        const [showPassword, setShowPassword] = useState(false);

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={isPasswordType && showPassword ? 'text' : type}
                        className={cn(
                            'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400',
                            'focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all duration-200',
                            'hover:border-slate-300',
                            icon ? 'pl-10' : '',
                            isPasswordType ? 'pr-12' : '',
                            error ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : '',
                            className,
                        )}
                        {...props}
                    />
                    {isPasswordType && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <IconEyeOff className="w-5 h-5" />
                            ) : (
                                <IconEye className="w-5 h-5" />
                            )}
                        </button>
                    )}
                </div>
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
