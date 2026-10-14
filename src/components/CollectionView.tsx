/**
 * Vista MY COLLECTION: catálogo con miniaturas 3D reales, filtros, rareza,
 * desbloqueables por nivel o semillas, novedades y colocación rápida.
 */
import { motion } from 'framer-motion';
import { Check, Lock, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATALOG, RARITY_COLOR, RARITY_LABEL, itemById } from '../data/catalog';
import type { CatalogItem, ItemCategory } from '../lib/types';
import { LEVEL_NAMES, todayStr } from '../lib/types';
import { useWorld } from '../state/worldStore';
import { Chip, Modal, SeedIcon } from './ui';
import { ItemThumbnail } from './world/Island';

const CAT_LABEL: Record<ItemCategory, string> = {
  trees: 'Árboles', flowers: 'Flores', plants: 'Plantas', rocks: 'Rocas',
  decor: 'Decoraciones', houses: 'Casitas', animals: 'Animales', magic: 'Mágicos', biome: 'Biomas',
};

type SortMode = 'default' | 'name' | 'cost';

const catOf = (i: CatalogItem): ItemCategory => i.category ?? 'decor';

export default function CollectionView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const s = useWorld();
  const [cat, setCat] = useState<ItemCategory | 'all'>('all');
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);
  const [sort, setSort] = useState<SortMode>('default');
  const [detail, setDetail] = useState<string | null>(null);

  const list = useMemo(() => {
    let items = CATALOG.filter((i) => i.category !== 'biome');
    if (cat !== 'all') items = items.filter((i) => i.category === cat);
    if (onlyUnlocked) items = items.filter((i) => s.unlockedItems.includes(i.id));
    if (sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'cost') items = [...items].sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
    return items;
  }, [cat, onlyUnlocked, sort, s.unlockedItems]);

  const recent = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;
    const seen = new Set<string>();
    const out: CatalogItem[] = [];
    for (const a of s.activity) {
      if (a.type !== 'unlock' || !a.itemId || seen.has(a.itemId)) continue;
      if (new Date(a.at).getTime() <= cutoff) continue;
      const it = itemById(a.itemId);
      if (!it) continue;
      seen.add(a.itemId);
      out.push(it);
      if (out.length >= 6) break;
    }
    return out;
  }, [s.activity]);

  const detailItem = detail ? itemById(detail) : null;
  const isUnlocked = detailItem ? s.unlockedItems.includes(detailItem.id) : false;

  const unlock = () => {
    if (!detailItem) return;
    if (detailItem.unlockBy === 'level') {
      s.pushToast(`«${detailItem.name}» se desbloquea al alcanzar el Nivel ${detailItem.unlockLevel}.`, 'info');
      return;
    }
    if (s.buyItem(detailItem.id)) setDetail(null);
  };

  const placeNow = () => {
    if (!detailItem || !isUnlocked) return;
    s.setPlacingItem(detailItem.id);
    s.setDecorateMode(true);
    setDetail(null);
    onNavigate('decorate');
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5 pb-28 lg:pb-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-main">My Collection</h1>
            <p className="text-sm text-sub font-bold">
              {s.unlockedItems.length} de {CATALOG.filter((i) => i.category !== 'biome').length} tesoros · Nivel {s.level} · {LEVEL_NAMES[s.level]}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-mint text-forest font-extrabold">
            <SeedIcon size={16} /> {s.seeds} semillas
          </span>
        </header>

        {/* novedades */}
        {recent.length > 0 && (
          <section className="card p-4" aria-label="Desbloqueos recientes">
            <h2 className="font-display text-main mb-2">Novedades de la semana</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {recent.map((it) => (
                <button key={it!.id} onClick={() => setDetail(it!.id)} className="shrink-0 flex flex-col items-center gap-1 group">
                  <div className="w-16 h-16 grid place-items-center surface-2 rounded-panel border border-soft group-hover:border-turquoise transition-colors">
                    <ItemThumbnail itemId={it!.id} size={60} />
                  </div>
                  <span className="text-[11px] font-bold text-sub">{it!.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* filtros */}
        <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Filtrar colección">
          <Chip color="#527D59" active={cat === 'all'} onClick={() => setCat('all')}>Todo</Chip>
          {(Object.keys(CAT_LABEL) as ItemCategory[]).filter((c) => c !== 'biome').map((c) => (
            <Chip key={c} color="#527D59" active={cat === c} onClick={() => setCat(c)}>{CAT_LABEL[c]}</Chip>
          ))}
          <span className="mx-1 text-soft" aria-hidden>·</span>
          <Chip color="#8BD8D0" active={onlyUnlocked} onClick={() => setOnlyUnlocked((v) => !v)}>Solo desbloqueados</Chip>
          <label className="ml-auto text-xs font-bold text-sub flex items-center gap-1.5">
            Orden
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="rounded-pill border-2 border-mint surface px-2 py-1 text-xs font-bold text-main">
              <option value="default">Por tipo</option>
              <option value="name">Alfabético</option>
              <option value="cost">Por coste</option>
            </select>
          </label>
        </div>

        {/* cuadrícula */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((item, idx) => {
            const unlocked = s.unlockedItems.includes(item.id);
            return (
              <motion.button
                key={item.id}
                layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                onClick={() => setDetail(item.id)}
                className={`card p-3 text-left relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift ${unlocked ? '' : 'opacity-75'}`}
                aria-label={`${item.name}, ${unlocked ? 'desbloqueado' : 'bloqueado'}`}
              >
                <div className="aspect-square grid place-items-center rounded-panel surface-2 mb-2 relative">
                  {unlocked ? (
                    <ItemThumbnail itemId={item.id} size={110} />
                  ) : (
                    <>
                      <div className="grayscale brightness-[.55] saturate-[.4]"><ItemThumbnail itemId={item.id} size={110} /></div>
                      <Lock size={18} className="absolute text-sub" aria-hidden />
                    </>
                  )}
                  <span
                    className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-white/60"
                    style={{ background: RARITY_COLOR[item.rarity] }}
                    title={`Rareza: ${RARITY_LABEL[item.rarity] ?? item.rarity}`}
                  />
                </div>
                <p className="font-bold text-sm text-main leading-tight">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-bold text-sub">{CAT_LABEL[catOf(item)]} · {RARITY_LABEL[item.rarity] ?? item.rarity}</span>
                  {unlocked ? (
                    <Check size={14} className="text-forest" aria-label="Desbloqueado" />
                  ) : item.unlockBy === 'level' ? (
                    <span className="text-[11px] font-extrabold text-butterbg bg-butter/40 text-[#8a6d1f] px-1.5 py-0.5 rounded-pill">Nv. {item.unlockLevel}</span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-forest"><SeedIcon size={11} /> {item.cost}</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {list.length === 0 && (
          <div className="card p-8 text-center">
            <RotateCcw size={26} className="mx-auto text-turquoise mb-2" />
            <p className="font-display text-main">Nada por aquí todavía</p>
            <p className="text-sm text-sub mt-1">Prueba con otra categoría o completa misiones para ganar semillas.</p>
          </div>
        )}
      </div>

      {/* detalle */}
      <Modal open={!!detailItem} onClose={() => setDetail(null)} title={detailItem?.name ?? ''}>
        {detailItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0 grid place-items-center rounded-card surface-2 border border-soft">
                <ItemThumbnail itemId={detailItem.id} size={120} />
              </div>
              <div>
                <p className="text-sm text-sub font-bold">{CAT_LABEL[catOf(detailItem)]} · <span style={{ color: RARITY_COLOR[detailItem.rarity] ?? '#718071' }}>{RARITY_LABEL[detailItem.rarity] ?? detailItem.rarity}</span></p>
                <p className="text-sm text-main mt-1">{detailItem.hint}</p>
              </div>
            </div>

            {!isUnlocked && (
              <div className="rounded-panel surface-2 border border-soft p-3 text-sm text-sub">
                {detailItem.unlockBy === 'level'
                  ? `🔒 Se desbloquea automáticamente al llegar al Nivel ${detailItem.unlockLevel} (${LEVEL_NAMES[detailItem.unlockLevel ?? 1]}). Sigue completando aventuras.`
                  : <>Cuesta <b className="text-main inline-flex items-center gap-1"><SeedIcon size={13} />{detailItem.cost} semillas</b>. Ganas semillas al completar misiones diarias y semanales.</>}
              </div>
            )}

            <div className="flex gap-2">
              {isUnlocked ? (
                <>
                  <button onClick={placeNow} className="btn-primary flex-1">Colocar en la isla</button>
                  <button onClick={() => { setDetail(null); onNavigate('decorate'); }} className="btn-secondary">Gestionar</button>
                </>
              ) : (
                <button onClick={unlock} className="btn-primary flex-1" disabled={detailItem.unlockBy === 'level' || s.seeds < (detailItem.cost ?? 0)}>
                  {detailItem.unlockBy === 'level' ? 'Bloqueado por nivel' : s.seeds < (detailItem.cost ?? 0) ? 'Semillas insuficientes' : <>Comprar · <SeedIcon size={14} /> {detailItem.cost}</>}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

