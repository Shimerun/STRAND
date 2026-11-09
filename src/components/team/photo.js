import { assetUrl } from '../../lib/assetUrl.js';
import { EASE_REVEAL } from '../../lib/motion.js';

// Barber photos come from public/images/team/<slug>.jpg; a missing file shows the Img placeholder.
export const barberPhoto = (slug) => assetUrl(`/images/team/${slug}.jpg`);

// The card photo and the profile photo share a layoutId, so opening the profile morphs one into the other.
// Both frames are 4:5 with this radius: the morph is then a plain scale, and the picture is never distorted.
export const photoLayoutId = (slug) => `barber-photo-${slug}`;
export const PHOTO_RADIUS = 6; // px, theme borderRadius
export const PHOTO_TRANSITION = { layout: { duration: 0.55, ease: EASE_REVEAL } };
