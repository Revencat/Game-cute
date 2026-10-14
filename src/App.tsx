/**
 * App de Little World: enrutado por vistas (sin router), cabecera desktop,
 * navegación inferior móvil, modales globales (nivel-up, ajustes, copia)
 * y efectos de arranque (WebGL, reduce motion, modo oscuro).
 */
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen, Compass, Download, PencilRuler, Settings, Share2, Sparkles, Sprout, Upload, X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LEVEL_NAMES, todayStr } from './lib/types';
import { exportBackup, importBackup, validateBackup } from './lib/storage';
import { useWorld } from './state/worldStore';
import CollectionView from './components/CollectionView';
import DecorateView from './components/DecorateView';
import DiscoverView from './components/DiscoverView';
import JournalView from './components/JournalView';
import Onboarding from './components/Onboarding';
import QuestsView from './components/QuestsView';
import WorldView, { SettingsModal } from './components/WorldView';
import { Modal, PetalBurst, Toasts } from './components/ui';
import { supportsWebGL } from './components/world/WorldScene';

type View = 'world' | 'quests' | 'collection' | 'discover' | 'journal' | 'decorate';

const NAV: { id: View; label: string; icon: typeof Sprout }[] = [
  { id: 'world', label: 'Mi mundo', icon: Sprout },
  { id: 'quests', label: 'Misiones', icon: Sparkles },
  { id: 'collection', label: 'Colección', icon: BookOpen },
  { id: 'discover', label: 'Descubrir', icon: Compass },
  { id: 'journal', label: 'Diario', icon: Share2 },
  { id: 'decorate', label: 'Decorar', icon: PencilRuler },
];

export default function App() {
  const s = useWorld();
  const [view, setView] = useState<View>('world');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const webgl = useMemo(() => supportsWebGL(), []);

  // carga inicial desde IndexedDB (una sola vez)
  useEffect(() => {
    if (!useWorld.getState().ready) void useWorld.getState().init();
  }, []);

  // preferencia de sistema → reduceMotion (el usuario puede sobreescribirla en Ajustes)
  useEffect(() => {
    if (!webgl) useWorld.getState().pushToast('Tu navegador no soporta 3D: verás tu isla ilustrada.', 'info');
  }, [webgl]);

  // clases globales: dark / reduce-motion
  useEffect(() => {
    document.documentElement.classList.toggle('dark', s.settings.darkMode);
    document.documentElement.classList.toggle('reduce-motion', s.settings.reduceMotion);
  }, [s.settings.darkMode, s.settings.reduceMotion]);

  if (!s.loaded) {
    return (
      <div className="h-full grid place-items-center bg-cream">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} className="text-center">
          <Sprout size={54} className="mx-auto text-forest" />
          <p className="font-display text-sub mt-2">Despertando tu jardín…</p>
        </motion.div>
      </div>
    );
  }

  if (!s.onboarded) return <><Onboarding /><Toasts /></>;

  const navigate = (v: string) => setView(v as View);

  return (
    <div className="h-full flex flex-col lg:flex-row max-w-[1400px] mx-auto">
      {/* ── Barra lateral desktop ── */}
      <nav className="hidden lg:flex flex-col w-[228px] shrink-0 p-4 gap-1 border-r border-soft" aria-label="Navegación principal">
        <div className="flex items-center gap-2.5 px-2 py-3 mb-2">
          <img src="/sprout.svg" alt="" className="w-9 h-9" />
          <div className="min-w-0">
            <p className="font-display text-lg text-main leading-tight truncate">{s.worldName}</p>
            <p className="text-[11px] font-bold text-sub">Nivel {s.level} · {LEVEL_NAMES[s.level]}</p>
          </div>
        </div>
        {NAV.map((n) => (
          <NavButton key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} />
        ))}
        <div className="mt-auto space-y-1">
          <button onClick={() => setBackupOpen(true)} className="btn-ghost w-full justify-start !min-h-[40px] text-sm">
            <Download size={15} /> Copia de seguridad
          </button>
          <button onClick={() => setSettingsOpen(true)} className="btn-ghost w-full justify-start !min-h-[40px] text-sm">
            <Settings size={15} /> Ajustes
          </button>
          {s.streakDays > 1 && (
            <p className="text-[11px] font-bold text-sub px-3 pb-1">🌤️ Racha: {s.streakDays} días seguidos</p>
          )}
        </div>
      </nav>

      {/* ── Contenido ── */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 surface border-b border-soft px-4 py-2.5 flex items-center gap-3">
          <img src="/sprout.svg" alt="" className="w-8 h-8" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-main leading-tight truncate">{s.worldName}</p>
            <p className="text-[11px] font-bold text-sub">Nivel {s.level} · {LEVEL_NAMES[s.level]}</p>
          </div>
          <button onClick={() => setBackupOpen(true)} className="btn-ghost !min-h-[40px] !px-2" aria-label="Copia de seguridad"><Download size={17} /></button>
          <button onClick={() => setSettingsOpen(true)} className="btn-ghost !min-h-[40px] !px-2" aria-label="Ajustes"><Settings size={17} /></button>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="h-full"
            >
              {view === 'world' && <WorldView onNavigate={navigate} />}
              {view === 'quests' && <QuestsView />}
              {view === 'collection' && <CollectionView onNavigate={navigate} />}
              {view === 'discover' && <DiscoverView />}
              {view === 'journal' && <JournalView />}
              {view === 'decorate' && <DecorateView />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Navegación inferior móvil ── */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 surface border-t border-soft flex pb-[env(safe-area-inset-bottom)]" aria-label="Navegación">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id} onClick={() => setView(n.id)} aria-current={active ? 'page' : undefined}
                className="relative flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold"
                style={{ color: active ? '#527D59' : '#718071' }}
              >
                {active && (
                  <motion.span layoutId="mobile-nav-pill" className="absolute inset-x-2 inset-y-1 rounded-panel bg-mint" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                )}
                <Icon size={18} className="relative" />
                <span className="relative">{n.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Globales ── */}
      <Toasts />
      <PetalBurst trigger={s.celebrateKey} />
      <LevelUpModal />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: (typeof NAV)[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick} aria-current={active ? 'page' : undefined}
      className={`relative flex items-center gap-2.5 px-3 min-h-[42px] rounded-panel text-sm font-bold transition-colors ${
        active ? 'text-ivory' : 'text-sub hover:bg-mint/60 hover:text-ink'
      }`}
    >
      {active && <motion.span layoutId="desktop-nav-active" className="absolute inset-0 rounded-panel bg-forest" transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }} />}
      <Icon size={17} className="relative" />
      <span className="relative">{item.label}</span>
    </button>
  );
}

// ── Modal de subida de nivel ─────────────────────────────────────────
function LevelUpModal() {
  const ev = useWorld((s) => s.levelUpEvent);
  const dismiss = useWorld((s) => s.dismissLevelUp);
  const placements = useWorld((s) => s.placements.length);
  if (!ev) return null;
  return (
    <Modal open onClose={dismiss} title={`¡Nivel ${ev.level}!`} labelId="levelup-title">
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.7 }}
          className="w-24 h-24 mx-auto rounded-full bg-butter grid place-items-center shadow-lift"
          aria-hidden
        >
          <Sprout size={48} className="text-forest" />
        </motion.div>
        <h3 className="font-display text-2xl text-main">{LEVEL_NAMES[ev.level]}</h3>
        <p className="text-sm text-sub">Tu mundo creció. Ahora eres un jardín más vivo y habitado.</p>
        {ev.rewards.length > 0 && (
          <div className="rounded-panel surface-2 border border-soft p-3 text-left">
            <p className="text-xs font-extrabold text-forest uppercase tracking-wide mb-1">Regalos desbloqueados</p>
            <ul className="text-sm text-main space-y-0.5">
              {ev.rewards.map((r) => <li key={r}>🌱 {r}</li>)}
            </ul>
            <p className="text-[11px] text-sub mt-2">Ve a «Decorar» para colocarlos en la isla ({placements} objetos ahora).</p>
          </div>
        )}
        <button onClick={dismiss} className="btn-primary w-full">Seguir explorando</button>
      </div>
    </Modal>
  );
}

// ── Copia de seguridad: exportar / importar JSON ─────────────────────
function BackupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    setBusy(true); setMsg(null);
    try {
      await useWorld.getState().flushPersist();
      const json = await exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `little-world-${todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Copia descargada. Guárdala en un lugar seguro.');
    } catch {
      setMsg('No se pudo crear la copia. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (f: File) => {
    setBusy(true); setMsg(null);
    try {
      const parsed = JSON.parse(await f.text());
      const v = validateBackup(parsed);
      if (!v.ok) { setMsg(v.error ?? 'Archivo inválido.'); return; }
      await importBackup({ state: parsed.state, images: parsed.images });
      window.location.reload(); // recargar para leer el estado importado
    } catch {
      setMsg('El archivo no es una copia válida de Little World.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Copia de seguridad">
      <div className="space-y-4">
        <p className="text-sm text-sub">
          Tus datos viven solo en este navegador. Exporta un archivo .json para llevar tu mundo a otro dispositivo, o impórtalo para restaurarlo.
        </p>
        <button onClick={doExport} disabled={busy} className="btn-primary w-full">
          <Download size={16} /> {busy ? 'Preparando…' : 'Exportar mi mundo (.json)'}
        </button>
        <div className="flex items-center gap-3 text-[11px] font-extrabold text-sub uppercase">
          <span className="flex-1 h-px bg-soft" /> o <span className="flex-1 h-px bg-soft" />
        </div>
        <input
          ref={fileRef} type="file" accept="application/json,.json" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = ''; }}
        />
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-secondary w-full">
          <Upload size={16} /> Importar una copia (reemplaza el mundo actual)
        </button>
        <AnimatePresence>
          {msg && (
            <motion.p
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-panel surface-2 border border-soft px-3 py-2 text-sm text-main flex items-start gap-2"
            >
              <X size={15} className="mt-0.5 text-sub shrink-0" /> {msg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
