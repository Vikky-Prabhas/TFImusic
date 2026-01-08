"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Play, Pause, SkipBack, SkipForward, LogOut } from "lucide-react";
// ...


import { JioSaavnSong, getLyricsWithFallback } from "@/lib/jiosaavn";

interface CinemaModeMobileProps {
    isOpen: boolean;
    onClose: () => void;
    currentSong: JioSaavnSong | null;
}

const HERO_IMAGES = [
    "/hero-images/hero1.png",
    "/hero-images/hero2.jpg",
    "/hero-images/hero3.jpg",
    "/hero-images/hero4.jpg",
    "/hero-images/hero5.jpg",
];

export function CinemaModeMobile({
    isOpen,
    onClose,
    currentSong
}: CinemaModeMobileProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Slideshow effect
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    const decodeHtmlEntities = (text: string) => {
        return text
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    };


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black flex flex-col overflow-hidden"
        >
            {/* Background Slideshow or Song Art */}
            <div className="absolute inset-0 overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {currentSong?.image?.[2]?.link ? (
                        <motion.img
                            key={currentSong.id}
                            src={currentSong.image[2].link} // High Quality Art
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-60"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                        />
                    ) : (
                        <motion.img
                            key={currentImageIndex}
                            src={HERO_IMAGES[currentImageIndex]}
                            alt="Hero Background"
                            className="absolute inset-0 w-full h-full object-cover"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.4, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col p-12">
                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-end pb-12">
                    {currentSong && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            key={currentSong.id}
                            className="max-w-4xl"
                        >
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                                {decodeHtmlEntities(currentSong.name)}
                            </h1>
                            <p className="text-base md:text-lg text-gray-300 font-light">
                                {decodeHtmlEntities(currentSong.primaryArtists)}
                            </p>
                        </motion.div>
                    )}



                    {/* NO CONTROLS OR CLOSE BUTTON FOR MOBILE - Uses Physical Button */}
                </div>
            </div>
        </motion.div>
    );
}
