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
    const lastVibration = useRef(0);
    const hasMoved = useRef(false);

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
        hasMoved.current = false;
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

        // Mark as moved if threshold passed
        if (Math.abs(accumulatedDelta.current) > 6) {
            hasMoved.current = true;
        }

        // Threshold for one "tick" of scrolling (approx 20 degrees)
        const TICK_THRESHOLD = 20;

        if (Math.abs(accumulatedDelta.current) >= TICK_THRESHOLD) {
            const direction = accumulatedDelta.current > 0 ? 1 : -1;
            onScroll(direction);

            // Audio Feedback (Click Sound)
            playClickSound('tick');

            // Throttle Haptic Feedback (Prevent Android Lag)
            const now = Date.now();
            if (now - lastVibration.current > 40 && typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(3); // Ultra short vibration for crispness
                lastVibration.current = now;
            }

            // Reset accumulator but keep remainder for smoothness
            accumulatedDelta.current -= direction * TICK_THRESHOLD;
        }
    };

    // Synthetic Click Sound helper
    const playClickSound = (type: 'tick' | 'select' = 'tick') => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'tick') {
                // Crisp mechanical click - Optimized for realism
                osc.type = 'square'; // Square wave sounds more "clicky" than triangle
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.005);
                gain.gain.setValueAtTime(0.05, ctx.currentTime); // Lower volume to prevent ear fatigue
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.008);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.01);
            } else {
                // Thud / Select sound
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            }
        } catch (e) {
            // Ignore audio errors (e.g. user didn't interact yet)
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDragging && !hasMoved.current) {
            // It was a TAP! Determine button by Angle.
            const angle = lastAngle.current || getAngle(e.clientX, e.clientY);
            playClickSound('select'); // Sound for Tap

            // Normalize angle to -180 to 180
            // Top (-90 range), Right (0 range), Bottom (90 range), Left (180 range)

            // Menu (Top): -135 to -45
            if (angle > -135 && angle < -45) {
                onMenu();
                if (navigator.vibrate) navigator.vibrate(10);
            }
            // Play (Bottom): 45 to 135
            else if (angle > 45 && angle < 135) {
                onPlayPause();
                if (navigator.vibrate) navigator.vibrate(10);
            }
            // Next (Right): -45 to 45
            else if (angle >= -45 && angle <= 45) {
                onNext();
                if (navigator.vibrate) navigator.vibrate(10);
            }
            // Prev (Left): <-135 or >135
            else {
                onPrev();
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }

        setIsDragging(false);
        lastAngle.current = null;
        wheelRef.current?.releasePointerCapture(e.pointerId);
    };

    // Center Button Refs
    const isCenterPressed = useRef(false);

    // Helper for preventing scroll interference while allowing clicks
    // Reverting to direct onPointerDown handler for instant mobile response
    const createButtonHandler = (action: () => void) => (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        action();
    };

    return (
        <div
            ref={wheelRef}
            className="relative size-64 bg-[#f2f2f2] rounded-full shadow-[inset_0_5px_10px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center cursor-pointer active:brightness-95 transition-all select-none touch-none pointer-events-auto"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Visual Labels (Pointer Events None to let Wheel capture) */}
            <div className="absolute top-4 font-bold text-gray-400 font-sans tracking-wide text-[11px] pointer-events-none">MENU</div>
            <div className="absolute left-4 text-gray-400 pointer-events-none"><Rewind size={18} fill="currentColor" /></div>
            <div className="absolute right-4 text-gray-400 pointer-events-none"><FastForward size={18} fill="currentColor" /></div>
            <div className="absolute bottom-4 text-gray-400 flex gap-0.5 pointer-events-none">
                <Play size={10} fill="currentColor" />
                <Pause size={10} fill="currentColor" />
            </div>

            {/* Center Button (Distinct) */}
            <motion.div
                className="size-24 bg-gradient-to-b from-[#fff] to-[#e0e0e0] rounded-full shadow-[inset_0_2px_5px_rgba(255,255,255,1),0_2px_5px_rgba(0,0,0,0.1)] active:scale-95 transition-all z-20 relative"
                whileTap={{ scale: 0.95 }}
                onPointerDown={(e) => {
                    e.stopPropagation(); // Stop propagation to wheel
                    e.preventDefault();
                    isCenterPressed.current = true;
                }}
                onPointerUp={(e) => {
                    e.stopPropagation();
                    if (isCenterPressed.current) {
                        onSelect();
                        if (navigator.vibrate) navigator.vibrate(10);
                    }
                    isCenterPressed.current = false;
                }}
                onPointerLeave={() => isCenterPressed.current = false}
            />
        </div>
    );
}
