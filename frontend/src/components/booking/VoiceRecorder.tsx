'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconMicrophone, IconPlayerStop, IconTrash, IconAlertTriangle } from '@tabler/icons-react';

interface VoiceRecorderProps {
    /** Appelé avec le blob audio enregistré, ou `null` si l'utilisateur supprime l'enregistrement. */
    onChange: (blob: Blob | null) => void;
}

type Status = 'idle' | 'recording' | 'recorded' | 'unsupported';

const MAX_DURATION_SECONDS = 180;

function pickMimeType(): string | undefined {
    if (typeof MediaRecorder === 'undefined') return undefined;
    const candidates = ['audio/webm', 'audio/mp4', 'audio/ogg'];
    return candidates.find(t => MediaRecorder.isTypeSupported(t));
}

function formatDuration(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VoiceRecorder({ onChange }: VoiceRecorderProps) {
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setStatus('unsupported');
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startRecording = useCallback(async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mimeType = pickMimeType();
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType ?? 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setStatus('recorded');
                onChange(blob);
                stopStream();
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setStatus('recording');
            setSeconds(0);
            timerRef.current = setInterval(() => {
                setSeconds(prev => {
                    const next = prev + 1;
                    if (next >= MAX_DURATION_SECONDS) {
                        recorder.stop();
                    }
                    return next;
                });
            }, 1000);
        } catch {
            setError("Impossible d'accéder au microphone. Vérifiez les autorisations de votre navigateur.");
        }
    }, [onChange, stopStream]);

    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
    }, []);

    const deleteRecording = useCallback(() => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setStatus('idle');
        setSeconds(0);
        onChange(null);
    }, [audioUrl, onChange]);

    if (status === 'unsupported') {
        return null;
    }

    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message vocal (optionnel)</label>
            <p className="text-xs text-slate-400 mb-2">
                Décrivez votre besoin à l&apos;oral pour aider le prestataire à mieux comprendre votre demande.
            </p>

            {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2.5 rounded-xl mb-2 text-xs">
                    <IconAlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                </div>
            )}

            {status === 'idle' && (
                <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-teal hover:bg-brand-tealLight/20 transition-all text-sm text-slate-500 w-full justify-center"
                >
                    <IconMicrophone className="w-5 h-5" /> Enregistrer un message vocal
                </button>
            )}

            {status === 'recording' && (
                <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-brand-coral bg-orange-50 text-sm text-brand-coral font-semibold w-full justify-center animate-pulse"
                >
                    <IconPlayerStop className="w-5 h-5" /> Arrêter l&apos;enregistrement — {formatDuration(seconds)}
                </button>
            )}

            {status === 'recorded' && audioUrl && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                    <audio src={audioUrl} controls className="h-9 flex-1 min-w-0" />
                    <button
                        type="button"
                        onClick={deleteRecording}
                        title="Supprimer l'enregistrement"
                        className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                        <IconTrash className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
