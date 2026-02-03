'use client';

import { useCallback, useRef } from 'react';

export function useElevenTTS() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    const speak = useCallback(async (text: string) => {
        try {
            // Cleanup previous audio if playing
            // if (audioRef.current) {
            //     audioRef.current.pause();
            //     audioRef.current = null;
            // }
            // if (audioUrlRef.current) {
            //     URL.revokeObjectURL(audioUrlRef.current);
            //     audioUrlRef.current = null;
            // }

            // const response = await fetch('/api/elevenlabs', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ text }),
            // });

            // if (!response.ok) {
            //     const error = await response.json();
            //     throw new Error(error.error || 'TTS failed');
            // }

            // const audioBlob = await response.blob();
            // const audioUrl = URL.createObjectURL(audioBlob);
            // audioUrlRef.current = audioUrl;

            // const audio = new Audio(audioUrl);
            // audioRef.current = audio;

            // await audio.play();

            // // Cleanup on end
            // audio.onended = () => {
            //     URL.revokeObjectURL(audioUrl);
            //     audioUrlRef.current = null;
            //     audioRef.current = null;
            // };


            // const utterance = new SpeechSynthesisUtterance(text);
            // utterance.lang = 'en-US'; // or 'hi-IN' for Hindi
            // utterance.rate = 1.0;
            // utterance.pitch = 1.0;
            // window.speechSynthesis.speak(utterance);

        } catch (err) {
            console.error('ElevenLabs TTS error:', err);

            // Fallback to browser TTS
            // const utterance = new SpeechSynthesisUtterance(text);
            // utterance.lang = 'en-US'; // or 'hi-IN' for Hindi
            // utterance.rate = 1.0;
            // utterance.pitch = 1.0;
            // window.speechSynthesis.speak(utterance);
        }
    }, []);

    // Cleanup function for component unmount
    const cleanup = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
    }, []);

    return { speak, cleanup };
}