import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { WorldState, Mission, PlacedItem, JournalEntry, CategoryId, ActivityEvent } from '../lib/types';
import { levelForXp, todayStr, isMissionDoneToday, uid, xpRangeForLevel } from '../lib/types';
export { isMissionDoneToday };
import { biomeById, freeItemsForLevel, itemById } from '../data/catalog';
import { loadState, saveState, saveImage, deleteImage } from '../lib/storage';

// ── Slot de colocación en la isla (coordenadas locales) ──────────────
export const ISLAND_SLOTS = 26;

const PREFS_KEY = 'lw-prefs';

interface Toast {
  id: string;
  text: string;
  kind: 'success' | 'info' | 'error';
}

interface LevelUpEvent {
  level: number;
  rewards: string[]; // nombres de ítems desbloqueados
}

interface WorldStore extends WorldState {
  ready: boolean;
  loaded: boolean;
  toasts: Toast[];
  celebrateKey: number; // incrementa al completar misión → animación
  levelUpEvent: LevelUpEvent | null;
  decorateMode: boolean;
  selectedSlot: number | null;
  selectedInstanceId: string | null;
  placingItemId: string | null;

  init: () => Promise<void>;
  selectInstance: (id: string | null) => void;
  pushToast: (text: string, kind?: Toast['kind']) => void;
  dismissToast: (id: string) => void;
  completeOnboarding: (worldName: string, intents: CategoryId[]) => void;
  addMission: (m: Omit<Mission, 'id' | 'createdAt' | 'completions'>) => void;
  updateMission: (id: string, patch: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  completeMission: (id: string) => boolean;
  undoComplete: (id: string) => void;
  buyItem: (itemId: string) => boolean;
  placeItem: (itemId: string, slot: number) => boolean;
  movePlacement: (instanceId: string, slot: number) => void;
  rotatePlacement: (instanceId: string) => void;
  removePlacement: (instanceId: string) => void;
  setDecorateMode: (on: boolean) => void;
  setPlacingItem: (itemId: string | null) => void;
  selectSlot: (slot: number | null) => void;
  unlockBiome: (biomeId: string) => boolean;
  setActiveBiome: (id: string) => void;
  addJournal: (e: Omit<JournalEntry, 'id' | 'createdAt'>, imageBlob?: Blob) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  toggleSetting: (key: keyof WorldState['settings']) => void;
  loadDemo: () => void;
  clearDemo: () => void;
  resetAll: () => void;
  reloadFromBackup: (state: WorldState) => void;
  clearLevelUp: () => void;
  dismissLevelUp: () => void;
  flushPersist: () => Promise<void>;
}

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function defaultSettings() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { reduceMotion: prefersReducedMotion, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { reduceMotion: prefersReducedMotion, soundEnabled: false, darkMode: false };
}

function initialState(): WorldState {
  return {
    worldName: 'Mi pequeño mundo',
    level: 1,
    xp: 0,
    seeds: 5,
    unlockedItems: ['tree_round', 'flower_daisy', 'rock_clay'],
    placements: [],
    activeBiome: 'meadow',
    unlockedBiomes: ['meadow'],
    journal: [],
    missions: [],
    activity: [],
    lastVisit: todayStr(),
    streakDays: 0,
    createdAt: new Date().toISOString(),
    onboarded: false,
    settings: defaultSettings(),
    demoLoaded: false,
  };
}

/** Coloca automáticamente los "regalos de nivel" en slots libres. */
function autoPlaceFreeGifts(state: WorldState): PlacedItem[] {
  const taken = new Set(state.placements.map((p) => p.slot));
  const placed = [...state.placements];
  const gifts = freeItemsForLevel(state.level).filter(
    (id) => !placed.some((p) => p.itemId === id),
  );
  // ranuras preferidas por tipo de regalo para una composición cuidada
  const preferred: Record<string, number[]> = {
    tree_round: [0],
    flower_daisy: [4, 9, 14],
    rock_clay: [7],
    shrub_ball: [11, 18],
    path_stones: [3],
    house_cottage: [1],
    animal_butterfly: [12],
    magic_fireflies: [20],
  };
  for (const id of gifts) {
    const slot = (preferred[id] ?? []).find((s) => s < ISLAND_SLOTS && !taken.has(s));
    if (slot === undefined) continue;
    taken.add(slot);
    placed.push({ instanceId: uid('p_'), itemId: id, slot, rotation: 0, placedAt: new Date().toISOString() });
  }
  return placed;
}

function act(type: ActivityEvent['type'], extra: Partial<ActivityEvent> = {}): ActivityEvent {
  return { id: uid('a_'), at: new Date().toISOString(), type, ...extra };
}
function withActivity(list: ActivityEvent[], ev: ActivityEvent[]): ActivityEvent[] {
  return [...ev, ...list].slice(0, 120); // historial acotado
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Construye el snapshot persistible desde el estado actual. */
function snapshot(s: WorldStore): WorldState {
  return {
    worldName: s.worldName, level: s.level, xp: s.xp, seeds: s.seeds,
    unlockedItems: s.unlockedItems, placements: s.placements,
    activeBiome: s.activeBiome, unlockedBiomes: s.unlockedBiomes,
    journal: s.journal, missions: s.missions, activity: s.activity, lastVisit: s.lastVisit,
    streakDays: s.streakDays, createdAt: s.createdAt, onboarded: s.onboarded,
    settings: s.settings, demoLoaded: s.demoLoaded,
  };
}

function doPersist(s: WorldStore) {
  const data = snapshot(s);
  void saveState(data);
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(data.settings));
  } catch { /* ignore */ }
}

function schedulePersist(get: () => WorldStore) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    doPersist(get());
  }, 350);
}

export const useWorld = create<WorldStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState(),
    ready: false,
    loaded: false,
    toasts: [],
    celebrateKey: 0,
    levelUpEvent: null,
    decorateMode: false,
    selectedSlot: null,
    selectedInstanceId: null,
    placingItemId: null,

    init: async () => {
      const saved = await loadState<WorldState>();
      if (saved) {
        const merged: WorldState = { ...initialState(), ...saved, settings: { ...defaultSettings(), ...saved.settings } };
        // actualizar visita sin castigar al usuario
        merged.lastVisit = todayStr();
        set({ ...merged, ready: true, loaded: true });
      } else {
        set({ ready: true, loaded: true });
      }
    },

    selectInstance: (id) => set({ selectedInstanceId: id, selectedSlot: id === null ? get().selectedSlot : null }),

    pushToast: (text, kind = 'success') => {
      const id = uid('t_');
      set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }));
      setTimeout(() => get().dismissToast(id), 3600);
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    completeOnboarding: (worldName, intents) => {
      const now = new Date().toISOString();
      const starterMissions: Mission[] = intents.slice(0, 3).map((cat) => ({
        id: uid('m_'),
        title: starterTitle(cat),
        category: cat,
        frequency: 'daily',
        xp: 20,
        seeds: 2,
        createdAt: now,
        completions: [],
      }));
      const gifts = freeItemsForLevel(1);
      set((s) => ({
        ...s,
        onboarded: true,
        worldName: worldName.trim() || s.worldName,
        missions: [...s.missions, ...starterMissions],
        placements: autoPlaceFreeGifts({ ...get(), onboarded: true }),
        activity: withActivity(s.activity, gifts.map((g) => act('unlock', { itemId: g }))),
      }));
      get().pushToast(`¡${get().worldName} ha nacido! 🌱`, 'success');
    },

    addMission: (m) => {
      const mission: Mission = { ...m, id: uid('m_'), createdAt: new Date().toISOString(), completions: [] };
      set((s) => ({ missions: [...s.missions, mission] }));
      get().pushToast('Misión añadida a tu mundo.', 'success');
    },

    updateMission: (id, patch) =>
      set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

    deleteMission: (id) => {
      set((s) => ({ missions: s.missions.filter((m) => m.id !== id) }));
      get().pushToast('Misión eliminada.', 'info');
    },

    completeMission: (id) => {
      const s = get();
      const m = s.missions.find((x) => x.id === id);
      if (!m) return false;
      const today = todayStr();
      if (isMissionDoneToday(m, today)) return false; // ya recompensada este periodo

      const updated: Mission =
        m.frequency === 'once'
          ? { ...m, doneOnce: true }
          : { ...m, completions: [...m.completions, today] };

      const newXp = s.xp + m.xp;
      const newSeeds = s.seeds + m.seeds;
      const oldLevel = s.level;
      const newLevel = Math.min(levelForXp(newXp), 5);

      let unlockedItems = s.unlockedItems;
      let placements = s.placements;
      let levelUpEvent: LevelUpEvent | null = null;

      if (newLevel > oldLevel) {
        // regalos automáticos del nuevo nivel
        const gifts = freeItemsForLevel(newLevel).filter((g) => !unlockedItems.includes(g));
        unlockedItems = [...unlockedItems, ...gifts];
        const draft: WorldState = { ...get(), level: newLevel, placements };
        placements = autoPlaceFreeGifts(draft);
        levelUpEvent = {
          level: newLevel,
          rewards: gifts.map((g) => itemById(g)?.name ?? g),
        };
      }

      const newActivity = withActivity(s.activity, [
        act('complete', { missionTitle: m.title }),
        ...(newLevel > oldLevel ? [act('levelup', { level: newLevel })] : []),
        ...(newLevel > oldLevel
          ? freeItemsForLevel(newLevel).filter((g) => !s.unlockedItems.includes(g)).map((g) => act('unlock', { itemId: g }))
          : []),
      ]);

      // racha: si hoy no contaba todavía, +1
      const alreadyToday = s.missions.some(
        (x) => x.id !== id && (x.completions.includes(today) || (x.frequency === 'once' && x.doneOnce)),
      );
      const streakDays = alreadyToday ? s.streakDays : s.streakDays + 1;

      set({
        missions: s.missions.map((x) => (x.id === id ? updated : x)),
        xp: newXp,
        seeds: newSeeds,
        level: newLevel,
        unlockedItems,
        placements,
        streakDays,
        activity: newActivity,
        lastVisit: today,
        celebrateKey: s.celebrateKey + 1,
        levelUpEvent: levelUpEvent ?? s.levelUpEvent,
      });

      if (!levelUpEvent) {
        get().pushToast(`+${m.xp} XP · +${m.seeds} semillas ✨`, 'success');
      }
      return true;
    },

    undoComplete: (id) => {
      const s = get();
      const m = s.missions.find((x) => x.id === id);
      if (!m) return;
      const today = todayStr();
      if (!isMissionDoneToday(m, today)) return;
      const revert: Mission =
        m.frequency === 'once'
          ? { ...m, doneOnce: false }
          : { ...m, completions: m.completions.filter((c) => c !== today) };
      set({
        missions: s.missions.map((x) => (x.id === id ? revert : x)),
        xp: Math.max(0, s.xp - m.xp),
        seeds: Math.max(0, s.seeds - m.seeds), // se retiran también las semillas ganadas
      });
      // Recalcular nivel (sin quitar regalos ya obtenidos: el nivel solo baja el indicador)
      set({ level: levelForXp(get().xp) });
      get().pushToast('Completado deshecho.', 'info');
    },

    buyItem: (itemId) => {
      const s = get();
      const item = itemById(itemId);
      if (!item) return false;
      if (s.unlockedItems.includes(itemId)) return true;
      if ((item.unlockLevel ?? 1) > s.level) {
        get().pushToast(`Necesitas el Nivel ${item.unlockLevel} para esto.`, 'error');
        return false;
      }
      if (s.seeds < item.cost) {
        get().pushToast('No tienes suficientes semillas todavía.', 'error');
        return false;
      }
      set({ seeds: s.seeds - item.cost, unlockedItems: [...s.unlockedItems, itemId], activity: withActivity(s.activity, [act('unlock', { itemId })]) });
      get().pushToast(`${item.name} añadido a tu colección.`, 'success');
      return true;
    },

    placeItem: (itemId, slot) => {
      const s = get();
      const item = itemById(itemId);
      if (!item) return false;
      if (!s.unlockedItems.includes(itemId)) return false;
      if (slot < 0 || slot >= ISLAND_SLOTS) return false;
      if (s.placements.some((p) => p.slot === slot)) {
        get().pushToast('Ese hueco ya está ocupado. Prueba otro.', 'error');
        return false;
      }
      const placed: PlacedItem = {
        instanceId: uid('p_'), itemId, slot, rotation: 0, placedAt: new Date().toISOString(),
      };
      set({ placements: [...s.placements, placed], placingItemId: null, selectedSlot: null, selectedInstanceId: placed.instanceId });
      get().pushToast(`${item.name} colocado en la isla.`, 'success');
      return true;
    },

    movePlacement: (instanceId, slot) => {
      const s = get();
      if (s.placements.some((p) => p.slot === slot && p.instanceId !== instanceId)) return;
      set({
        placements: s.placements.map((p) => (p.instanceId === instanceId ? { ...p, slot } : p)),
      });
    },

    rotatePlacement: (instanceId) =>
      set((s) => ({
        placements: s.placements.map((p) =>
          p.instanceId === instanceId ? { ...p, rotation: (p.rotation + Math.PI / 4) % (Math.PI * 2) } : p,
        ),
      })),

    removePlacement: (instanceId) => {
      const p = get().placements.find((x) => x.instanceId === instanceId);
      set((s) => ({
        placements: s.placements.filter((x) => x.instanceId !== instanceId),
        selectedSlot: null,
        selectedInstanceId: null,
      }));
      if (p) {
        const item = itemById(p.itemId);
        // devolver una pequeña parte de la inversión: 0 semillas, pero re-coleccionable
        get().pushToast(`${item?.name ?? 'Objeto'} retirado de la isla.`, 'info');
      }
    },

    setDecorateMode: (on) => set({ decorateMode: on, placingItemId: null, selectedSlot: null, selectedInstanceId: null }),
    setPlacingItem: (itemId) => set({ placingItemId: itemId, selectedInstanceId: null }),
    selectSlot: (slot) => set({ selectedSlot: slot, selectedInstanceId: null }),

    unlockBiome: (biomeId) => {
      const s = get();
      const b = biomeById(biomeId);
      if (s.unlockedBiomes.includes(biomeId)) return true;
      if (s.level < b.unlockLevel) {
        get().pushToast(`Alcanza el Nivel ${b.unlockLevel} para revelar ${b.name}.`, 'error');
        return false;
      }
      if (s.seeds < b.cost) {
        get().pushToast(`Faltan semillas para ${b.name} (necesitas ${b.cost}).`, 'error');
        return false;
      }
      set({ seeds: s.seeds - b.cost, unlockedBiomes: [...s.unlockedBiomes, biomeId], activeBiome: biomeId, activity: withActivity(s.activity, [act('biome', { biomeId })]) });
      get().pushToast(`${b.name} se ha abierto ante ti. ☁️`, 'success');
      return true;
    },

    setActiveBiome: (id) => {
      if (!get().unlockedBiomes.includes(id)) return;
      set({ activeBiome: id });
    },

    addJournal: async (e, imageBlob) => {
      const entry: JournalEntry = { ...e, id: uid('j_'), createdAt: new Date().toISOString() };
      if (imageBlob) {
        await saveImage(entry.id, imageBlob);
        entry.imageId = entry.id;
      }
      set((s) => ({ journal: [entry, ...s.journal] }));
      get().pushToast('Recuerdo guardado en tu diario.', 'success');
    },

    deleteJournal: async (id) => {
      const s = get();
      const e = s.journal.find((x) => x.id === id);
      if (e?.imageId) await deleteImage(e.imageId).catch(() => undefined);
      set({ journal: s.journal.filter((x) => x.id !== id) });
      get().pushToast('Entrada eliminada.', 'info');
    },

    toggleSetting: (key) => {
      set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } }));
    },

    loadDemo: () => {
      const s = get();
      if (s.demoLoaded) return;
      const now = new Date().toISOString();
      const d = (daysAgo: number) => {
        const dt = new Date();
        dt.setDate(dt.getDate() - daysAgo);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      };
      const demoMissions: Mission[] = [
        { id: uid('m_'), title: 'Leer 20 minutos', description: 'Un capítulo pequeñito cada día.', category: 'learning', frequency: 'daily', target: 20, xp: 25, seeds: 3, createdAt: now, completions: [d(3), d(2), d(1)], demo: true },
        { id: uid('m_'), title: 'Dibujar algo bonito', description: 'Solo garabatos con cariño.', category: 'creativity', frequency: 'daily', xp: 20, seeds: 2, createdAt: now, completions: [d(2)], demo: true },
        { id: uid('m_'), title: 'Paseo de la tarde', category: 'movement', frequency: 'daily', xp: 15, seeds: 2, createdAt: now, completions: [], demo: true },
        { id: uid('m_'), title: 'Ordenar mi escritorio', category: 'organization', frequency: 'weekly', xp: 30, seeds: 4, createdAt: now, completions: [d(5)], demo: true },
        { id: uid('m_'), title: 'Terminar el tutorial de 3D', description: 'Un paso final y a volar.', category: 'projects', frequency: 'once', xp: 60, seeds: 8, createdAt: now, completions: [], demo: true },
      ];
      const demoXp = s.xp + 300;
      const demoLevel = Math.min(levelForXp(demoXp), 5);
      const gifts = freeItemsForLevel(demoLevel).filter((g) => !s.unlockedItems.includes(g));
      const draft: WorldState = {
        ...get(),
        xp: demoXp,
        level: demoLevel,
        seeds: s.seeds + 25,
        unlockedItems: [...s.unlockedItems, ...gifts, 'mushroom_classic', 'tree_pink', 'animal_bird'],
        missions: [...s.missions, ...demoMissions],
        journal: [
          { id: uid('j_'), title: 'El día que planté mi primera flor', text: 'Hoy completé mis dos primeras misiones y apareció una margaridita nueva en la isla. Es ridículo lo feliz que me ha hecho.', date: d(2), mood: 'happy', createdAt: now },
          ...get().journal,
        ],
        demoLoaded: true,
      };
      const demoActs: ActivityEvent[] = [
        act('levelup', { level: demoLevel }),
        ...gifts.map((g) => act('unlock', { itemId: g })),
        ...['mushroom_classic', 'tree_pink', 'animal_bird'].map((g) => act('unlock', { itemId: g })),
      ];
      draft.activity = withActivity(get().activity, demoActs);
      set({ ...draft, placements: autoPlaceFreeGifts(draft) });
      get().pushToast('Datos de demostración cargados. Puedes eliminarlos cuando quieras.', 'info');
    },

    clearDemo: () => {
      const s = get();
      const removedMissions = s.missions.filter((m) => m.demo);
      const removedXp = removedMissions.reduce((acc, m) => acc + m.completions.length * m.xp + (m.doneOnce ? m.xp : 0), 0);
      const newXp = Math.max(0, s.xp - removedXp);
      set({
        missions: s.missions.filter((m) => !m.demo),
        xp: newXp,
        level: levelForXp(newXp),
        journal: s.journal.filter((j) => !j.title.startsWith('El día que planté')),
        demoLoaded: false,
      });
      get().pushToast('Ejemplos eliminados. Tu mundo sigue aquí.', 'info');
    },

    resetAll: () => {
      set({ ...initialState(), ready: true, onboarded: false });
      void saveState(null);
    },

    reloadFromBackup: (state) => {
      set({ ...state, ready: true, decorateMode: false, selectedSlot: null, selectedInstanceId: null, placingItemId: null });
      get().pushToast('Copia importada con éxito.', 'success');
    },

    clearLevelUp: () => set({ levelUpEvent: null }),

    dismissLevelUp: () => set({ levelUpEvent: null }),

    /** Guarda inmediatamente (sin esperar al debounce) — usado antes de exportar copia. */
    flushPersist: async () => {
      if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
      const s = get();
      await saveState(snapshot(s));
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(s.settings));
      } catch { /* ignore */ }
    },
  })),
);

function starterTitle(cat: CategoryId): string {
  switch (cat) {
    case 'creativity': return 'Crear algo, aunque sea pequeño';
    case 'learning': return 'Aprender 15 minutos de algo nuevo';
    case 'movement': return 'Moverme un ratito (estirar o caminar)';
    case 'projects': return 'Avanzar un paso en mi proyecto';
    case 'organization': return 'Ordenar un pequeño rincón';
    case 'wellness': return 'Descanso consciente de 10 minutos';
    default: return 'Mi pequeña misión diaria';
  }
}

// Persistencia automática ante cualquier cambio relevante
useWorld.subscribe(
  (s) => [s.xp, s.seeds, s.level, s.missions, s.placements, s.unlockedItems, s.unlockedBiomes, s.journal, s.settings, s.onboarded, s.worldName, s.demoLoaded, s.activeBiome, s.streakDays] as const,
  () => schedulePersist(get),
);

function get() {
  return useWorld.getState();
}

// utilidades derivadas exportadas
export function progressThisWeek(missions: Mission[]): number {
  const today = todayStr();
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const monStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  let total = 0;
  let done = 0;
  for (const m of missions) {
    if (m.frequency === 'once') { total += 1; if (m.doneOnce) done += 1; continue; }
    if (m.frequency === 'daily') {
      total += 7;
      done += m.completions.filter((c) => c >= monStr && c <= today).length;
    } else {
      total += 1;
      done += m.completions.some((c) => c >= monStr && c <= today) ? 1 : 0;
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export { xpRangeForLevel };
