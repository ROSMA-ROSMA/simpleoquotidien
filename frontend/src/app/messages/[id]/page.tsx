'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { getInitials } from '@/lib/utils';
import { IconArrowLeft, IconSend } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

export default function ConversationPage({ params }: Props) {
    const { id } = use(params);
    const { currentUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const conv = useAppStore(s => s.conversations.find(c => c.id === parseInt(id)));
    const allMessages = useAppStore(s => s.messages);
    const sendMessage = useAppStore(s => s.sendMessage);

    if (!currentUser || !conv) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/messages" className="text-brand-teal font-bold">← Messages</Link></div>;
    }

    const messages = allMessages.filter(
        m => (m.sender_id === currentUser.id && m.receiver_id === conv.participant.id) ||
            (m.sender_id === conv.participant.id && m.receiver_id === currentUser.id)
    );

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(currentUser.id, conv.participant.id, newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar />
            <main className="flex-1 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white rounded-t-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                        <Link href="/messages" className="text-slate-400 hover:text-brand-teal transition-colors">
                            <IconArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="w-10 h-10 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold">
                            {getInitials(conv.participant.first_name, conv.participant.last_name)}
                        </div>
                        <div>
                            <h2 className="font-bold text-brand-dark">{conv.participant.first_name} {conv.participant.last_name}</h2>
                            <span className="text-xs text-slate-400">En ligne</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="bg-slate-50 border-x border-slate-100 p-6 space-y-4 min-h-[400px]">
                        {messages.map(msg => {
                            const isMine = msg.sender_id === currentUser.id;
                            return (
                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${isMine
                                            ? 'bg-brand-teal text-white rounded-br-md'
                                            : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-md'
                                        }`}>
                                        <p>{msg.content}</p>
                                        <span className={`text-xs mt-1 block ${isMine ? 'text-brand-tealLight/70' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="bg-white rounded-b-2xl p-4 border border-t-0 border-slate-100 shadow-sm">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Votre message..."
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all"
                            />
                            <button
                                type="submit"
                                className="px-4 py-3 bg-brand-teal text-white rounded-xl hover:bg-brand-tealDark transition-all shadow-lg shadow-brand-teal/20"
                            >
                                <IconSend className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}
