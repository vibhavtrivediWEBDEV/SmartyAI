'use client'

import { useState } from 'react';

export default function Calender() {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="w-full h-screen bg-white relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <p className="text-white">Loading Calendar...</p>
                </div>
            )}
            <iframe
                src="https://chaseottofy.github.io/google-calendar-clone-vanilla/"
                className="w-full h-full border-0"
                title="YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
}
