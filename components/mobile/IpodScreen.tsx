import { motion } from "framer-motion";
import { ChevronRight, Battery, Play, Pause } from "lucide-react";
import { JioSaavnSong } from "@/lib/jiosaavn";
import { decodeHtml } from "@/lib/utils";
import { CinemaModeMobile as CinemaMode } from "@/components/scene/cinema-mode-mobile";

interface IpodScreenProps {
    variant?: 'menu' | 'player' | 'search' | 'loading' | 'message' | 'cinema';
    title: string;
    menuItems: string[]; // List of labels to display
    itemsData?: any[]; // Optional rich data for items (images etc)
    selectedIndex: number;
    currentSong?: JioSaavnSong;
    isPlaying?: boolean;
    progress?: number; // 0-1
    duration?: number; // seconds
    isLoading?: boolean;
    message?: string;
    searchQuery?: string;
    onItemSelect?: (index: number) => void;
    onPlayPause?: () => void;
    onBack?: () => void;
}

export function IpodScreen({
    variant = 'menu',
    title,
    menuItems,
    itemsData = [],
    selectedIndex,
    currentSong,
    isPlaying = false,
    progress = 0,
    duration = 0,
    isLoading = false,
    message = "",
    searchQuery = "",
    onItemSelect,
    onPlayPause,
    onBack
}: IpodScreenProps) {

    // Format helper
    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    // Helper to get image from item data if available
    const getItemImage = (index: number) => {
        const item = itemsData[index];
        // If item is a song (from search results context usually)
        if (item?.data?.image) {
            const img = item.data.image;
            return Array.isArray(img) ? img[0]?.link : img; // Low res for list
        }
        return null;
    };

    return (
        <div className="w-full h-full bg-black flex flex-col font-sans text-xs overflow-hidden text-white">
            {/* Top Bar - Dark Glass */}
            <div className="h-6 bg-gradient-to-b from-zinc-800 to-zinc-900 border-b border-zinc-700 flex items-center justify-between px-2 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-1.5" onClick={onBack}> {/* Touch Back */}
                    <ChevronRight size={12} className="rotate-180 text-zinc-400" /> {/* Explicit Back Icon */}
                    {variant === 'player' && (
                        <div onClick={(e) => { e.stopPropagation(); onPlayPause?.(); }}> {/* Touch Play/Pause */}
                            {isPlaying ? <Play size={10} className="fill-blue-400 text-blue-400" /> : <Pause size={10} className="fill-zinc-400 text-zinc-400" />}
                        </div>
                    )}
                    <span className="font-semibold text-zinc-100 text-[11px] ml-0.5 tracking-tight drop-shadow-md">{title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Status Icons */}
                    <div className="flex gap-0.5 items-end h-2">
                        <div className="w-0.5 h-1 bg-zinc-400 rounded-[0.5px]"></div>
                        <div className="w-0.5 h-1.5 bg-zinc-400 rounded-[0.5px]"></div>
                        <div className="w-0.5 h-2 bg-zinc-400 rounded-[0.5px]"></div>
                        <div className="w-0.5 h-2.5 bg-zinc-600 rounded-[0.5px]"></div>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400">5G</span>
                    <Battery size={14} className="text-zinc-300 fill-zinc-300 ml-0.5" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-black">
                {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-800 border-t-blue-500"></div>
                        <span className="text-[10px] text-zinc-500 font-medium animate-pulse">Loading...</span>
                    </div>
                ) : variant === 'message' ? (
                    <div className="w-full h-full flex items-center justify-center p-6 text-center">
                        <p className="text-sm font-medium text-zinc-400 leading-relaxed">{message}</p>
                    </div>
                ) : variant === 'search' ? (
                    <div className="flex flex-col h-full bg-black">
                        {/* Search Bar */}
                        <div className="h-9 bg-zinc-900 border-b border-zinc-800 flex items-center px-2 shrink-0 shadow-inner">
                            <div className="w-full h-6 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center px-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                                <span className="text-zinc-500 mr-2 opacity-70">🔍</span>
                                <span className={`text-white bg-transparent w-full focus:outline-none text-[11px] font-medium truncate ${searchQuery ? '' : 'text-zinc-600'}`}>
                                    {searchQuery || "Search Music..."}
                                </span>
                            </div>
                        </div>
                        {/* Results List */}
                        <div className="flex-1 overflow-y-auto pb-1">
                            {menuItems.length === 0 ? (
                                <div className="p-8 text-center text-zinc-600 text-[10px] uppercase tracking-wider font-semibold">No Results Found</div>
                            ) : (
                                menuItems.map((item, index) => {
                                    const isSelected = index === selectedIndex;
                                    const img = getItemImage(index);

                                    return (
                                        <div
                                            key={`${item || 'item'}-${index}`}
                                            onClick={() => onItemSelect?.(index)}
                                            className={`h-14 flex items-center justify-between px-3 font-medium border-b border-zinc-900 transition-colors cursor-pointer active:brightness-110 ${isSelected
                                                ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-inner"
                                                : "bg-black text-zinc-300"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                {/* Thumbnail */}
                                                <div className={`w-10 h-10 rounded-md shrink-0 bg-zinc-800 overflow-hidden shadow-sm border border-white/10 ${isSelected ? 'border-white/30' : ''}`}>
                                                    {img ? (
                                                        <img src={img} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-600">♪</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className={`truncate text-[11px] ${isSelected ? 'font-semibold text-white' : 'text-zinc-200'}`}>{item}</span>
                                                    {/* Subtitle / Artist */}
                                                    {isSelected && (
                                                        <div className="flex flex-col">
                                                            {itemsData[index]?.data?.primaryArtists && (
                                                                <span className={`truncate text-[9px] ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                                    {itemsData[index].data.primaryArtists}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={12} className={`shrink-0 ml-2 ${isSelected ? "text-blue-200" : "text-zinc-700"}`} />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : variant === 'menu' ? (
                    // --- MENU VIEW (Split) ---
                    <div className="flex h-full bg-black">
                        {/* Left: Menu List */}
                        <div className="w-1/2 flex flex-col bg-black border-r border-zinc-800">
                            {/* Header Row if needed, skipping for cleaner look */}
                            {menuItems.map((item, index) => {
                                const isSelected = index === selectedIndex;
                                return (
                                    <div
                                        key={item + index}
                                        onClick={() => onItemSelect?.(index)}
                                        className={`h-7 flex items-center justify-between px-2 font-medium text-[11px] cursor-pointer active:brightness-110 ${isSelected
                                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                                            : "bg-black text-zinc-300 border-b border-zinc-900"
                                            }`}
                                    >
                                        <span className="truncate">{item}</span>
                                        <ChevronRight size={10} className={isSelected ? "text-white" : "text-zinc-800"} />
                                    </div>
                                );
                            })}
                        </div>
                        {/* Right: Preview / Album Art Placeholder */}
                        <div className="w-1/2 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center p-3 relative z-10 overflow-hidden">
                            {/* If we had "focused item" metadata, we could show it here. For now static or current song art */}
                            {/* Reflection Effect */}
                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                            {currentSong?.image ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={currentSong.id} // Animate on change
                                    className="relative w-full aspect-square shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                                >
                                    <img
                                        src={Array.isArray(currentSong.image) ? currentSong.image[0]?.link : currentSong.image as string}
                                        alt="Art"
                                        className="w-full h-full object-cover rounded-md border border-white/10"
                                    />
                                    {/* Glass sheen on art */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-md pointer-events-none" />
                                </motion.div>
                            ) : (
                                <div className="w-3/4 aspect-square bg-zinc-800 rounded-lg shadow-inner flex items-center justify-center text-zinc-600 border border-zinc-700">
                                    <span className="text-2xl">♪</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : variant === 'cinema' ? (
                    <div className="w-full h-full relative z-[20]">
                        <CinemaMode
                            isOpen={true}
                            onClose={onBack || (() => { })}
                            currentSong={currentSong || null}
                        />
                    </div>
                ) : (
                    // --- PLAYER VIEW ---
                    <div className="h-full w-full relative flex flex-col">
                        {/* Full Background Blur */}
                        {currentSong?.image && (
                            <div className="absolute inset-0 z-0 overflow-hidden opacity-40">
                                <img
                                    src={Array.isArray(currentSong.image) ? currentSong.image[2]?.link : currentSong.image as string}
                                    alt="BG"
                                    className="w-full h-full object-cover blur-xl scale-125"
                                />
                                <div className="absolute inset-0 bg-black/50" />
                            </div>
                        )}

                        <div className="flex-1 flex flex-row p-3 gap-3 items-center z-10">
                            {/* Left: Large Art */}
                            <motion.div
                                className="w-[48%] aspect-square bg-zinc-900 shadow-2xl relative shrink-0 rounded-md overflow-hidden border border-white/10"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                {currentSong?.image ? (
                                    <img
                                        src={Array.isArray(currentSong.image) ? currentSong.image[0]?.link : currentSong.image as string} // Force Index 0 (Highest Quality)
                                        alt="Art"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white bg-zinc-800">♪</div>
                                )}
                                {/* Gloss */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                            </motion.div>

                            {/* Right: Metadata & Info */}
                            <div className="flex-1 flex flex-col justify-center text-left overflow-hidden min-w-0">
                                <h2 className="text-white font-bold text-xs truncate leading-snug mb-0.5 drop-shadow-md">{decodeHtml(currentSong?.name || "No Music")}</h2>
                                <p className="text-zinc-300 text-[10px] truncate mb-0.5">{decodeHtml(currentSong?.primaryArtists || "Unknown Artist")}</p>
                                <p className="text-zinc-500 text-[9px] truncate mb-2">{decodeHtml(currentSong?.album?.name || "TFI Studio")}</p>

                                {/* Progress Bar */}
                                <div className="w-full mt-1">
                                    <div className="flex justify-between text-[8px] text-zinc-400 font-mono mb-1 tracking-tight">
                                        <span>{formatTime(progress * duration)}</span>
                                        <span>-{formatTime(duration - (progress * duration))}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-800/80 rounded-full border border-zinc-700 overflow-hidden relative backdrop-blur-sm">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"
                                            style={{ width: `${progress * 100}%` }}
                                        >
                                            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_5px_white]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
