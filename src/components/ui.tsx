/**
 * Sistema de diseño compartido: botones, tarjetas, modales, toasts,
 * barras de progreso y estados vacíos. Todo con la identidad cozy de Little World.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useWorld } from '../state/worldStore';

// ── Modal accesible ──────────────────────────────────────────────────
export function Modal({
  open, onClose, title, children, wide = false, labelId = 'modal-title',
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; labelId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // foco inicial dentro del modal
    const t = setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]');
      first?.focus();
    }, 60);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#35483B]/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            className={`relative surface w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} rounded-t-card sm:rounded-card shadow-lift max-h-[92dvh] overflow-y-auto`}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0.22, duration: 0.45 }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2 sticky top-0 surface z-10">
              <h2 id={labelId} className="font-display text-xl text-main">{title}</h2>
              <button onClick={onClose} aria-label="Cerrar" className="btn-ghost !min-h-[36px] !px-2 rounded-pill">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Toasts globales ──────────────────────────────────────────────────
const TOAST_STYLE: Record<string, string> = {
  success: 'bg-forest text-ivory',
  info: 'bg-[#5b6e5f] text-ivory',
  error: 'bg-[#C96A6A] text-ivory',
};

export function Toasts() {
  const toasts = useWorld((s) => s.toasts);
  const dismiss = useWorld((s) => s.dismissToast);
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 items-center pointer-events-none px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto px-4 py-2.5 rounded-pill shadow-lift text-sm font-bold ${TOAST_STYLE[t.kind]}`}
            initial={{ y: -16, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
          >
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Barra de progreso suave ──────────────────────────────────────────
export function ProgressBar({ value, color = '#527D59', height = 10, label }: {
  value: number; color?: string; height?: number; label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}
      aria-label={label ?? 'Progreso'}
      className="w-full rounded-pill bg-mint/70 overflow-hidden"
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-pill"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', bounce: 0, duration: 0.7 }}
      />
    </div>
  );
}

// ── Chip de categoría ────────────────────────────────────────────────
export function Chip({ color, soft, children, active = false, onClick, title }: {
  color: string; soft?: string; children: ReactNode; active?: boolean; onClick?: () => void; title?: string;
}) {
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      onClick={onClick}
      title={title}
      aria-pressed={onClick ? active : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold border transition-all ${
        active ? 'text-ivory shadow-soft' : 'text-main'
      }`}
      style={
        active
          ? { background: color, borderColor: color }
          : { background: soft ?? '#fff', borderColor: `${color}55`, color }
      }
    >
      {children}
    </Comp>
  );
}

// ── Estado vacío ilustrado ───────────────────────────────────────────
export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <svg width="120" height="96" viewBox="0 0 120 96" aria-hidden>
        <ellipse cx="60" cy="82" rx="42" ry="8" fill="#D8EED7" />
        <path d="M60 78 V58" stroke="#527D59" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 62 C46 62 40 50 40 40 C54 40 60 50 60 62Z" fill="#91C987" />
        <path d="M60 56 C74 56 80 44 80 34 C66 34 60 44 60 56Z" fill="#527D59" />
        <circle cx="30" cy="24" r="6" fill="#F5B8CA" opacity="0.8" />
        <circle cx="92" cy="18" r="4" fill="#F5DF91" opacity="0.9" />
        <circle cx="84" cy="34" r="3" fill="#D1C5F2" opacity="0.9" />
        <circle cx="60" cy="46" r="5" fill="#FFFEFA" stroke="#F5DF91" strokeWidth="2" />
      </svg>
      <h3 className="font-display text-lg text-main mt-3">{title}</h3>
      <p className="text-sub text-sm max-w-xs mt-1">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Etiqueta de XP ───────────────────────────────────────────────────
export function XpBadge({ xp, seeds }: { xp: number; seeds?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-forest bg-mint px-2 py-0.5 rounded-pill">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M5 0l1.2 3.1L9.5 3 6.8 5.3 7.8 8.5 5 6.7 2.2 8.5l1-3.2L.5 3l3.3-.1z" fill="#F5DF91" stroke="#C8A94E" strokeWidth=".6"/></svg>
      +{xp} XP
      {seeds !== undefined && (
        <span className="ml-1 inline-flex items-center gap-0.5">
          · +{seeds} <SeedIcon size={11} />
        </span>
      )}
    </span>
  );
}

export function SeedIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className={className}>
      <path d="M8 2c3 2.5 4 6 0 12C4 8 5 4.5 8 2z" fill="#91C987" stroke="#527D59" strokeWidth="1" />
      <path d="M8 5v6" stroke="#527D59" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// ── Confeti de pétalos al completar misiones ─────────────────────────
export function PetalBurst({ trigger }: { trigger: number }) {
  const reduceMotion = useWorld((s) => s.settings.reduceMotion);
  if (!trigger || reduceMotion) return null;
  const petals = Array.from({ length: 14 }, (_, i) => ({
    id: `${trigger}-${i}`,
    left: 8 + Math.random() * 84,
    delay: Math.random() * 0.5,
    dur: 2.2 + Math.random() * 1.6,
    color: ['#F5B8CA', '#F5DF91', '#D1C5F2', '#8BD8D0', '#FFFEFA'][i % 5],
    size: 8 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden" aria-hidden>
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: '-5vh',
            width: p.size,
            height: p.size * 0.8,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            boxShadow: '0 1px 3px rgba(53,72,59,.2)',
          }}
        />
      ))}
    </div>
  );
}
