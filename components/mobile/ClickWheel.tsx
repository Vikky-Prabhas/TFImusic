"use client";

import { motion } from "framer-motion";
import { Play, Pause, FastForward, Rewind } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface ClickWheelProps {
    onScroll: (direction: 1 | -1) => void;
    onSelect: () => void;
    onMenu: () => void;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export function ClickWheel({ onScroll, onSelect, onMenu, onPlayPause, onNext, onPrev }: ClickWheelProps) {
    const wheelRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const lastAngle = useRef<number | null>(null);
    const accumulatedDelta = useRef(0);

    const getAngle = (clientX: number, clientY: number) => {
        if (!wheelRef.current) return 0;
        const rect = wheelRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = clientX - centerX;
        const y = clientY - centerY;
        return Math.atan2(y, x) * (180 / Math.PI);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        // Prevent default touch actions like scrolling the page
        e.preventDefault();
        wheelRef.current?.setPointerCapture(e.pointerId);
        setIsDragging(true);
        lastAngle.current = getAngle(e.clientX, e.clientY);
        accumulatedDelta.current = 0;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || lastAngle.current === null) return;
        e.preventDefault();

        const currentAngle = getAngle(e.clientX, e.clientY);
        let delta = currentAngle - lastAngle.current;

        // Handle wrapping around 180/-180 boundary
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        accumulatedDelta.current += delta;
        lastAngle.current = currentAngle;

        // Threshold for one "tick" of scrolling (approx 20 degrees)
        const TICK_THRESHOLD = 20;

        if (Math.abs(accumulatedDelta.current) >= TICK_THRESHOLD) {
            const direction = accumulatedDelta.current > 0 ? 1 : -1;
            onScroll(direction);

            // Haptic Feedback
            if (navigator.vibrate) navigator.vibrate(10);

            // Reset accumulator but keep remainder for smoothness
            accumulatedDelta.current -= direction * TICK_THRESHOLD;
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        lastAngle.current = null;
        wheelRef.current?.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            ref={wheelRef}
            className="relative size-64 bg-[#f2f2f2] rounded-full shadow-[inset_0_5px_10px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center cursor-pointer active:brightness-95 transition-all select-none touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Menu Button (Top) */}
            <div
                className="absolute top-4 font-bold text-gray-400 font-sans tracking-wide text-[11px] active:text-black active:scale-105 transition-all z-20 w-16 h-10 flex justify-center pt-2"
                onPointerDown={(e) => { e.stopPropagation(); onMenu(); }}
            >
                MENU
            </div>

            {/* Prev Button (Left) */}
            <div
                className="absolute left-4 text-gray-400 active:text-black active:scale-105 transition-all z-20 w-10 h-16 flex items-center justify-start pl-2"
                onPointerDown={(e) => { e.stopPropagation(); onPrev(); }}
            >
                <Rewind size={18} fill="currentColor" />
            </div>

            {/* Next Button (Right) */}
            <div
                className="absolute right-4 text-gray-400 active:text-black active:scale-105 transition-all z-20 w-10 h-16 flex items-center justify-end pr-2"
                onPointerDown={(e) => { e.stopPropagation(); onNext(); }}
            >
                <FastForward size={18} fill="currentColor" />
            </div>

            {/* Play/Pause Button (Bottom) */}
            <div
                className="absolute bottom-4 text-gray-400 active:text-black active:scale-105 transition-all z-20 w-16 h-10 flex justify-center items-end pb-3 gap-0.5"
                onPointerDown={(e) => { e.stopPropagation(); onPlayPause(); }}
            >
                <Play size={10} fill="currentColor" />
                <Pause size={10} fill="currentColor" />
            </div>

            {/* Center Select Button */}
            <motion.div
                className="size-24 bg-gradient-to-b from-[#fff] to-[#e0e0e0] rounded-full shadow-[inset_0_2px_5px_rgba(255,255,255,1),0_2px_5px_rgba(0,0,0,0.1)] active:scale-95 transition-all z-20 relative"
                whileTap={{ scale: 0.95 }}
                onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}
            />
        </div>
    );
}
