import type { CatalogItem, CategoryId, BiomeInfo, MoodId, ItemCategory, Rarity } from '../lib/types';
import { categoryFromKind } from '../lib/types';

// ── Categorías de misiones ───────────────────────────────────────────
export interface CategoryDef {
  id: CategoryId;
  label: string;
  color: string; // hex para UI
  soft: string; // fondo pastel
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'creativity', label: 'Creatividad', color: '#E5829F', soft: '#FBE3EB' },
  { id: 'learning', label: 'Aprendizaje', color: '#7B9FE8', soft: '#E2EAFB' },
  { id: 'movement', label: 'Salud y movimiento', color: '#5FB37A', soft: '#DFF2E4' },
  { id: 'projects', label: 'Proyectos', color: '#C88B4A', soft: '#F7E8D6' },
  { id: 'organization', label: 'Orden y organización', color: '#8B87C9', soft: '#E8E6F7' },
  { id: 'wellness', label: 'Descanso y bienestar', color: '#4FBDBA', soft: '#DCF2F1' },
  { id: 'personal', label: 'Personalizada', color: '#718071', soft: '#EAEFEA' },
];

export const categoryOf = (id: CategoryId): CategoryDef =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

// ── Rarezas ──────────────────────────────────────────────────────────
export const RARITY_LABEL: Record<Rarity, string> = {
  comun: 'Común', raro: 'Rara', epico: 'Épica', legendario: 'Legendaria',
};
export const RARITY_COLOR: Record<Rarity, string> = {
  comun: '#91C987', raro: '#8BD8D0', epico: '#D1C5F2', legendario: '#F5DF91',
};

// ── Ánimos del diario ────────────────────────────────────────────────
export const MOODS: { id: MoodId; label: string; color: string }[] = [
  { id: 'happy', label: 'Feliz', color: '#F5DF91' },
  { id: 'calm', label: 'En calma', color: '#8BD8D0' },
  { id: 'proud', label: 'Orgullosa/o', color: '#F5B8CA' },
  { id: 'tired', label: 'Cansada/o', color: '#D1C5F2' },
  { id: 'inspired', label: 'Inspirada/o', color: '#91C987' },
];

// ── Catálogo de objetos coleccionables ───────────────────────────────
// cost = 0 → se desbloquea automáticamente al alcanzar unlockLevel.
export const CATALOG: CatalogItem[] = [
  // Árboles
  { id: 'tree_round', name: 'Árbol Bolita', kind: 'tree', unlockBy: 'level', rarity: 'comun', cost: 0, unlockLevel: 1, hint: 'Tu primer compañero desde el nacimiento del jardín.', color: '#91C987', accent: '#9A7054' },
  { id: 'tree_pink', name: 'Cerezo Rosado', kind: 'tree', unlockBy: 'seeds', rarity: 'raro', cost: 12, unlockLevel: 2, hint: 'Alcanza el Nivel 2 y cómpralo con semillas mágicas.', color: '#F5B8CA', accent: '#9A7054' },
  { id: 'tree_tall', name: 'Pino Adormilado', kind: 'tree', unlockBy: 'seeds', rarity: 'raro', cost: 15, unlockLevel: 3, hint: 'Disponible en el Nivel 3 · Jardín acogedor.', color: '#527D59', accent: '#9A7054' },
  { id: 'tree_gold', name: 'Árbol Mantequilla', kind: 'tree', unlockBy: 'seeds', rarity: 'epico', cost: 25, unlockLevel: 4, hint: 'Brilla bajo el sol de la Isla en flor.', color: '#F5DF91', accent: '#9A7054' },
  // Flores
  { id: 'flower_daisy', name: 'Margaridita', kind: 'flower', unlockBy: 'level', rarity: 'comun', cost: 0, unlockLevel: 1, hint: 'Ya florece en tu isla desde el principio.', color: '#FFFEFA', accent: '#F5DF91' },
  { id: 'flower_tulip', name: 'Tulipán Melocotón', kind: 'flower', unlockBy: 'seeds', rarity: 'comun', cost: 4, unlockLevel: 1, hint: 'Pequeño gasto; gana semillas completando misiones.', color: '#F6C5A2', accent: '#527D59' },
  { id: 'flower_lavender', name: 'Lavanda Suave', kind: 'flower', unlockBy: 'seeds', rarity: 'raro', cost: 10, unlockLevel: 2, hint: 'Se compra con semillas a partir del Nivel 2.', color: '#D1C5F2', accent: '#527D59' },
  { id: 'flower_bluebell', name: 'Campanilla Azul', kind: 'flower', unlockBy: 'seeds', rarity: 'raro', cost: 12, unlockLevel: 3, hint: 'Un regalo azul cielo para el Nivel 3.', color: '#BDE6F5', accent: '#527D59' },
  { id: 'flower_starbloom', name: 'Estrella Floral', kind: 'flower', unlockBy: 'seeds', rarity: 'legendario', cost: 30, unlockLevel: 5, hint: 'Solo para paraísos de ensueño (Nivel 5).', color: '#F5DF91', accent: '#D1C5F2' },
  // Plantas
  { id: 'shrub_ball', name: 'Arbusto Esfera', kind: 'plant', unlockBy: 'level', rarity: 'comun', cost: 0, unlockLevel: 2, hint: 'Aparece gratis al llegar al Nivel 2.', color: '#527D59' },
  { id: 'mushroom_classic', name: 'Seta Coqueta', kind: 'plant', unlockBy: 'seeds', rarity: 'comun', cost: 5, unlockLevel: 1, hint: 'Compra barata para empezar a decorar.', color: '#F5B8CA', accent: '#FFF8EC' },
  { id: 'mushroom_tall', name: 'Seta Gigante Pastel', kind: 'plant', unlockBy: 'seeds', rarity: 'raro', cost: 14, unlockLevel: 3, hint: 'Alto, suave y un poco mágico.', color: '#D1C5F2', accent: '#FFF8EC' },
  { id: 'fern_patch', name: 'Helecho Rizado', kind: 'plant', unlockBy: 'seeds', rarity: 'comun', cost: 6, unlockLevel: 2, hint: 'Verde frondoso para rincones tranquilos.', color: '#91C987' },
  // Rocas
  { id: 'rock_clay', name: 'Roca de Arcilla', kind: 'rock', unlockBy: 'level', rarity: 'comun', cost: 0, unlockLevel: 1, hint: 'Tu primera piedra decorativa, regalo de bienvenida.', color: '#C9C2B8' },
  { id: 'rock_mossy', name: 'Piedra Musgosa', kind: 'rock', unlockBy: 'seeds', rarity: 'comun', cost: 5, unlockLevel: 2, hint: 'Lleva un gorro de musgo verde.', color: '#A9A49A', accent: '#91C987' },
  { id: 'rock_stack', name: 'Torre de Piedritas', kind: 'rock', unlockBy: 'seeds', rarity: 'raro', cost: 9, unlockLevel: 3, hint: 'Tres piedras en equilibrio zen.', color: '#BCB6AC', accent: '#F6C5A2' },
  // Decoraciones
  { id: 'path_stones', name: 'Sendero de Piedras', kind: 'deco', unlockBy: 'level', rarity: 'comun', cost: 0, unlockLevel: 3, hint: 'Se abre paso solo al llegar al Nivel 3.', color: '#D8CFBF' },
  { id: 'lamp_lantern', name: 'Farolito Nocturno', kind: 'deco', unlockBy: 'seeds', rarity: 'raro', cost: 12, unlockLevel: 3, hint: 'Ilumina suavemente los atardeceres.', color: '#F5DF91', accent: '#9A7054' },
  { id: 'fountain_small', name: 'Fuente Mini', kind: 'deco', unlockBy: 'seeds', rarity: 'epico', cost: 20, unlockLevel: 3, hint: 'Agua turquesa que canta bajito.', color: '#8BD8D0', accent: '#D8EED7' },
  { id: 'bench_wood', name: 'Banquita de Madera', kind: 'deco', unlockBy: 'seeds', rarity: 'raro', cost: 14, unlockLevel: 4, hint: 'Para sentarse a mirar las nubes.', color: '#9A7054' },
  { id: 'signpost', name: 'Cartel Curioso', kind: 'deco', unlockBy: 'seeds', rarity: 'comun', cost: 6, unlockLevel: 2, hint: 'Señala hacia aventuras futuras.', color: '#F6C5A2', accent: '#9A7054' },
  // Casitas
  { id: 'house_cottage', name: 'Casita Campo', kind: 'house', unlockBy: 'level', rarity: 'epico', cost: 0, unlockLevel: 3, hint: 'Regalo del Nivel 3 · Jardín acogedor.', color: '#FFF8EC', accent: '#E5829F' },
  { id: 'house_mushroom', name: 'Casita Seta', kind: 'house', unlockBy: 'seeds', rarity: 'legendario', cost: 35, unlockLevel: 5, hint: 'El hogar de algún duende tímido (Nivel 5).', color: '#F5B8CA', accent: '#FFFEFA' },
  // Animales
  { id: 'animal_bird', name: 'Pajarito Bolita', kind: 'animal', unlockBy: 'seeds', rarity: 'raro', cost: 10, unlockLevel: 2, hint: 'Canta cuando completas misiones.', color: '#BDE6F5', accent: '#F6C5A2' },
  { id: 'animal_bunny', name: 'Conejito Trufa', kind: 'animal', unlockBy: 'seeds', rarity: 'raro', cost: 14, unlockLevel: 3, hint: 'Le encantan las zanahorias y las siestas.', color: '#FFFEFA', accent: '#F5B8CA' },
  { id: 'animal_fox', name: 'Zorrito Cálido', kind: 'animal', unlockBy: 'seeds', rarity: 'epico', cost: 22, unlockLevel: 4, hint: 'Aparece en la Isla en flor.', color: '#F6C5A2', accent: '#9A7054' },
  { id: 'animal_butterfly', name: 'Mariposas', kind: 'animal', unlockBy: 'level', rarity: 'epico', cost: 0, unlockLevel: 4, hint: 'Vuelan solas al llegar al Nivel 4.', color: '#D1C5F2', accent: '#F5B8CA' },
  // Mágicos
  { id: 'magic_crystal', name: 'Cristal Susurrante', kind: 'magic', unlockBy: 'seeds', rarity: 'epico', cost: 24, unlockLevel: 4, hint: 'Brilla con luz lavanda por las noches.', color: '#D1C5F2' },
  { id: 'magic_fireflies', name: 'Luciérnagas', kind: 'magic', unlockBy: 'level', rarity: 'legendario', cost: 0, unlockLevel: 5, hint: 'La noche del Paraíso se llena de lucecitas.', color: '#F5DF91' },
  { id: 'magic_arch', name: 'Arco Encantado', kind: 'magic', unlockBy: 'seeds', rarity: 'legendario', cost: 40, unlockLevel: 5, hint: 'Un portal pequeñito a otros sueños.', color: '#8BD8D0', accent: '#F5B8CA' },
];

// Se deriva la categoría de UI desde el tipo de objeto y se normaliza el catálogo.
for (const i of CATALOG as CatalogItem[]) {
  i.category = categoryFromKind(i.kind);
}

/** Mapa categoría → ids, para filtros de la colección. */
export const ITEMS_BY_CATEGORY: Record<ItemCategory, string[]> = (() => {
  const map = { trees: [], flowers: [], plants: [], rocks: [], decor: [], houses: [], animals: [], magic: [], biome: [] } as Record<ItemCategory, string[]>;
  for (const i of CATALOG) map[i.category!].push(i.id);
  return map;
})();

export const itemById = (id: string): CatalogItem | undefined =>
  CATALOG.find((i) => i.id === id);

/** Objetos que se desbloquean gratis al alcanzar un nivel. */
export const freeItemsForLevel = (level: number): string[] =>
  CATALOG.filter((i) => i.cost === 0 && (i.unlockLevel ?? 1) <= level).map((i) => i.id);

// ── Biomas ───────────────────────────────────────────────────────────
export const BIOMES: BiomeInfo[] = [
  {
    id: 'meadow',
    name: 'Meadow',
    tagline: 'El prado original',
    description: 'Hierba suave, un arbolito y muchas promesas. Aquí nace todo.',
    unlockLevel: 1,
    cost: 0,
    sky: '#DFF1F7',
    ground: '#91C987',
    accent: '#F5DF91',
  },
  {
    id: 'mushroom',
    name: 'Mushroom Forest',
    tagline: 'Bosque de setas pastel',
    description: 'Hongos gigantes de colores suaves, tronquitos y luces cálidas entre la maleza.',
    unlockLevel: 3,
    cost: 40,
    sky: '#EFE3F3',
    ground: '#A8C69A',
    accent: '#F5B8CA',
  },
  {
    id: 'cloud',
    name: 'Cloud Islands',
    tagline: 'Islas entre nubes',
    description: 'Un archipiélago suspendido con puentecitos diminutos y flores etéreas.',
    unlockLevel: 4,
    cost: 60,
    sky: '#DCEEF9',
    ground: '#CDEAD9',
    accent: '#BDE6F5',
  },
  {
    id: 'sunset',
    name: 'Sunset Beach',
    tagline: 'Playa melocotón',
    description: 'Arena color durazno, agua turquesa y palmeras de dibujos animados.',
    unlockLevel: 4,
    cost: 70,
    sky: '#FBE3D2',
    ground: '#F6C5A2',
    accent: '#8BD8D0',
  },
  {
    id: 'lavender',
    name: 'Lavender Hills',
    tagline: 'Colinas de lavanda',
    description: 'Ondas violetas, caminos suaves y molinos que giran despacio.',
    unlockLevel: 5,
    cost: 80,
    sky: '#E9E3F7',
    ground: '#C9BCE8',
    accent: '#D1C5F2',
  },
];

export const biomeById = (id: string): BiomeInfo =>
  BIOMES.find((b) => b.id === id) ?? BIOMES[0];

// ── Frases según estado del jardín ───────────────────────────────────
export const GARDEN_PHRASES = [
  'Tu pequeño mundo está creciendo.',
  'Cada paso cuenta. El jardín lo sabe.',
  'Algo verde te está esperando hoy.',
  'Las flores crecen mejor con compañía.',
  'Hoy también es un buen día para cuidar algo bonito.',
];
