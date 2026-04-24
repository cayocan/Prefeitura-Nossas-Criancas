"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearSessionAction } from "@/lib/auth";

const INACTIVITY_MS = 60 * 60 * 1000; // 1 hora

const ACTIVITY_EVENTS = [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "click",
] as const;

export function InactivityWatcher() {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();

    const handleExpiry = useCallback(async () => {
        await clearSessionAction();
        router.push("/login?reason=inatividade");
    }, [router]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleExpiry, INACTIVITY_MS);
    }, [handleExpiry]);

    useEffect(() => {
        resetTimer();
        ACTIVITY_EVENTS.forEach((e) =>
            window.addEventListener(e, resetTimer, { passive: true }),
        );
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            ACTIVITY_EVENTS.forEach((e) =>
                window.removeEventListener(e, resetTimer),
            );
        };
    }, [resetTimer]);

    return null;
}
