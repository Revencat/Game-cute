/**
 * Vista DISCOVER: biomas desbloqueables con vistas previas ilustradas (SVG),
 * costes en semillas y requisitos de nivel. Activar un bioma cambia el cielo
 * y el suelo del mundo entero.
 */
import { motion } from 'framer-motion';
import { Check, Compass, MapPin } from 'lucide-react';
import { BIOMES } from '../data/catalog';
import { LEVEL_NAMES } from '../lib/types';
import { useWorld } from '../state/worldStore';
import { EmptyState, SeedIcon } from './ui';

/** Miniatura SVG estilizada de cada bioma (sin WebGL, coherente con el arte). */
function BiomePreview({ sky, ground, accent }: { sky: string; ground: string; accent: string }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden>
      <rect width="160" height="100" fill={sky} rx="12" />
      {/* nubecitas */}
      <g fill="#FFFFFF" opacity="0.9">
        <ellipse cx="34" cy="20" rx="14" ry="6" />
        <ellipse cx="44" cy="17" rx="10" ry="5" />
        <ellipse cx="122" cy="28" rx="12" ry="5" />
      </g>
      {/* isla flotante */}
      <path d="M40 62 Q80 46 120 62 L104 82 Q80 92 56 82 Z" fill="#9A7054" />
      <path d="M40 62 Q80 46 120 62 Q100 72 80 71 Q60 72 40 62Z" fill={ground} />
      {/* arbolito */}
      <rect x="77" y="50" width="4" height="10" rx="2" fill="#9A7054" />
      <circle cx="79" cy="46" r="9" fill={ground} stroke={accent} strokeWidth="1.5" />
      {/* detalle de acento (flor / seta) */}
      <circle cx="60" cy="60" r="3.5" fill={accent} />
      <circle cx="98" cy="62" r="2.5" fill={accent} opacity="0.8" />
      {/* piedritas que flotan bajo la isla */}
      <circle cx="70" cy="90" r="2" fill="#B49B8A" />
      <circle cx="92" cy="94" r="1.5" fill="#B49B8A" />
    </svg>
  );
}

export default function DiscoverView() {
  const s = useWorld();

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5 pb-28 lg:pb-8">
        <header className="card p-5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-mint grid place-items-center shrink-0" aria-hidden>
              <Compass size={20} className="text-forest" />
            </span>
            <div>
              <h1 className="font-display text-2xl text-main leading-tight">Discover new worlds</h1>
              <p className="text-sm text-sub font-bold">
                Nuevas regiones para tu mundo. Cada bioma cambia el cielo, la tierra y lo que puede florecer aquí.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs font-bold text-sub">
            <span>🌍 {s.unlockedBiomes.length} de {BIOMES.length} revelados</span>
            <span className="inline-flex items-center gap-1"><SeedIcon size={12} /> {s.seeds} semillas disponibles</span>
            <span>Nivel actual: {s.level} · {LEVEL_NAMES[s.level]}</span>
          </div>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          {BIOMES.map((b, idx) => {
            const unlocked = s.unlockedBiomes.includes(b.id);
            const active = s.activeBiome === b.id;
            const levelOk = s.level >= b.unlockLevel;
            const seedsOk = s.seeds >= b.cost;
            return (
              <motion.article
                key={b.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className={`card overflow-hidden relative ${active ? 'ring-2 ring-forest' : ''}`}
              >
                <div className="h-32 p-2">
                  <BiomePreview sky={b.sky} ground={b.ground} accent={b.accent} />
                </div>
                <div className="p-4 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg text-main leading-tight">{b.name}</h2>
                      <p className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: b.accent }}>{b.tagline}</p>
                    </div>
                    {active && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-forest text-ivory text-[11px] font-extrabold shrink-0">
                        <MapPin size={11} /> Estás aquí
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-sub mt-1.5 leading-snug">{b.description}</p>

                  <div className="mt-3">
                    {!unlocked ? (
                      <>
                        {!levelOk ? (
                          <div className="rounded-panel surface-2 border border-soft px-3 py-2 text-xs font-bold text-sub">
                            🔒 Se revela al alcanzar el <b className="text-main">Nivel {b.unlockLevel}</b> ({LEVEL_NAMES[b.unlockLevel]}).
                          </div>
                        ) : (
                          <button
                            onClick={() => s.unlockBiome(b.id)}
                            disabled={!seedsOk}
                            className={`btn-small w-full ${seedsOk ? 'btn-primary' : 'btn-secondary opacity-60 cursor-not-allowed'}`}
                          >
                            Revelar · <SeedIcon size={14} /> {b.cost} semillas
                          </button>
                        )}
                        {!seedsOk && levelOk && (
                          <p className="text-[11px] font-bold text-[#B25667] mt-1.5">
                            Te faltan {b.cost - s.seeds} semillas. Completa misiones para ganar más.
                          </p>
                        )}
                      </>
                    ) : active ? (
                      <p className="text-xs font-bold text-forest inline-flex items-center gap-1">
                        <Check size={14} /> Este es tu mundo ahora mismo.
                      </p>
                    ) : (
                      <button onClick={() => s.setActiveBiome(b.id)} className="btn-small btn-secondary w-full">
                        Viajar aquí
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {s.unlockedBiomes.length === 1 && (
          <EmptyState
            title="Solo has pisado el prado"
            text="Sube de nivel completando misiones y ahorra semillas para revelar el Bosque de setas y otras regiones."
          />
        )}

        <p className="text-[11px] text-sub text-center">
          Los biomas son parte del mismo mundo: tus decoraciones te siguen a donde vayas.
        </p>
      </div>
    </div>
  );
}
