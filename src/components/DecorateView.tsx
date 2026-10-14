/**
 * Vista DECORATE: el escenario toma protagonismo con una barra de inventario.
 * Colocar, mover (arrastrando a otra ranura), rotar y retirar decoraciones.
 * Los cambios se guardan automáticamente en IndexedDB.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CornerDownRight, Move, RotateCcw, Sprout, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CATALOG, itemById } from '../data/catalog';
import { ISLAND_SLOTS, useWorld } from '../state/worldStore';
import { SeedIcon } from './ui';
import { ItemThumbnail } from './world/Island';
import { IslandStage } from './WorldView';

export default function DecorateView() {
  const s = useWorld();
  const [movingInstanceId, setMovingInstanceId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // asegurar modo decoración activo al entrar (y salir al desmontar)
  useEffect(() => {
    if (!useWorld.getState().decorateMode) useWorld.getState().setDecorateMode(true);
    return () => { useWorld.getState().setDecorateMode(false); };
  }, []);

  // en modo "mover", el siguiente clic en una ranura libre reubica el objeto
  useEffect(() => {
    if (!movingInstanceId || s.selectedSlot === null) return;
    const st = useWorld.getState();
    const slot = s.selectedSlot;
    const occupied = st.placements.some((p) => p.slot === slot);
    if (!occupied) {
      st.movePlacement(movingInstanceId, slot);
      st.pushToast('Objeto movido de sitio.', 'success');
    } else {
      st.pushToast('Ese hueco ya está ocupado. Prueba otro.', 'error');
    }
    setMovingInstanceId(null);
  }, [movingInstanceId, s.selectedSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  // al elegir un objeto del inventario, ir a la primera ranura libre (funciona con teclado)
  const pickItem = (id: string) => {
    const st = useWorld.getState();
    if (st.placingItemId === id) { st.setPlacingItem(null); return; }
    const taken = new Set(st.placements.map((p) => p.slot));
    let free = -1;
    for (let i = 0; i < ISLAND_SLOTS; i++) if (!taken.has(i)) { free = i; break; }
    if (free < 0) { st.pushToast('La isla está llena: retira algo para colocar más.', 'error'); return; }
    st.placeItem(id, free);
  };

  const owned = CATALOG.filter(
    (i) => i.category !== 'biome' && s.unlockedItems.includes(i.id),
  );
  const usedCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of s.placements) map.set(p.itemId, (map.get(p.itemId) ?? 0) + 1);
    return map;
  }, [s.placements]);

  const selected = s.placements.find((p) => p.instanceId === s.selectedInstanceId) ?? null;
  const selectedItem = selected ? itemById(selected.itemId) : null;
  const freeSlots = ISLAND_SLOTS - s.placements.length;

  const exit = () => {
    s.setDecorateMode(false);
    setMovingInstanceId(null);
  };

  return (
    <div className="relative h-full">
      {/* Escenario protagonista */}
      <div className="absolute inset-0 lg:inset-y-4 lg:left-4 lg:right-[320px] rounded-card overflow-hidden border border-soft shadow-soft bg-sky">
        <IslandStage />

        {/* banda superior que distingue el modo edición */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <motion.p
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 py-1.5 rounded-pill bg-forest/90 text-ivory text-sm font-bold shadow-lift"
          >
            Modo decoración · toca una ranura brillante para colocar
          </motion.p>
        </div>

        {/* panel de objeto seleccionado sobre la isla */}
        <AnimatePresence>
          {selected && selectedItem && !movingInstanceId && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 surface rounded-card shadow-lift p-3 flex items-center gap-2"
            >
              <span className="text-sm font-extrabold text-main pr-1">{selectedItem.name}</span>
              <button
                onClick={() => s.rotatePlacement(selected.instanceId)}
                className="btn-small btn-secondary !min-h-[38px] !px-2.5" aria-label="Rotar objeto"
              >
                <RotateCcw size={15} /> Rotar
              </button>
              <button
                onClick={() => setMovingInstanceId(selected.instanceId)}
                className="btn-small btn-secondary !min-h-[38px] !px-2.5" aria-label="Mover de sitio"
              >
                <Move size={15} /> Mover
              </button>
              {confirmRemove !== selected.instanceId ? (
                <button
                  onClick={() => setConfirmRemove(selected.instanceId)}
                  className="btn-small !min-h-[38px] !px-2.5 bg-[#FBE3EB] text-[#B25667] hover:bg-[#F7D2DE]" aria-label="Quitar de la isla"
                >
                  <X size={15} /> Quitar
                </button>
              ) : (
                <span className="flex gap-1.5 items-center">
                  <span className="text-xs font-bold text-[#B25667]">¿Quitarlo?</span>
                  <button
                    onClick={() => { s.removePlacement(selected.instanceId); setConfirmRemove(null); }}
                    className="btn-small bg-[#C96A6A] text-ivory !min-h-[38px] !px-2.5"
                  >Sí</button>
                  <button onClick={() => setConfirmRemove(null)} className="btn-small btn-ghost !min-h-[38px] !px-2.5">No</button>
                </span>
              )}
            </motion.div>
          )}

          {movingInstanceId && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 surface rounded-card shadow-lift px-4 py-2.5 flex items-center gap-2"
            >
              <CornerDownRight size={16} className="text-forest" />
              <p className="text-sm font-bold text-main">Toca una ranura libre para mover ahí el objeto.</p>
              <button onClick={() => setMovingInstanceId(null)} className="btn-small btn-ghost !min-h-[34px] !px-2">Cancelar</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barra lateral de inventario (desktop) */}
      <aside className="hidden lg:flex flex-col absolute top-4 right-4 bottom-4 w-[300px] card p-4 min-h-0">
        <InventaryPanel
          owned={owned}
          usedCounts={usedCounts}
          placingItemId={s.placingItemId}
          freeSlots={freeSlots}
          onPick={pickItem}
        />
        <div className="mt-auto pt-3 space-y-2">
          <p className="text-[11px] text-sub leading-snug">
            Toca un objeto para colocarlo en el primer hueco libre; luego muévelo o rótalo seleccionándolo en la isla. Todo se guarda solo.
          </p>
          <button onClick={exit} className="btn-primary w-full"><Check size={16} /> Terminar decoración</button>
        </div>
      </aside>

      {/* Tira inferior de inventario (móvil/tablet) */}
      <div className="lg:hidden absolute bottom-0 inset-x-0 surface border-t border-soft shadow-[0_-6px_24px_rgba(53,72,59,.10)] rounded-t-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-h-[46dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-main">Inventario · {freeSlots} huecos libres</h2>
          <button onClick={exit} className="btn-small btn-primary !min-h-[38px]">Listo</button>
        </div>
        {s.placingItemId && (
          <p className="text-xs font-bold text-forest mb-2">
            Colocando «{itemById(s.placingItemId)?.name}» — toca una ranura en la isla.
            <button className="underline ml-2" onClick={() => s.setPlacingItem(null)}>Cancelar</button>
          </p>
        )}
        <InventoryStrip
          owned={owned}
          usedCounts={usedCounts}
          placingItemId={s.placingItemId}
          onPick={pickItem}
        />
      </div>
    </div>
  );
}

// ── Panel vertical (desktop) ─────────────────────────────────────────
function InventaryPanel({ owned, usedCounts, placingItemId, freeSlots, onPick }: {
  owned: ReturnType<typeof CATALOG.filter>;
  usedCounts: Map<string, number>;
  placingItemId: string | null;
  freeSlots: number;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <h2 className="font-display text-main flex items-center gap-2">
        <Sprout size={17} className="text-forest" /> Inventario
      </h2>
      <p className="text-xs text-sub font-bold mt-0.5 mb-3">
        {freeSlots <= 0 ? 'Isla llena: retira algo para colocar más.' : `${freeSlots} huecos libres en la isla.`}
      </p>
      <div className="grid grid-cols-3 gap-2 overflow-y-auto min-h-0 pr-1">
        {owned.map((item) => {
          const active = placingItemId === item.id;
          const used = usedCounts.get(item.id) ?? 0;
          return (
            <button
              key={item.id}
              onClick={() => onPick(item.id)}
              aria-pressed={active}
              title={item.name}
              className={`rounded-panel border-2 p-1.5 transition-all relative ${
                active ? 'border-forest bg-mint shadow-soft -translate-y-0.5' : 'border-soft surface-2 hover:border-turquoise'
              }`}
            >
              <div className="aspect-square grid place-items-center">
                <ItemThumbnail itemId={item.id} size={64} />
              </div>
              <p className="text-[10px] font-bold text-main leading-tight mt-1 truncate">{item.name}</p>
              {used > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-forest text-ivory text-[10px] font-extrabold grid place-items-center">
                  ×{used}
                </span>
              )}
            </button>
          );
        })}
        {owned.length === 0 && (
          <p className="col-span-3 text-sm text-sub text-center py-6">
            Aún no tienes objetos. Gana semillas ({' '}<SeedIcon size={12} className="inline" />{' '}) completando misiones o sube de nivel para recibir regalos.
          </p>
        )}
      </div>
    </>
  );
}

// ── Tira horizontal (móvil) ──────────────────────────────────────────
function InventoryStrip({ owned, usedCounts, placingItemId, onPick }: {
  owned: ReturnType<typeof CATALOG.filter>;
  usedCounts: Map<string, number>;
  placingItemId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {owned.map((item) => {
        const active = placingItemId === item.id;
        const used = usedCounts.get(item.id) ?? 0;
        return (
          <button
            key={item.id}
            onClick={() => onPick(item.id)}
            aria-pressed={active}
            className={`shrink-0 w-[76px] rounded-panel border-2 p-1.5 relative transition-all ${
              active ? 'border-forest bg-mint' : 'border-soft surface-2'
            }`}
          >
            <div className="aspect-square grid place-items-center">
              <ItemThumbnail itemId={item.id} size={52} />
            </div>
            <p className="text-[10px] font-bold text-main leading-tight mt-0.5 truncate">{item.name}</p>
            {used > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-[18px] min-w-[18px] px-1 rounded-full bg-forest text-ivory text-[10px] font-extrabold grid place-items-center">
                ×{used}
              </span>
            )}
          </button>
        );
      })}
      {owned.length === 0 && <p className="text-sm text-sub py-3">Nada en el inventario todavía.</p>}
    </div>
  );
}
