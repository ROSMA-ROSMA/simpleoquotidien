'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@tabler/icons-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-card border border-slate-100 max-h-[90vh] overflow-y-auto">
                {title && (
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-brand-dark text-lg">{title}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Fermer"
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <IconX className="w-5 h-5" />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>,
        document.body,
    );
}
