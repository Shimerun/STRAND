import { assetUrl } from '../../lib/assetUrl.js';

// Team photos live at public/images/team/<slug>.jpg.
export const barberPhoto = (slug) => assetUrl(`/images/team/${slug}.jpg`);
