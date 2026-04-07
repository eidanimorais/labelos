import { getAssetUrl } from "../lib/config";

/**
 * Generates the URL for a track's cover image based on its name.
 * It slugifies the name and appends .webp extension.
 * Example: "Frio do Inverno" -> "/images/capa/frio-do-inverno.webp"
 */
export function getCoverUrl(trackName: string, artistName?: string): string {
    if (!trackName) return getAssetUrl('/static/media/covers/default.webp');

    const slugify = (text: string) => text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s-]/g, "")     // Remove special chars
        .trim()
        .replace(/\s+/g, "-");            // Replace spaces with hyphens

    const trackSlug = slugify(trackName);

    if (artistName && artistName !== 'Unknown') {
        // Use only the first artist for the cover slug mapping
        const mainArtist = artistName.split(',')[0].trim();
        const artistSlug = slugify(mainArtist);
        return getAssetUrl(`/static/media/covers/${artistSlug}-${trackSlug}.webp`);
    }

    return getAssetUrl(`/static/media/covers/${trackSlug}.webp`);
}
