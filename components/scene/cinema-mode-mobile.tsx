"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Play, Pause, SkipBack, SkipForward, LogOut } from "lucide-react";
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
                            alt="Hero"
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.5, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                        />
                    )}
                </AnimatePresence>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full p-6 pb-12">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">Cinema</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5 active:scale-90 transition-transform"
                    >
                        <X size={14} className="text-white" />
                    </button>
                </div>

                {/* Main Content Area - Lyrics or Visuals */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    {currentSong ? (
                        <div className="space-y-6 max-w-xs">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="w-48 h-48 mx-auto relative rounded-xl overflow-hidden shadow-2xl border border-white/10"
                            >
                                <img
                                    src={Array.isArray(currentSong.image) ? currentSong.image[2]?.link : currentSong.image}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                            </motion.div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2 leading-tight drop-shadow-md">
                                    {decodeHtmlEntities(currentSong.name)}
                                </h2>
                                <p className="text-zinc-300 text-sm font-medium">
                                    {decodeHtmlEntities(currentSong.primaryArtists)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-70">
                            <Music2 size={48} className="mx-auto mb-4 text-white/50" />
                            <p className="text-white text-lg font-light">Listening on</p>
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">TFI Stereo</h1>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
