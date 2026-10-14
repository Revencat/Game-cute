// ── Tipos del dominio de Little World ────────────────────────────────

export type CategoryId =
  | 'creativity'
  | 'learning'
  | 'movement'
  | 'projects'
  | 'organization'
  | 'wellness'
  | 'personal';

export type Frequency = 'once' | 'daily' | 'weekly';

export type Rarity = 'comun' | 'raro' | 'epico' | 'legendario';

export type ItemKind =
  | 'tree'
  | 'flower'
  | 'plant'
  | 'rock'
  | 'deco'
  | 'house'
  | 'animal'
  | 'magic'
  | 'biome';

/** Categoría de UI para la colección (más granular que ItemKind). */
export type ItemCategory =
  | 'trees'
  | 'flowers'
  | 'plants'
  | 'rocks'
  | 'decor'
  | 'houses'
  | 'animals'
  | 'magic'
  | 'biome';

const KIND_TO_CATEGORY: Record<ItemKind, ItemCategory> = {
  tree: 'trees', flower: 'flowers', plant: 'plants', rock: 'rocks',
  deco: 'decor', house: 'houses', animal: 'animals', magic: 'magic', biome: 'biome',
};

export const categoryFromKind = (kind: ItemKind): ItemCategory => KIND_TO_CATEGORY[kind];

export interface Mission {
  id: string;
  title: string;
  description?: string;
  category: CategoryId;
  frequency: Frequency;
  target?: number; // cantidad opcional (p. ej. minutos, páginas)
  xp: number; // experiencia al completarla
  seeds: number; // semillas mágicas ganadas
  createdAt: string; // ISO
  /** historial de fechas (YYYY-MM-DD) en las que se completó */
  completions: string[];
  doneOnce?: boolean; // para misiones "once"
  demo?: boolean; // creada por los datos de ejemplo
}

export interface PlacedItem {
  instanceId: string;
  itemId: string;
  slot: number; // ranura de colocación en la isla
  rotation: number; // radianes
  placedAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  text: string;
  date: string; // YYYY-MM-DD
  mood?: MoodId;
  imageId?: string; // clave en IndexedDB
  linkedMissionId?: string;
  createdAt: string;
}

export type MoodId = 'happy' | 'calm' | 'proud' | 'tired' | 'inspired';

export interface CatalogItem {
  id: string;
  name: string;
  kind: ItemKind;
  /** categoría derivada de kind (se rellena automáticamente al final de catalog.ts) */
  category?: ItemCategory;
  rarity: Rarity;
  cost: number; // semillas; 0 = se desbloquea por nivel
  unlockLevel?: number; // requisito de nivel
  /** 'level' → regalo automático del nivel; 'seeds' → compra con semillas */
  unlockBy?: 'level' | 'seeds';
  hint: string; // cómo conseguirlo
  color: string; // color principal (para miniaturas 3D y UI)
  accent?: string; // color secundario
  biome?: string; // si pertenece a un bioma
}

/** Historial ligero de actividad (desbloqueos, niveles, misiones). */
export interface ActivityEvent {
  id: string;
  at: string; // ISO
  type: 'unlock' | 'levelup' | 'complete' | 'biome';
  itemId?: string;
  biomeId?: string;
  level?: number;
  missionTitle?: string;
}

export interface BiomeInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  unlockLevel: number;
  cost: number;
  sky: string;
  ground: string;
  accent: string;
}

export interface Settings {
  reduceMotion: boolean; // respeta preferencia del sistema + override manual
  soundEnabled: boolean;
  darkMode: boolean;
}

export interface WorldState {
  worldName: string;
  level: number;
  xp: number; // XP total acumulado
  seeds: number; // semillas disponibles
  unlockedItems: string[]; // ids del catálogo
  placements: PlacedItem[]; // objetos colocados en la isla
  activeBiome: string; // 'meadow' por defecto
  unlockedBiomes: string[];
  journal: JournalEntry[];
  missions: Mission[];
  activity: ActivityEvent[]; // historial ligero (novedades, resumen)
  lastVisit: string; // YYYY-MM-DD
  streakDays: number; // días consecutivos con actividad
  createdAt: string;
  onboarded: boolean;
  settings: Settings;
  demoLoaded: boolean;
}

export interface LevelInfo {
  level: number;
  name: string;   // nombre en inglés con personalidad
  es: string;     // nombre en español
  from: number;   // XP acumulada mínima
  to: number;     // XP acumulada para el siguiente nivel
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Tiny Seed',        es: 'Semillita',        from: 0,   to: 100 },
  { level: 2, name: 'Little Sprout',    es: 'Brote pequeño',    from: 100, to: 260 },
  { level: 3, name: 'Cozy Garden',      es: 'Jardín acogedor',  from: 260, to: 500 },
  { level: 4, name: 'Blooming Island',  es: 'Isla en flor',     from: 500, to: 820 },
  { level: 5, name: 'Dreamy Paradise',  es: 'Paraíso de ensueño', from: 820, to: 1200 },
];

/** Nombre del nivel en formato "Nivel 3 · Jardín acogedor". */
export const LEVEL_NAMES: Record<number, string> = Object.fromEntries(
  LEVELS.map((l) => [l.level, l.es]),
);

export function levelForXp(xp: number): number {
  let lvl = 1;
  for (const l of LEVELS) if (xp >= l.from) lvl = l.level;
  return Math.min(lvl, LEVELS.length);
}

/** Rango de XP del nivel: [xp inicial del nivel, xp del siguiente nivel]. */
export function xpRangeForLevel(level: number): [number, number] {
  const l = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, level - 1))];
  return [l.from, l.to];
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** ¿La misión está completada dentro de su periodo actual? */
export function isMissionDoneToday(m: Mission, today = todayStr()): boolean {
  if (m.frequency === 'once') return !!m.doneOnce;
  if (m.completions.includes(today)) return true;
  if (m.frequency === 'weekly') {
    // completada si hay alguna finalización en lo que va de semana (lunes como inicio)
    const d = new Date();
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const monStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    return m.completions.some((c) => c >= monStr && c <= today);
  }
  return false;
}

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
