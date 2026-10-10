/**
 * AvatarCustomization.ts — Avatar Configuration Entity & Presets
 *
 * Defines the parametric configuration for semi-realistic stylized 3D adult avatars
 * inspired by Microsoft Teams aesthetic (grounded adult proportions, matte skin,
 * natural expressive eyes, varied hair & clothing styles).
 */

export type SkinToneId =
  | 'light-warm'
  | 'fair'
  | 'peach'
  | 'olive'
  | 'warm-tan'
  | 'deep-warm';

export type HairStyleId =
  | 'short-part'
  | 'textured-crop'
  | 'shoulder-waves'
  | 'curls'
  | 'top-knot';

export type HairColorId =
  | 'espresso'
  | 'black'
  | 'chestnut'
  | 'blonde'
  | 'auburn'
  | 'silver';

export type ClothingStyleId = 'cardigan' | 'crewneck' | 'polo' | 'blazer';

export type ClothingColorId =
  | 'teal'
  | 'navy'
  | 'sage'
  | 'terracotta'
  | 'charcoal'
  | 'plum';

export type EyewearId = 'none' | 'round' | 'rectangular';

export interface AvatarCustomization {
  version: 1;
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  hairColor: HairColorId;
  clothingStyle: ClothingStyleId;
  clothingColor: ClothingColorId;
  eyewear: EyewearId;
}

export const SKIN_TONE_PALETTE: Record<SkinToneId, { hex: number; label: string }> = {
  'light-warm': { hex: 0xf5cfb8, label: 'Light Warm' },
  fair: { hex: 0xfce4d6, label: 'Fair' },
  peach: { hex: 0xdeb39a, label: 'Peach' },
  olive: { hex: 0xc89874, label: 'Olive' },
  'warm-tan': { hex: 0xa87152, label: 'Warm Tan' },
  'deep-warm': { hex: 0x6e432c, label: 'Deep Warm' },
};

export const HAIR_COLOR_PALETTE: Record<HairColorId, { hex: number; label: string }> = {
  espresso: { hex: 0x2b1d16, label: 'Espresso Brown' },
  black: { hex: 0x141212, label: 'Deep Black' },
  chestnut: { hex: 0x6e3822, label: 'Chestnut' },
  blonde: { hex: 0xc49b5c, label: 'Honey Blonde' },
  auburn: { hex: 0x8a3c26, label: 'Auburn' },
  silver: { hex: 0xb5b5be, label: 'Silver Gray' },
};

export const CLOTHING_COLOR_PALETTE: Record<ClothingColorId, { hex: number; label: string }> = {
  teal: { hex: 0x1c6e72, label: 'Signature Teal' },
  navy: { hex: 0x243b55, label: 'Classic Navy' },
  sage: { hex: 0x487a5b, label: 'Forest Sage' },
  terracotta: { hex: 0xc45d3e, label: 'Terracotta' },
  charcoal: { hex: 0x36393e, label: 'Charcoal' },
  plum: { hex: 0x5a4260, label: 'Muted Plum' },
};

export const DEFAULT_USER_AVATAR: AvatarCustomization = {
  version: 1,
  skinTone: 'fair',
  hairStyle: 'textured-crop',
  hairColor: 'espresso',
  clothingStyle: 'cardigan',
  clothingColor: 'teal',
  eyewear: 'none',
};

export const PARTNER_AVATAR_PRESETS: Record<string, AvatarCustomization> = {
  alex: {
    version: 1,
    skinTone: 'light-warm',
    hairStyle: 'short-part',
    hairColor: 'espresso',
    clothingStyle: 'crewneck',
    clothingColor: 'teal',
    eyewear: 'none',
  },
  maya: {
    version: 1,
    skinTone: 'peach',
    hairStyle: 'shoulder-waves',
    hairColor: 'black',
    clothingStyle: 'cardigan',
    clothingColor: 'plum',
    eyewear: 'round',
  },
  jordan: {
    version: 1,
    skinTone: 'olive',
    hairStyle: 'curls',
    hairColor: 'black',
    clothingStyle: 'blazer',
    clothingColor: 'sage',
    eyewear: 'none',
  },
  sam: {
    version: 1,
    skinTone: 'fair',
    hairStyle: 'textured-crop',
    hairColor: 'chestnut',
    clothingStyle: 'polo',
    clothingColor: 'terracotta',
    eyewear: 'rectangular',
  },
};
