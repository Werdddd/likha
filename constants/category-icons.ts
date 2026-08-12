import { Ionicons } from '@expo/vector-icons';

import type { Category } from '../types';

export const CATEGORY_ICONS: Record<Category, keyof typeof Ionicons.glyphMap> = {
  Illustration: 'color-palette-outline',
  'Graphic Design': 'shapes-outline',
  Photography: 'camera-outline',
  'UI/UX Design': 'phone-portrait-outline',
  Writing: 'create-outline',
  '3D Art': 'cube-outline',
  Crafts: 'construct-outline',
};

export const CUSTOM_CATEGORY_ICON: keyof typeof Ionicons.glyphMap = 'pricetag-outline';

export function iconForCategory(value: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[value as Category] ?? CUSTOM_CATEGORY_ICON;
}
