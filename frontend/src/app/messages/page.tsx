'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { getInitials } from '@/lib/utils';
import { IconMessage } from '@tabler/icons-react';

export default function MessagesPage() {
    const { currentUser } = useAuth();
    const conversations = useAppStore(s => s.conversations);

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link></div>;
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="messages" />
            <main className="flex-1 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6 flex items-center gap-2">
                        <IconMessage className="w-6 h-6 text-brand-mint" /> Messagerie
                    </h1>

                    {conversations.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-card border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                            {conversations.map(conv => (
                                <Link
                                    key={conv.id}
                                    href={`/messages/${conv.id}`}
                                    className="flex items-center gap-4 p-5 hover:bg-slate-50/80 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold ring-2 ring-white">
                                        {getInitials(conv.participant.first_name, conv.participant.last_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-bold text-brand-dark group-hover:text-brand-teal transition-colors">
                                                {conv.participant.first_name} {conv.participant.last_name}
                                            </h3>
                                            <span className="text-xs text-slate-400">
                                                {new Date(conv.lastMessage.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 truncate">{conv.lastMessage.content}</p>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <span className="w-5 h-5 bg-brand-coral text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-10 shadow-card border border-slate-100 text-center">
                            <p className="text-4xl mb-3">💬</p>
                            <h3 className="font-bold text-brand-dark mb-1">Aucune conversation</h3>
                            <p className="text-sm text-slate-500">Vos échanges avec les prestataires apparaîtront ici.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
