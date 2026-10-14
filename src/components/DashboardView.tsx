/**
 * Dashboard resumido: progreso rápido sin gráficos por rellenar.
 * Nivel + XP, semillas, misiones hoy/semana, objetos desbloqueados,
 * última visita, calendario semanal de actividad y resumen de 4 semanas.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarHeart, Check, Sprout } from 'lucide-react';
import { LEVEL_NAMES, isMissionDoneToday, todayStr, xpRangeForLevel } from '../lib/types';
import { itemById } from '../data/catalog';
import { useWorld, progressThisWeek } from '../state/worldStore';
import { ProgressBar, SeedIcon, XpBadge } from './ui';

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}

export default function DashboardView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const s = useWorld();
  const today = todayStr();

  const doneToday = s.missions.filter((m) => isMissionDoneToday(m, today)).length;
  const totalToday = s.missions.filter(
    (m) => m.frequency === 'daily' || (m.frequency === 'once' && !m.doneOnce),
  ).length;
  const weekPct = progressThisWeek(s.missions);
  // completadas en lo que va de semana (lunes → hoy)
  const mondayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return fmt(d);
  }, []);
  const weekDone = s.missions.reduce(
    (acc, m) => acc + m.completions.filter((c) => c >= mondayStr && c <= today).length,
    0,
  );
  const [xpLo, xpHi] = xpRangeForLevel(s.level);
  const xpPct = Math.min(100, Math.round(((s.xp - xpLo) / Math.max(1, xpHi - xpLo)) * 100));

  // últimos 7 días → número de completadas por día (para los circulitos)
  const days = useMemo(() => lastNDays(7), []);
  const perDay = useMemo(() => {
    const set = new Set<string>();
    for (const m of s.missions) for (const c of m.completions) set.add(c);
    // también "once" completadas: aproximamos con la última fecha del historial si no tiene
    return days.map((d) => {
      let n = 0;
      for (const m of s.missions) n += m.completions.filter((c) => c === d).length;
      return n;
    });
  }, [s.missions, days]);

  // últimas 4 semanas: completadas por semana
  const weeks = useMemo(() => {
    const now = new Date();
    const out: { label: string; count: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(now.getDate() - nowgetDayMon(now) - w * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const sStr = fmt(start), eStr = fmt(end);
      let count = 0;
      for (const m of s.missions) count += m.completions.filter((c) => c >= sStr && c <= eStr).length;
      out.push({ label: w === 0 ? 'Esta semana' : `Hace ${w}`, count });
    }
    return out;
  }, [s.missions]);

  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

  const recent = s.activity.slice(0, 6);

  const lastVisitLabel =
    s.lastVisit === today ? 'hoy' :
    s.lastVisit === days[days.length - 2] ? 'ayer' :
    s.lastVisit;

  return (
    <div className="h-full overflow-y-auto px-4 lg:px-8 py-6 pb-28 lg:pb-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <h1 className="font-display text-2xl lg:text-3xl text-main flex items-center gap-2">
            <CalendarHeart size={26} className="text-forest" /> Resumen de tu mundo
          </h1>
          <p className="text-sm text-sub mt-1">Última visita: {lastVisitLabel}. Tu jardín te espera sin prisa.</p>
        </header>

        {/* Fila principal: nivel + recurso */}
        <section className="grid sm:grid-cols-3 gap-3">
          <div className="card p-4 sm:col-span-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-display text-xl text-main">Nivel {s.level} · {LEVEL_NAMES[s.level]}</p>
              <span className="text-xs font-extrabold text-sub">{s.xp} XP</span>
            </div>
            <div className="mt-3"><ProgressBar value={xpPct} label={`Experiencia hacia el Nivel ${Math.min(s.level + 1, 5)}`} /></div>
            <p className="text-[11px] text-sub mt-1.5">{s.xp - xpLo} de {Math.max(1, xpHi - xpLo)} XP para el siguiente nivel.</p>
          </div>
          <button onClick={() => onNavigate('collection')} className="card p-4 text-left hover:shadow-lift transition-shadow">
            <p className="font-display text-2xl text-forest inline-flex items-center gap-1.5">{s.seeds} <SeedIcon size={18} /></p>
            <p className="text-xs font-bold text-sub mt-1">semillas mágicas · canjeables en la colección</p>
          </button>
        </section>

        {/* Contadores útiles */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat value={`${doneToday}/${totalToday || 0}`} label="misiones hoy" onClick={() => onNavigate('quests')} />
          <Stat value={weekDone} label="esta semana" onClick={() => onNavigate('quests')} />
          <Stat value={s.unlockedItems.length} label="objetos desbloqueados" onClick={() => onNavigate('collection')} />
          <Stat value={s.placements.length} label="en la isla" onClick={() => onNavigate('decorate')} />
        </section>

        {/* Calendario semanal */}
        <section className="card p-4">
          <h2 className="font-display text-lg text-main mb-3">Tus últimos 7 días</h2>
          <div className="flex justify-between gap-1.5" aria-label="Actividad diaria: misiones completadas">
            {days.map((d, i) => {
              const n = perDay[i];
              const dow = (new Date(d + 'T12:00:00').getDay() + 6) % 7;
              const intensity = n === 0 ? 'bg-mint/60' : n <= 1 ? 'bg-[#b9e0ae]' : n <= 2 ? 'bg-[#91C987]' : 'bg-forest';
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1.5">
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`w-9 h-9 rounded-full ${intensity} grid place-items-center border border-soft`}
                    title={`${d}: ${n} misión${n === 1 ? '' : 'es'}`}
                    aria-label={`${d}: ${n} misiones completadas`}
                  >
                    {n > 0 && <Check size={15} className={n > 2 ? 'text-ivory' : 'text-forest'} strokeWidth={3} />}
                  </motion.span>
                  <span className="text-[10px] font-extrabold text-sub">{DAY_LETTERS[dow]}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-sub mt-2.5">Más verde = más pasos dados. Los días vacíos no borran nada: tu mundo siempre te espera.</p>
        </section>

        {/* 4 semanas */}
        <section className="card p-4">
          <h2 className="font-display text-lg text-main mb-3">Las últimas cuatro semanas</h2>
          <div className="space-y-2.5">
            {weeks.map((w) => (
              <div key={w.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-bold text-sub">{w.label}</span>
                <div className="flex-1 h-3 rounded-pill bg-mint/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${Math.round((w.count / maxWeek) * 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-pill bg-gradient-to-r from-[#91C987] to-forest"
                  />
                </div>
                <span className="w-8 text-right text-xs font-extrabold text-main">{w.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Actividad reciente */}
        <section className="card p-4">
          <h2 className="font-display text-lg text-main mb-2.5">Huellas recientes</h2>
          {recent.length === 0 ? (
            <div className="text-sm text-sub flex items-center gap-2 py-2">
              <Sprout size={18} className="text-forest" /> Aún no hay huellas. Completa una pequeña aventura para empezar a dejarlas.
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center gap-2.5 text-sm">
                  <span className="w-7 h-7 rounded-full bg-mint grid place-items-center shrink-0" aria-hidden>
                    {a.type === 'complete' && <Check size={13} className="text-forest" />}
                    {a.type === 'levelup' && <Sprout size={13} className="text-forest" />}
                    {(a.type === 'unlock' || a.type === 'biome') && <span className="text-[12px]" aria-hidden>✨</span>}
                  </span>
                  <span className="text-main min-w-0 truncate">
                    {a.type === 'complete' && <>Completaste «{a.missionTitle}»</>}
                    {a.type === 'levelup' && <>Tu mundo creció al Nivel {a.level} · {LEVEL_NAMES[a.level ?? 1]}</>}
                    {a.type === 'unlock' && <>{itemById(a.itemId ?? '')?.name ?? 'Un objeto'} se unió a tu colección</>}
                    {a.type === 'biome' && <>Descubriste un nuevo rincón del mundo</>}
                  </span>
                  <span className="ml-auto text-[11px] text-sub shrink-0">{fmtHuman(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Progreso semanal global */}
        <section className="card p-4 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg text-main">Progreso de esta semana</h2>
            <div className="mt-2.5"><ProgressBar value={weekPct} label="Porcentaje semanal de misiones" /></div>
          </div>
          <p className="font-display text-3xl text-forest shrink-0">{weekPct}%</p>
        </section>

        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={() => onNavigate('quests')} className="btn-primary">Ver aventuras de hoy</button>
          <button onClick={() => onNavigate('journal')} className="btn-secondary">Escribir en el diario</button>
          <XpBadge xp={s.xp} seeds={s.seeds} />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, onClick }: { value: string | number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-3.5 text-left hover:shadow-lift transition-shadow">
      <p className="font-display text-2xl text-main">{value}</p>
      <p className="text-[11px] font-bold text-sub leading-tight mt-0.5">{label}</p>
    </button>
  );
}

// utilidades de fecha locales
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function nowgetDayMon(d: Date): number {
  return (d.getDay() + 6) % 7; // lunes = 0
}
function daysSinceMonday(dateStr: string): number {
  const mon = new Date();
  mon.setDate(mon.getDate() - nowgetDayMon(new Date()));
  mon.setHours(0, 0, 0, 0);
  const dt = new Date(dateStr + 'T00:00:00');
  return Math.floor((dt.getTime() - mon.getTime()) / 86400000);
}
function dayOfWeekIndex(_dateStr: string): number {
  return 0; // helper simple: todas las fechas ya filtradas por rango
}
function fmtHuman(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return 'hace un rato';
  if (diff < 86400000) return `hoy`;
  if (diff < 172800000) return 'ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
