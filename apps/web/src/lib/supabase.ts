import { createClient } from "@supabase/supabase-js";
import { HAS_SUPABASE_CONFIG, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export const supabase = HAS_SUPABASE_CONFIG
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    })
    : null;

export function requireSupabaseClient() {
    if (!supabase) {
        throw new Error(
            "Supabase ainda nao foi configurado no frontend. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
        );
    }

    return supabase;
}
