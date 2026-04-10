// Indonesian Retro Color Palette
export const RETRO = {
  merahBata: '#C41E3A',
  kunyit: '#D4A017',
  daun: '#228B22',
  garam: '#F5F5DC',
  lada: '#2F2F2F',
  sambal: '#DC143C',
  jeruk: '#FF8C00',
  kemiri: '#8B4513',
  kelapa: '#FFF8DC',
  teh: '#D2691E',
  pandan: '#4CAF50',
  gula: '#FFD700',
  kopi: '#6F4E37',
};

// Color group mapping for tiles
export const TILE_COLORS: Record<string, string> = {
  brown: '#92400E',
  lightBlue: '#7DD3FC',
  pink: '#F472B6',
  orange: '#FB923C',
  red: '#EF4444',
  yellow: '#FACC15',
  green: '#4ADE80',
  darkBlue: '#1E40AF',
  transport: '#6B7280',
  utility: '#A78BFA',
  tax: '#F87171',
  corner: '#FDE047',
  card: '#67E8F9',
};

// Player token colors
export const PLAYER_COLORS = [
  '#DC143C', // sambal
  '#1E90FF', // biru
  '#32CD32', // hijau
  '#FF8C00', // jeruk
  '#9370DB', // ungu
  '#FF69B4', // pink
];

export function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
