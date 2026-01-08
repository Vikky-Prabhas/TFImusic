"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { JioSaavnSong, getHighQualityUrl } from "@/lib/jiosaavn";
import { useAudio } from "@/hooks/use-audio";
import { AudioPlayer, AudioPlayerRef } from "@/components/ui/audio-player";
import { decodeHtml } from "@/lib/utils";

export interface Mix {
    id: string;
    title: string;
    color: "orange" | "purple" | "white" | "green" | "red";
    songs: JioSaavnSong[];
    currentSongIndex: number;
}

interface PlaybackContextType {
    // State
    mixes: Mix[];
    activeMixId: string | null; // The mix currently "inserted" in the player
    isPlaying: boolean;
    currentSong: JioSaavnSong | undefined;
    volume: number;
    progress: number;
    duration: number;

    // Actions
    setMixes: (mixes: Mix[]) => void;
    loadMix: (mixId: string) => void;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    next: () => void;
    prev: () => void;
    seek: (amount: number) => void; // 0 to 1
    setVolume: (vol: number) => void;

    // Mix Management
    addMix: (mix: Mix) => void;
    updateMix: (mixId: string, updates: Partial<Mix>) => void;
    deleteMix: (mixId: string) => void;
    isLoaded: boolean;
    activeMix: Mix | undefined;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
    // --- State ---
    const [mixes, setMixes] = useState<Mix[]>([]);
    const [activeMixId, setActiveMixId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentSongUrl, setCurrentSongUrl] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Audio Hooks/Refs
    const audioPlayerRef = useRef<AudioPlayerRef>(null);
    const { playClick, playClunk, playEject, playInsert } = useAudio();

    // Derived State
    const activeMix = mixes.find(m => m.id === activeMixId);
    const currentSong = activeMix?.songs[activeMix.currentSongIndex];

    // --- Persistence ---
    useEffect(() => {
        const saved = localStorage.getItem('tfi-mixes');
        if (saved) {
            try {
                setMixes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse mixes", e);
                setDefaults();
            }
        } else {
            setDefaults();
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('tfi-mixes', JSON.stringify(mixes));
        }
    }, [mixes, isLoaded]);

    const setDefaults = () => {
        setMixes([
            { id: "1", title: "Pawan Kalyan Hits", color: "orange", songs: [], currentSongIndex: 0 },
            { id: "2", title: "DSP Specials", color: "purple", songs: [], currentSongIndex: 0 },
        ]);
    };

    // --- Actions ---

    const loadMix = useCallback((mixId: string) => {
        if (activeMixId === mixId) return; // Already loaded
        playInsert();
        setActiveMixId(mixId);
        setIsPlaying(true); // Auto-play on load? Or wait for user? Let's say yes for now or maybe false to mimic inserting tape
        // Actually, physically inserting a tape doesn't auto play usually, but for UX it might be nice.
        // Let's stick to simple: Insert -> Ready. User hits play.
        // But for "Swap" logic in current app, it usually keeps playing if replacing?
        // Let's just set active.
    }, [activeMixId, playInsert]);

    const play = useCallback(() => {
        if (!activeMixId) return;
        playClick();
        setIsPlaying(true);
    }, [activeMixId, playClick]);

    const pause = useCallback(() => {
        playClick();
        setIsPlaying(false);
    }, [playClick]);

    const togglePlay = useCallback(() => {
        if (isPlaying) pause();
        else play();
    }, [isPlaying, pause, play]);

    const loadSongUrl = useCallback(async (song: JioSaavnSong) => {
        try {
            const url = await getHighQualityUrl(song);
            if (url) setCurrentSongUrl(url);
            else console.error("No URL found for song", song.name);
        } catch (err) {
            console.error("Failed to load song URL", err);
        }
    }, []);

    // Effect to load URL when song changes
    useEffect(() => {
        if (currentSong) {
            loadSongUrl(currentSong);
        } else {
            setCurrentSongUrl(null);
        }
    }, [currentSong, loadSongUrl]);

    const next = useCallback(() => {
        if (!activeMix) return;
        playClick();

        let nextIndex = activeMix.currentSongIndex + 1;
        if (nextIndex >= activeMix.songs.length) nextIndex = 0; // Loop or stop? Loop for now.

        updateMix(activeMix.id, { currentSongIndex: nextIndex });
    }, [activeMix]); // removed updateMix from dependency as it's stable usually, activeMix changes

    const prev = useCallback(() => {
        if (!activeMix) return;
        playClick();

        let prevIndex = activeMix.currentSongIndex - 1;
        if (prevIndex < 0) prevIndex = activeMix.songs.length - 1;

        updateMix(activeMix.id, { currentSongIndex: prevIndex });
    }, [activeMix]);

    const seek = useCallback((amount: number) => {
        audioPlayerRef.current?.seekTo(amount);
    }, []);

    // --- Helpers ---

    const addMix = (mix: Mix) => setMixes(prev => [...prev, mix]);

    const updateMix = (mixId: string, updates: Partial<Mix>) => {
        setMixes(prev => prev.map(m => m.id === mixId ? { ...m, ...updates } : m));
    };

    const deleteMix = (mixId: string) => {
        setMixes(prev => prev.filter(m => m.id !== mixId));
        if (activeMixId === mixId) {
            setActiveMixId(null);
            setIsPlaying(false);
            playEject();
        }
    };

    return (
        <PlaybackContext.Provider value={{
            mixes, activeMixId, isPlaying, currentSong, volume, progress, duration,
            setMixes, loadMix, play, pause, togglePlay, next, prev, seek, setVolume,
            addMix, updateMix, deleteMix, isLoaded, activeMix
        }}>
            {children}

            {/* Global Audio Element */}
            <AudioPlayer
                ref={audioPlayerRef}
                url={currentSongUrl}
                playing={isPlaying}
                volume={volume}
                onEnded={next}
                onProgress={({ played }) => setProgress(played)}
                onProgress={({ played }) => setProgress(played)}
                onDuration={setDuration}
                title={decodeHtml(currentSong?.name || "")}
                artist={decodeHtml(currentSong?.primaryArtists || "")}
                album={decodeHtml(currentSong?.album?.name || "")}
                artwork={currentSong?.image?.[0]?.link}
            />
        </PlaybackContext.Provider>
    );
}

export function usePlayback() {
    const context = useContext(PlaybackContext);
    if (context === undefined) {
        throw new Error("usePlayback must be used within a PlaybackProvider");
    }
    return context;
}
