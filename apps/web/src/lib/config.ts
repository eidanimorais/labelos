const FALLBACK_API_URL = "http://localhost:8000";

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
}

export const API_BASE_URL = trimTrailingSlash(
    import.meta.env.VITE_API_BASE_URL || FALLBACK_API_URL
);

export function getAssetUrl(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

