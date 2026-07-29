'use client';

import { useCallback, useRef } from 'react';

export function useElevenTTS() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    const speak = useCallback(async (text: string) => {
        try {
            // Cleanup previous audio if playing
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = null;
            }

            console.log('🔊 ElevenLabs: Converting text to speech...');
            
            const response = await fetch('/api/elevenlabs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'TTS failed');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioUrlRef.current = audioUrl;

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            console.log('🔊 Playing ElevenLabs audio...');
            await audio.play();

            // Cleanup on end
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                audioUrlRef.current = null;
                audioRef.current = null;
                console.log('🔊 Audio playback complete');
            };

        } catch (err) {
            console.error('ElevenLabs TTS error:', err);

            // Fallback to browser TTS with improved settings
            console.log('🔊 Falling back to improved browser TTS');
            
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.85; // Slower for clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Wait for voices to load and pick a good one
            const setVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                // Prefer high-quality English voices
                const preferredVoice = voices.find(v => 
                    v.name.includes('Google US English') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Microsoft David') ||
                    v.name.includes('Microsoft Zira') ||
                    (v.name.includes('Google') && v.lang === 'en-US')
                ) || voices.find(v => v.lang === 'en-US') || voices[0];
                
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                    console.log('🔊 Using voice:', preferredVoice.name);
                }
            };
            
            // Load voices if not ready
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = setVoice;
            } else {
                setVoice();
            }
            
            window.speechSynthesis.speak(utterance);
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