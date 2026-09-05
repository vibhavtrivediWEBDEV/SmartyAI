'use client';

import { useCallback, useRef } from 'react';

export function useElevenTTS() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    // Browser TTS fallback function - never throws
    const fallbackToBrowserTTS = useCallback((text: string, onEnd?: () => void) => {
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            onEnd?.();
        };

        try {
            console.log('🔊 Using browser TTS fallback');
            
            if (!('speechSynthesis' in window)) {
                console.warn('⚠️ Web Speech API not supported, voice feedback disabled');
                finish();
                return;
            }

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.85; // Slower for clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Wait for voices to load and pick a good one
            const setVoice = () => {
                try {
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
                } catch (voiceErr) {
                    console.warn('⚠️ Could not set voice, using default');
                }
            };
            
            // Load voices if not ready
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = setVoice;
            } else {
                setVoice();
            }
            
            // Handle speech synthesis errors gracefully
            utterance.onerror = (event) => {
                console.warn('⚠️ Speech synthesis error:', event.error);
                finish();
                // Don't throw - just log and continue
            };
            utterance.onend = finish;
            
            window.speechSynthesis.speak(utterance);
            console.log('🔊 Web Speech API: Speaking');
        } catch (fallbackErr) {
            console.warn('⚠️ Browser TTS fallback failed:', fallbackErr);
            finish();
            // Don't throw - user will just not hear audio
        }
    }, []);

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
                let errorMessage = 'TTS failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || `TTS failed (status ${response.status})`;
                } catch (parseError) {
                    errorMessage = `TTS failed: ${response.statusText || response.status}`;
                }
                console.log('ℹ️ ElevenLabs unavailable, using browser TTS');
                // Trigger fallback immediately without throwing
                fallbackToBrowserTTS(text);
                return; // Exit early, don't throw
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
            console.log('ℹ️ TTS error occurred, using browser fallback');
            fallbackToBrowserTTS(text);
        }
    }, [fallbackToBrowserTTS]);

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

    return { speak, speakWithBrowserTTS: fallbackToBrowserTTS, cleanup };
}