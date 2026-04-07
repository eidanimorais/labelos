const FALLBACK_API_URL = "http://localhost:8000";
const DEFAULT_BACKEND = "supabase";

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
}

export const APP_BACKEND = import.meta.env.VITE_APP_BACKEND || DEFAULT_BACKEND;
export const IS_SUPABASE_MODE = APP_BACKEND === "supabase";
export const IS_LEGACY_API_MODE = APP_BACKEND === "legacy-api";

export const SUPABASE_URL = trimTrailingSlash(import.meta.env.VITE_SUPABASE_URL || "");
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const HAS_SUPABASE_CONFIG = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const API_BASE_URL = trimTrailingSlash(
    import.meta.env.VITE_API_BASE_URL || FALLBACK_API_URL
);

export function getAssetUrl(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}
