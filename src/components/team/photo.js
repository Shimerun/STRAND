import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { EASE_REVEAL } from '../../lib/motion.js';

// Only barbers listed in site.images.team have a photo; asking for the others cost a 404 each on every visit.
export const barberPhoto = (slug) => (site.images.team[slug] ? assetUrl(site.images.team[slug]) : null);

// Stands in for a missing photo: "Олег Док" → "ОД".
export const initials = (name) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2);

// The card photo and the profile photo share a layoutId, so opening the profile morphs one into the other.
// Both frames are 4:5 with this radius: the morph is then a plain scale, and the picture is never distorted.
export const photoLayoutId = (slug) => `barber-photo-${slug}`;
export const PHOTO_RADIUS = 6; // px, theme borderRadius
export const PHOTO_TRANSITION = { layout: { duration: 0.55, ease: EASE_REVEAL } };
