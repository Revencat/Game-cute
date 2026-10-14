/**
 * Vista principal: MY LITTLE WORLD. Cabecera compacta, escenario 3D protagonista,
 * paneles laterales suaves con misiones del día, progreso y resumen.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Leaf, PencilRuler, RotateCcw, Settings, Sparkles, Undo2 } from 'lucide-react';
import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import { GARDEN_PHRASES, categoryOf } from '../data/catalog';
import { LEVEL_NAMES, todayStr, isMissionDoneToday, xpRangeForLevel } from '../lib/types';
import { progressThisWeek, useWorld } from '../state/worldStore';
import MissionFormModal from './MissionFormModal';
import { Modal, ProgressBar, SeedIcon, XpBadge } from './ui';
import WorldScene, { supportsWebGL } from './world/WorldScene';

export default function WorldView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const s = useWorld();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [missionModal, setMissionModal] = useState(false);

  const today = todayStr();
  const pending = s.missions.filter((m) => !isMissionDoneToday(m, today));
  const doneToday = s.missions.filter((m) => isMissionDoneToday(m, today));
  const dayPct = s.missions.length === 0 ? 0 : Math.round((doneToday.length / s.missions.length) * 100);

  const phrase = useMemo(
    () => GARDEN_PHRASES[(s.level - 1 + doneToday.length) % GARDEN_PHRASES.length],
    [s.level, doneToday.length],
  );

  const [from, to] = xpRangeForLevel(s.level);
  const xpInLevel = to <= from ? 100 : Math.min(100, Math.max(0, ((s.xp - from) / (to - from)) * 100));

  // sonido opcional y discreto al completar (nunca suena solo: requiere activarlo en Ajustes)
  useEffect(() => {
    if (!s.settings.soundEnabled || s.celebrateKey === 0) return;
    try {
      const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.5);
      setTimeout(() => ctx.close(), 800);
    } catch { /* silencio si el navegador no lo permite */ }
  }, [s.celebrateKey, s.settings.soundEnabled]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 p-4">
      {/* ── Cabecera ── */}
      <header className="lg:hidden">
        <CompactHeader onSettings={() => setSettingsOpen(true)} />
      </header>

      {/* ── Escenario central ── */}
      <main className="relative flex-1 min-h-[46vh] lg:min-h-0 rounded-card overflow-hidden shadow-soft border border-soft bg-sky">
        <IslandStage />

        {/* frase superior */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none w-max max-w-[92%]">
          <AnimatePresence mode="wait">
            <motion.p
              key={phrase}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-4 py-1.5 rounded-pill surface/90 backdrop-blur-sm text-sm font-bold text-main shadow-soft text-center"
            >
              {phrase}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* controles flotantes */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <button
            onClick={() => useWorld.getState().setDecorateMode(true)}
            className="btn-small surface shadow-lift !px-3" aria-label="Ir a decorar la isla" title="Decorar la isla"
          >
            <PencilRuler size={16} className="text-forest" />
          </button>
          <button
            onClick={() => onNavigate('quests')}
            className="btn-small surface shadow-lift !px-3" aria-label="Ver misiones del día" title="Misiones de hoy"
          >
            <Sparkles size={16} className="text-forest" />
          </button>
        </div>

        {/* hint de decoración activa */}
        <AnimatePresence>
          {s.decorateMode && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="absolute bottom-3 left-3 right-20 sm:right-3 mx-auto w-fit max-w-full"
            >
              <button onClick={() => useWorld.getState().setDecorateMode(false)} className="btn-small bg-forest text-ivory shadow-lift">
                <Check size={15} /> Salir de decoración (los cambios se guardan solos)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Panel lateral derecho (desktop) ── */}
      <aside className="hidden lg:flex flex-col gap-4 w-[340px] shrink-0 min-h-0">
        <StatusCard xpInLevel={xpInLevel} />
        <DayPanel pending={pending} doneToday={doneToday} dayPct={dayPct} onNewMission={() => setMissionModal(true)} />
        <MiniStats onNavigate={onNavigate} weekPct={progressThisWeek(s.missions)} />
      </aside>

      {/* ── Columna inferior en móvil/tablet ── */}
      <div className="lg:hidden space-y-4 pb-24 overflow-y-auto">
        <StatusCard xpInLevel={xpInLevel} />
        <DayPanel pending={pending} doneToday={doneToday} dayPct={dayPct} onNewMission={() => setMissionModal(true)} />
      </div>

      <MissionFormModal open={missionModal} onClose={() => setMissionModal(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

// ── Cabecera compacta (solo móvil aquí; en desktop vive en App) ──────
function CompactHeader({ onSettings }: { onSettings: () => void }) {
  const worldName = useWorld((s) => s.worldName);
  const level = useWorld((s) => s.level);
  return (
    <div className="card px-4 py-3 mb-3 flex items-center gap-3">
      <img src="/sprout.svg" alt="" className="w-9 h-9" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg text-main truncate">{worldName}</p>
        <p className="text-xs text-sub font-bold">Nivel {level} · {LEVEL_NAMES[level]}</p>
      </div>
      <button onClick={onSettings} className="btn-ghost !px-2 !min-h-[40px]" aria-label="Ajustes"><Settings size={17} /></button>
    </div>
  );
}

// ── Tarjeta de nivel/XP ──────────────────────────────────────────────
function StatusCard({ xpInLevel }: { xpInLevel: number }) {
  const level = useWorld((s) => s.level);
  const xp = useWorld((s) => s.xp);
  const seeds = useWorld((s) => s.seeds);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-butter grid place-items-center font-display text-xl text-ink shadow-soft" aria-hidden>
            {level}
          </div>
          <div>
            <p className="font-display text-main leading-tight">{LEVEL_NAMES[level]}</p>
            <p className="text-xs text-sub font-bold">{xp} XP totales</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-mint text-forest text-sm font-extrabold">
          <SeedIcon size={14} /> {seeds}
        </span>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-bold text-sub mb-1">
          <span>Progreso hacia el Nivel {Math.min(level + 1, 5)}</span>
          {level >= 5 && <span className="text-forest">¡Paraíso alcanzado ✨</span>}
        </div>
        <ProgressBar value={level >= 5 ? 100 : xpInLevel} label="Experiencia hacia el siguiente nivel" />
      </div>
    </div>
  );
}

// ── Misiones del día dentro del mundo ────────────────────────────────
function DayPanel({ pending, doneToday, dayPct, onNewMission }: {
  pending: ReturnType<typeof useWorld.getState>['missions'];
  doneToday: ReturnType<typeof useWorld.getState>['missions'];
  dayPct: number;
  onNewMission: () => void;
}) {
  const completeMission = useWorld((s) => s.completeMission);
  const undoComplete = useWorld((s) => s.undoComplete);

  return (
    <div className="card p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-main">Hoy en tu mundo</h2>
        <button onClick={onNewMission} className="btn-small btn-secondary !px-2.5" aria-label="Nueva misión">+ Misión</button>
      </div>
      <div className="mt-2 mb-3">
        <ProgressBar value={dayPct} color="#8BD8D0" height={8} label={`Progreso del día ${dayPct}%`} />
        <p className="text-[11px] text-sub font-bold mt-1">{dayPct}% completado</p>
      </div>

      <div className="space-y-2 overflow-y-auto min-h-0 max-h-[260px] pr-1">
        <AnimatePresence initial={false}>
          {pending.slice(0, 6).map((m) => {
            const cat = categoryOf(m.category);
            return (
              <motion.div
                key={m.id} layout
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2.5 rounded-panel surface-2 border border-soft px-3 py-2"
              >
                <button
                  onClick={() => completeMission(m.id)}
                  aria-label={`Completar ${m.title}`}
                  className="w-7 h-7 shrink-0 rounded-full border-2 grid place-items-center transition-all hover:scale-110 active:scale-95"
                  style={{ borderColor: cat.color, background: `${cat.color}18` }}
                >
                  <Check size={14} style={{ color: cat.color }} strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-main truncate">{m.title}</p>
                  <p className="text-[11px] font-bold" style={{ color: cat.color }}>{cat.label}</p>
                </div>
                <XpBadge xp={m.xp} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {doneToday.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 rounded-panel surface-2 px-3 py-2 opacity-70">
            <span className="w-7 h-7 shrink-0 rounded-full bg-forest grid place-items-center"><Check size={14} className="text-ivory" strokeWidth={3} /></span>
            <p className="text-sm font-bold text-sub line-through flex-1 truncate">{m.title}</p>
            <button onClick={() => undoComplete(m.id)} className="btn-ghost !min-h-[30px] !px-1.5" aria-label={`Deshacer ${m.title}`} title="Deshacer">
              <Undo2 size={14} />
            </button>
          </div>
        ))}

        {pending.length === 0 && doneToday.length === 0 && (
          <div className="text-center py-5">
            <Leaf className="mx-auto text-turquoise mb-1.5" size={26} />
            <p className="text-sm text-sub font-bold">Todo tranquilo por aquí.</p>
            <p className="text-xs text-sub mt-0.5">¿Plantamos una nueva idea?</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mini estadísticas + acceso ───────────────────────────────────────
function MiniStats({ onNavigate, weekPct }: { onNavigate: (v: string) => void; weekPct: number }) {
  const unlocked = useWorld((s) => s.unlockedItems.length);
  const placements = useWorld((s) => s.placements.length);
  return (
    <div className="card p-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div><p className="font-display text-xl text-forest">{unlocked}</p><p className="text-[11px] font-bold text-sub">objetos</p></div>
        <div><p className="font-display text-xl text-forest">{placements}</p><p className="text-[11px] font-bold text-sub">en la isla</p></div>
        <div><p className="font-display text-xl text-forest">{weekPct}%</p><p className="text-[11px] font-bold text-sub">de la semana</p></div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onNavigate('collection')} className="btn-small btn-secondary flex-1">Mi colección</button>
        <button onClick={() => onNavigate('journal')} className="btn-small btn-ghost flex-1">Diario</button>
      </div>
    </div>
  );
}

// ── Modal de ajustes ────────────────────────────────────────────────
export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useWorld((s) => s.settings);
  const toggleSetting = useWorld((s) => s.toggleSetting);
  const loadDemo = useWorld((s) => s.loadDemo);
  const clearDemo = useWorld((s) => s.clearDemo);
  const demoLoaded = useWorld((s) => s.demoLoaded);
  const resetAll = useWorld((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Ajustes">
      <div className="space-y-3">
        <SettingRow
          label="Reducir animaciones" desc="Además del ajuste del sistema."
          checked={settings.reduceMotion} onToggle={() => toggleSetting('reduceMotion')}
        />
        <SettingRow
          label="Modo oscuro" desc="Verdes profundos y crema suave para la noche."
          checked={settings.darkMode} onToggle={() => toggleSetting('darkMode')}
        />
        <SettingRow
          label="Sonidos suaves" desc="Un campanita al completar misiones. Nunca suena solo."
          checked={settings.soundEnabled} onToggle={() => toggleSetting('soundEnabled')}
        />

        <hr className="border-soft" />

        <div className="flex flex-wrap gap-2">
          {!demoLoaded ? (
            <button onClick={loadDemo} className="btn-small btn-secondary"><Sparkles size={14} /> Cargar ejemplos</button>
          ) : (
            <button onClick={clearDemo} className="btn-small btn-ghost"><RotateCcw size={14} /> Quitar ejemplos</button>
          )}
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="btn-small btn-ghost text-[#C96A6A]">Reiniciar todo</button>
          ) : (
            <div className="flex gap-2 items-center">
              <span className="text-xs font-bold text-[#C96A6A]">¿Seguro? Se borra tu mundo.</span>
              <button onClick={() => { resetAll(); setConfirmReset(false); onClose(); }} className="btn-small bg-[#C96A6A] text-ivory">Sí, reiniciar</button>
              <button onClick={() => setConfirmReset(false)} className="btn-small btn-ghost">No</button>
            </div>
          )}
        </div>
        <p className="text-[11px] text-sub">
          Little World guarda todo en tu navegador (IndexedDB). Sin cuentas, sin nube. Usa «Exportar copia» en Ajustes de la cabecera para guardar tu mundo en un archivo.
        </p>
      </div>
    </Modal>
  );
}

function SettingRow({ label, desc, checked, onToggle }: { label: string; desc: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={checked} className="w-full flex items-center justify-between gap-3 text-left rounded-panel surface-2 border border-soft px-4 py-3">
      <span>
        <span className="block text-sm font-bold text-main">{label}</span>
        <span className="block text-xs text-sub">{desc}</span>
      </span>
      <span className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-forest' : 'bg-mint'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

// ── El escenario en sí (se comparte con Decorate) ───────────────────
export function IslandStage() {
  const celebrateKey = useWorld((s) => s.celebrateKey);
  const webgl = useMemo(() => supportsWebGL(), []);

  if (!webgl) return <StaticIslandFallback />;

  return (
    <div className="absolute inset-0">
      <ErrorBoundary3D fallback={<StaticIslandFallback />}>
        <WorldScene celebrateKey={celebrateKey} />
      </ErrorBoundary3D>
    </div>
  );
}

class ErrorBoundary3D extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn('[world] WebGL falló:', err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

// Fallback ilustrado cuando no hay WebGL
export function StaticIslandFallback() {
  const level = useWorld((s) => s.level);
  const ground = '#91C987';
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky via-cream to-mint grid place-items-center p-6">
      <div className="text-center max-w-sm">
        <svg viewBox="0 0 300 220" className="w-full max-w-[280px] mx-auto floaty" aria-label="Ilustración de tu isla">
          <ellipse cx="150" cy="150" rx="95" ry="26" fill={ground} />
          <path d="M70 152 Q150 190 230 152 L200 196 Q150 216 100 196 Z" fill="#A87C5F" />
          <path d="M100 196 Q150 216 200 196 L165 218 Q150 226 135 218 Z" fill="#8B6A52" />
          <rect x="118" y="96" width="9" height="34" rx="4" fill="#9A7054" />
          <circle cx="122" cy="86" r="26" fill="#527D59" />
          <circle cx="196" cy="132" r="9" fill="#F5B8CA" />
          <circle cx="182" cy="140" r="7" fill="#F5DF91" />
          <circle cx="208" cy="141" r="6" fill="#D1C5F2" />
          <ellipse cx="150" cy="146" rx="60" ry="10" fill="#BDE6F5" opacity="0.5" />
          {[...Array(Math.min(level, 5))].map((_, i) => (
            <circle key={i} cx={60 + i * 45} cy={40 + (i % 2) * 14} r={10 + (i % 3) * 3} fill="#FFFEFA" opacity="0.85" />
          ))}
        </svg>
        <h3 className="font-display text-lg text-main mt-3">Tu isla en modo ilustrado</h3>
        <p className="text-sm text-sub mt-1">
          Tu dispositivo no pudo iniciar la vista 3D, pero tu jardín sigue creciendo igual: completa misiones desde «Hoy» y visita tu colección.
        </p>
      </div>
    </div>
  );
}
