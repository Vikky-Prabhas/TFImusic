"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ClickWheel } from "./ClickWheel";
import { IpodScreen } from "./IpodScreen";
import { useState, useEffect, useRef, useMemo } from "react";
import { usePlayback, Mix } from "@/components/providers/playback-context";
import { JioSaavnSong, searchSongs } from "@/lib/jiosaavn";
import { decodeHtml } from "@/lib/utils";

interface MenuItem {
    label: string;
    type: 'navigation' | 'action' | 'toggle';
    target?: string; // For navigation
    action?: () => void;
    data?: any; // For dynamic items
}

interface ViewState {
    id: string; // Unique ID for the view context (e.g., 'main', 'playlists', 'mix-123')
    title: string;
    viewType: 'menu' | 'player' | 'search' | 'loading' | 'message' | 'cinema';
    data?: any; // Context data (e.g., mixId)
    selectedIndex: number;
    staticItems?: MenuItem[]; // For purely static menus
    searchQuery?: string;
}

const MAIN_MENU: MenuItem[] = [
    { label: "Music", type: 'navigation', target: 'music' },
    { label: "Playlists", type: 'navigation', target: 'playlists' },
    { label: "Cinema Mode", type: 'action', action: () => { } }, // Triggers Cinema
    { label: "Search", type: 'navigation', target: 'search' }, // Changed to navigation target
    { label: "Now Playing", type: 'action', action: () => { } }, // Handled dynamically
    { label: "Settings", type: 'navigation', target: 'settings' }
];

const MUSIC_MENU: MenuItem[] = [
    { label: "Search", type: 'navigation', target: 'search' },
    { label: "Cover Flow", type: 'action', action: () => console.log("Cover Flow") },
    { label: "artists", type: 'navigation', target: 'artists' },
    { label: "albums", type: 'navigation', target: 'albums' },
    { label: "songs", type: 'navigation', target: 'songs' },
];

const SETTINGS_MENU: MenuItem[] = [
    { label: "About", type: 'action', action: () => alert("TFI Studio iPod v1.0") },
    { label: "Reset", type: 'action', action: () => window.location.reload() },
];

export function IPod() {
    const {
        play, pause, togglePlay, next, prev,
        volume, setVolume,
        currentSong, isPlaying, progress, duration,
        activeMixId, loadMix, updateMix, activeMix,
        mixes, addMix, deleteMix
    } = usePlayback();

    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    // const [isCinemaMode, setIsCinemaMode] = useState(false); // Refactored to ViewStack
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial State
    const [viewStack, setViewStack] = useState<ViewState[]>([
        { id: 'main', title: "iPod", viewType: 'menu', selectedIndex: 0, staticItems: MAIN_MENU }
    ]);

    // Derived state for current view
    const currentView = viewStack[viewStack.length - 1];

    // Compute Menu Items Dynamically based on Current View ID & Context
    // Removed useMemo to ensure closures (like playSongNow) are always fresh. 
    // This prevents stale state issues where actions use old versions of 'mixes'.
    const currentMenuItems = (() => {
        if (currentView.staticItems) return currentView.staticItems;

        switch (currentView.id) {
            case 'music': return MUSIC_MENU;
            case 'settings': return SETTINGS_MENU;

            case 'playlists':
                // Dynamic Playlists List
                // Filter out "On-the-Go" from the visible list
                const visibleMixes = mixes.filter(m => m.title !== "On-the-Go");

                const playlistItems: MenuItem[] = visibleMixes.map(mix => ({
                    label: mix.title,
                    type: 'navigation',
                    target: `mix-${mix.id}`,
                    data: mix.id
                }));
                playlistItems.unshift({
                    label: "[Create New Playlist]",
                    type: 'action',
                    action: () => createNewPlaylist()
                });
                return playlistItems;

            case 'search':
                return currentView.staticItems || [];



            case 'rename':
                // Rename View: Just shows instruction or current name?
                // We rely on title being "Rename Playlist" and input being active.
                // Items can be "Cancel".
                return [{ label: "Cancel", type: 'action', action: () => handleBack() }];

            default:
                // Handle dynamic IDs
                if (currentView.id.startsWith('mix-')) {
                    const mixId = typeof currentView.data === 'object' ? currentView.data.id : currentView.data;
                    // Optimistic fallback: Use data if mix not yet in context (race condition fix)
                    const mix = mixes.find(m => m.id === mixId) || (typeof currentView.data === 'object' ? currentView.data : null);

                    if (!mix) return [{ label: "(Playlist Deleted)", type: 'action', action: () => handleBack() }];

                    const songItems: MenuItem[] = mix.songs.map((s: JioSaavnSong, idx: number) => ({
                        label: decodeHtml(s.name),
                        type: 'action',
                        data: s,
                        action: () => playMixSong(mix.id, idx)
                    }));

                    // Add Management Options
                    songItems.push({
                        label: "[Rename Playlist]",
                        type: 'action',
                        action: () => goToRename(mix)
                    });

                    songItems.push({
                        label: "[Delete Playlist]",
                        type: 'action',
                        action: () => handleDeletePlaylist(mix.id)
                    });
                    return songItems;
                }

                // Song Options
                if (currentView.id.startsWith('song-')) {
                    const song = currentView.data as JioSaavnSong;
                    return [
                        { label: "Play Now", type: 'action', action: () => playSongNow(song) },
                        { label: "Add to Playlist...", type: 'navigation', target: `add-to-${song.id}`, data: song },
                        { label: "Cancel", type: 'action', action: () => handleBack() }
                    ];
                }

                // Add to Playlist Menu
                if (currentView.id.startsWith('add-to-')) {
                    const song = currentView.data as JioSaavnSong;
                    return mixes.map(mix => ({
                        label: mix.title,
                        type: 'action',
                        action: () => {
                            // Prevent Duplicates
                            if (mix.songs.some(s => s.id === song.id)) {
                                // Maybe show a temporary "Already Added" view or just go back?
                                // For now, just go back to indicate "Done" (conceptually no-op but safe).
                                // Or ideally, filter these mixes out of the list? 
                                // But hiding them might confuse.
                                // Let's just return.
                                handleBack();
                                handleBack();
                                return;
                            }

                            const newSongs = [...mix.songs, song];
                            updateMix(mix.id, { songs: newSongs });
                            // Go back twice
                            handleBack();
                            handleBack();
                        }
                    }));
                }

                return [];
        }
    })(); // Execute immediately

    // Actions
    const createNewPlaylist = () => {
        const newId = Date.now().toString();
        const newMix: Mix = {
            id: newId,
            title: `Mix ${mixes.length + 1}`,
            color: "purple",
            songs: [],
            currentSongIndex: 0
        };
        addMix(newMix);
        // Navigate immediately - PASS FULL MIX OBJECT to avoid race condition
        handleNavigation(`mix-${newId}`, newMix, newMix.title);
        // Immediately trigger Rename
        setTimeout(() => goToRename(newMix), 100);
    };

    const goToRename = (mix: Mix) => {
        setSearchQuery(mix.title); // Pre-fill with current name
        setViewStack(prev => [...prev, {
            id: 'rename',
            title: 'Rename Playlist',
            viewType: 'search', // Reuse search layout for input
            selectedIndex: 0,
            data: mix.id,
            staticItems: [{ label: "Press Enter to Save", type: 'action', action: () => { } }]
        }]);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleRenameSubmit = (newName: string) => {
        const mixId = currentView.data;
        if (mixId && newName.trim()) {
            updateMix(mixId, { title: newName.trim() });
            handleBack(); // Exit rename view
        }
    };

    const handleDeletePlaylist = (id: string) => {
        deleteMix(id);
        handleBack(); // Pop the mix view. The 'playlists' view under it will re-render with the mix gone.
    };

    const playMixSong = (mixId: string, idx: number) => {
        loadMix(mixId);
        updateMix(mixId, { currentSongIndex: idx });
        // Ensure play
        if (!isPlaying) play();
        goToNowPlaying();
    };


    // --- Actions Actions ---

    // Updated Navigation Handler
    const handleNavigation = (target: string, data?: any, titleOverride?: string) => {
        let newView: ViewState = {
            id: target,
            title: titleOverride || target.charAt(0).toUpperCase() + target.slice(1),
            selectedIndex: 0,
            viewType: 'menu',
            data: data
        };

        if (target === 'search') {
            newView.viewType = 'search';
            newView.title = 'Search';
            newView.searchQuery = "";
            newView.staticItems = []; // Results go here
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }

        setViewStack(prev => [...prev, newView]);
    };

    const goToNowPlaying = () => {
        setViewStack(prev => [...prev, { id: 'now-playing', title: 'Now Playing', viewType: 'player', selectedIndex: 0 }]);
    };

    const handleSearch = async (query: string) => {
        // Reuse for Rename Logic
        if (currentView.id === 'rename') {
            handleRenameSubmit(query);
            return;
        }

        if (!query.trim()) return;
        setIsLoading(true);
        try {
            const results = await searchSongs(query);
            const songItems: MenuItem[] = results.map((song: JioSaavnSong) => ({
                label: decodeHtml(song.name),
                type: 'navigation',
                target: `song-${song.id}`,
                data: song
            }));

            setViewStack(prev => {
                const newStack = [...prev];
                const active = newStack[newStack.length - 1];
                if (active.viewType === 'search') {
                    newStack[newStack.length - 1] = { ...active, staticItems: songItems, searchQuery: query };
                }
                return newStack;
            });
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setIsLoading(false);
            inputRef.current?.blur();
        }
    };

    const playSongNow = (song: JioSaavnSong) => {
        // If we have an active mix, checks if it's the "On-the-Go" one or another
        // Actually, for "Play Now" behavior from search, users typically expect it to JUST play that song,
        // effectively replacing the queue or starting a new one.
        // But to keep it iPod-like, we use "On-the-Go".

        // 1. Check if "On-the-Go" exists (Case insensitive check for robustness)
        const otgMix = mixes.find(m => m.title.trim().toLowerCase() === "on-the-go");

        if (otgMix) {
            // Reuse existing OTG
            // Check for duplicate
            const existingIndex = otgMix.songs.findIndex(s => s.id === song.id);

            if (existingIndex !== -1) {
                // Song Exists -> Just Play It
                updateMix(otgMix.id, { currentSongIndex: existingIndex });
            } else {
                // Append
                const newSongs = [...otgMix.songs, song];
                updateMix(otgMix.id, { songs: newSongs, currentSongIndex: newSongs.length - 1 });
            }

            loadMix(otgMix.id); // Switch context to OTG
            if (!isPlaying) play();
        } else {
            // Create new OTG
            const newMixId = Date.now().toString();
            const newMix: Mix = {
                id: newMixId,
                title: "On-the-Go",
                color: "orange",
                songs: [song],
                currentSongIndex: 0
            };
            addMix(newMix);
            loadMix(newMixId);
            if (!isPlaying) play(); // Ensure play for new mix
        }
        goToNowPlaying();
    };

    const handleScroll = (direction: 1 | -1) => {
        if (currentView.viewType === 'player') {
            const newVol = Math.max(0, Math.min(1, volume + (direction * 0.05)));
            setVolume(newVol);
        } else {
            // Use Computed Items for scrolling
            const items = currentMenuItems;
            const maxIndex = Math.max(0, items.length - 1);
            if (maxIndex === 0 && items.length === 0) return;

            let newIndex = currentView.selectedIndex + direction;
            if (newIndex < 0) newIndex = maxIndex;
            if (newIndex > maxIndex) newIndex = 0;

            setViewStack(prev => {
                const newStack = [...prev];
                newStack[newStack.length - 1] = { ...newStack[newStack.length - 1], selectedIndex: newIndex };
                return newStack;
            });
        }
    };

    const handleSelect = () => {
        // Special case: Cinema Mode trigger from Main Menu
        if (currentView.id === 'main' && currentView.selectedIndex === 2) { // Index 2 is "Cinema Mode" in MAIN_MENU
            // Refactored to ViewStack, no-op here as it's handled in onItemSelect
            return;
        }
        if (currentView.id === 'main' && currentView.selectedIndex === 4) { // Index 4 is "Now Playing"
            goToNowPlaying();
            return;
        }

        const selectedItem = currentMenuItems[currentView.selectedIndex];

        if (!selectedItem && currentView.viewType !== 'player') return;

        if (currentView.viewType === 'search') {
            if (selectedItem?.type === 'navigation' && selectedItem.target) {
                handleNavigation(selectedItem.target, selectedItem.data, selectedItem.label);
            }
        } else if (selectedItem) {
            if (selectedItem.action) selectedItem.action();
            else if (selectedItem.type === 'navigation' && selectedItem.target) {
                handleNavigation(selectedItem.target, selectedItem.data, selectedItem.label); // Pass data/title
            }
        }
    };

    const handleBack = () => {
        if (viewStack.length > 1) {
            setViewStack(prev => prev.slice(0, prev.length - 1));
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-zinc-900 p-4 overflow-hidden pointer-events-none">
            {/* Hidden Input for Search - positioned off screen or hidden but focusable */}
            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute top-0 left-0 h-0 w-0 pointer-events-auto"
                value={searchQuery}
                onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    // Debounce or just search on change? Let's search on every 3rd char or enter
                    // For now, let's just update local state and maybe auto-search if user pauses?
                    // Or simpple: Search on Enter. But mobile keyboards have "Go".
                }
                }
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSearch(searchQuery);
                        inputRef.current?.blur(); // Hide keyboard to see results
                    }
                }}
            />

            {/* iPod Case - Classic Silver Edition */}
            <motion.div
                className="relative w-full max-w-[450px] aspect-[1/1.65] bg-gradient-to-br from-[#fcfcfc] via-[#f2f2f2] to-[#d9d9d9] rounded-[3.5rem] shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-4px_6px_rgba(0,0,0,0.1),0_30px_60px_rgba(0,0,0,0.4)] flex flex-col items-center p-6 border-[6px] border-[#d4d4d4] pointer-events-auto ring-1 ring-black/5"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                {/* Brushed Metal Texture Overlay */}
                <div className="absolute inset-0 rounded-[2.6rem] opacity-40 pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Metallic Sheen */}
                <div className="absolute inset-0 rounded-[2.6rem] bg-gradient-to-tr from-white/60 via-transparent to-transparent pointer-events-none" />

                {/* Screen Area (Top 42%) */}
                <div
                    className="w-full h-[42%] bg-black rounded-lg border-[3px] border-[#333] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] mb-8 overflow-hidden relative z-10 ring-2 ring-black/20"
                    onClick={() => {
                        // If in search mode, tapping screen focuses input
                        if (currentView.viewType === 'search') inputRef.current?.focus();
                    }}
                >
                    <IpodScreen
                        variant={currentView.viewType || 'menu'}
                        title={currentView.title}
                        menuItems={currentMenuItems.map(i => i.label)}
                        // Pass image data to screen for list rendering
                        itemsData={currentMenuItems}
                        selectedIndex={currentView.selectedIndex}
                        currentSong={currentSong}
                        isPlaying={isPlaying}
                        progress={progress}
                        duration={duration}
                        isLoading={isLoading}
                        searchQuery={currentView.viewType === 'search' ? searchQuery : undefined}
                        onItemSelect={(index) => {
                            // Update selection first
                            setViewStack(prev => {
                                const newStack = [...prev];
                                newStack[newStack.length - 1] = {
                                    ...newStack[newStack.length - 1],
                                    selectedIndex: index
                                };
                                return newStack;
                            });
                            // Then execute immediate selection after a microtask to allow state update
                            setTimeout(() => {
                                const item = currentMenuItems[index];
                                if (item) {
                                    if (item.action) item.action();
                                    else if (item.type === 'navigation' && item.target) handleNavigation(item.target, item.data, item.label);

                                    // Specific check for Cinema Mode (Index 2 in MAIN)
                                    if (currentView.id === 'main' && index === 2) {
                                        // Push "Cinema" view to stack
                                        setViewStack(prev => [...prev, { id: 'cinema', title: 'Cinema Mode', viewType: 'cinema', selectedIndex: 0 }]);
                                    }
                                    if (currentView.id === 'main' && index === 4) goToNowPlaying();
                                }
                            }, 0);
                        }}
                        onPlayPause={togglePlay}
                        onBack={handleBack}
                    />
                    {/* Glass Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12 pointer-events-none" />
                </div>

                {/* Click Wheel Area (Bottom) */}
                <div className="flex-1 w-full flex items-start justify-center relative z-10">
                    <ClickWheel
                        onScroll={handleScroll}
                        onSelect={handleSelect}
                        onMenu={handleBack}
                        onPlayPause={togglePlay}
                        onNext={next}
                        onPrev={prev}
                    />
                </div>
            </motion.div>
        </div >
    );
}
