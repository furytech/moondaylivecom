const SUPABASE_PROJECT_URL =
  import.meta.env?.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';

export const TRANSIT_IMAGES_BUCKET = 'transit-images';

/**
 * Returns the public storage URL for a specific zodiac sign's branded image.
 * Expected naming in Supabase Storage `transit-images` bucket: `[sign].png` (e.g., `aries.png`, `taurus.png`)
 */
export function getDefaultTransitImageUrl(signOrId?: string | null): string {
  if (!signOrId) {
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${TRANSIT_IMAGES_BUCKET}/aries.png`;
  }
  const cleanSign = signOrId.toLowerCase().trim();
  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${TRANSIT_IMAGES_BUCKET}/${cleanSign}.png`;
}
