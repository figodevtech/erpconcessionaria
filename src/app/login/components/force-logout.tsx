"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function ForceLogout({ reason = "inactive" }: { reason?: string }) {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                await supabase.auth.signOut();
            } finally {
                if (!alive) return;
                // Force hard reload to clear client-side caches
                window.location.href = `/login?reason=${encodeURIComponent(reason)}`;
            }
        })();

        return () => {
            alive = false;
        };
    }, [reason, router]);

    return null;
}