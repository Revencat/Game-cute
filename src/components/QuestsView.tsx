/**
 * Vista DAILY QUESTS: lista completa de misiones, filtros, resumen semanal.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES, categoryOf } from '../data/catalog';
import type { CategoryId, Mission } from '../lib/types';
import { LEVEL_NAMES, todayStr } from '../lib/types';
import { isMissionDoneToday, progressThisWeek, useWorld } from '../state/worldStore';
import MissionFormModal from './MissionFormModal';
import { Chip, EmptyState, ProgressBar, XpBadge } from './ui';

const FREQ_LABEL = { once: 'una vez', daily: 'diaria', weekly: 'semanal' } as const;

export default function QuestsView() {
  const missions = useWorld((s) => s.missions);
  const completeMission = useWorld((s) => s.completeMission);
  const undoComplete = useWorld((s) => s.undoComplete);
  const deleteMission = useWorld((s) => s.deleteMission);

  const [filter, setFilter] = useState<CategoryId | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);

  const today = todayStr();
  const visible = missions.filter((m) => filter === 'all' || m.category === filter);
  const pending = visible.filter((m) => !isMissionDoneToday(m, today));
  const done = visible.filter((m) => isMissionDoneToday(m, today));
  const dayPct = missions.length === 0 ? 0 : Math.round((missions.filter((m) => isMissionDoneToday(m, today)).length / missions.length) * 100);
  const weekPct = progressThisWeek(missions);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-5 pb-28 lg:pb-8">
        {/* encabezado */}
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-main">Today's little adventures</h1>
              <p className="text-sm text-sub font-bold mt-0.5 capitalize">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <button onClick={() => setCreating(true)} className="btn-primary">
              <Sparkles size={16} /> Nueva misión
            </button>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-extrabold text-sub mb-1">
                <span>Hoy</span><span>{dayPct}%</span>
              </div>
              <ProgressBar value={dayPct} label="Progreso del día" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-extrabold text-sub mb-1">
                <span>Esta semana</span><span>{weekPct}%</span>
              </div>
              <ProgressBar value={weekPct} color="#D1C5F2" label="Progreso semanal" />
            </div>
          </div>
        </div>

        {/* filtros */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          <Chip color="#527D59" active={filter === 'all'} onClick={() => setFilter('all')}>Todas</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} color={c.color} soft={c.soft} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>

        {missions.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Todo tranquilo por aquí"
              text="¿Plantamos una nueva idea? Cada misión completada hace crecer tu isla."
              action={<button onClick={() => setCreating(true)} className="btn-primary"><Sparkles size={16} /> Crear mi primera misión</button>}
            />
          </div>
        ) : (
          <>
            {/* pendientes */}
            <section aria-label="Misiones pendientes">
              <h2 className="font-display text-lg text-main mb-2 px-1">Pendientes ({pending.length})</h2>
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {pending.map((m) => <MissionRow key={m.id} mission={m} onEdit={() => setEditing(m)} onDelete={() => deleteMission(m.id)} onComplete={() => completeMission(m.id)} />)}
                </AnimatePresence>
                {pending.length === 0 && done.length > 0 && (
                  <div className="card p-5 text-center">
                    <p className="font-display text-forest text-lg">¡Jornada completa! 🌼</p>
                    <p className="text-sm text-sub mt-1">Tu mundo floreció hoy gracias a {done.length} {done.length === 1 ? 'pequeña victoria' : 'pequeñas victorias'}.</p>
                  </div>
                )}
              </div>
            </section>

            {/* completadas hoy */}
            {done.length > 0 && (
              <section aria-label="Completadas hoy">
                <h2 className="font-display text-lg text-main mb-2 px-1">Completadas hoy ({done.length})</h2>
                <div className="space-y-2.5">
                  {done.map((m) => (
                    <div key={m.id} className="card p-3.5 flex items-center gap-3 opacity-80">
                      <span className="w-8 h-8 rounded-full bg-forest grid place-items-center shrink-0" aria-hidden>
                        <Check size={16} className="text-ivory" strokeWidth={3} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sub line-through truncate">{m.title}</p>
                        <p className="text-[11px] text-sub">{categoryOf(m.category).label} · +{m.xp} XP</p>
                      </div>
                      <button onClick={() => undoComplete(m.id)} className="btn-ghost !min-h-[36px] !px-2" aria-label={`Deshacer ${m.title}`} title="Deshacer (devuelve la XP)">
                        <Undo2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* resumen semanal discreto */}
        {missions.length > 0 && (
          <WeeklySummary />
        )}
      </div>

      <MissionFormModal open={creating} onClose={() => setCreating(false)} />
      <MissionFormModal open={!!editing} onClose={() => setEditing(null)} editing={editing} />
    </div>
  );
}

function MissionRow({ mission, onComplete, onEdit, onDelete }: {
  mission: Mission; onComplete: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const cat = categoryOf(mission.category);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
      <div className="card p-3.5 flex items-start gap-3">
        <button
          onClick={onComplete}
          aria-label={`Completar ${mission.title}`}
          className="mt-0.5 w-8 h-8 shrink-0 rounded-full border-2 grid place-items-center transition-all hover:scale-110 active:scale-95"
          style={{ borderColor: cat.color, background: `${cat.color}15` }}
        >
          <Check size={16} style={{ color: cat.color }} strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-main">{mission.title}</p>
            <XpBadge xp={mission.xp} seeds={mission.seeds} />
          </div>
          {mission.description && <p className="text-sm text-sub mt-0.5">{mission.description}</p>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Chip color={cat.color} soft={cat.soft}>{cat.label}</Chip>
            <span className="text-[11px] font-bold text-sub">· {FREQ_LABEL[mission.frequency]}</span>
            {mission.target && <span className="text-[11px] font-bold text-sub">· meta: {mission.target}</span>}
            <span className="text-[11px] font-bold text-sub">· hechas: {mission.completions.length}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={onEdit} className="btn-ghost !min-h-[32px] !px-1.5" aria-label={`Editar ${mission.title}`}><Pencil size={14} /></button>
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} className="btn-ghost !min-h-[32px] !px-1.5 text-[#C96A6A]" aria-label={`Eliminar ${mission.title}`}><Trash2 size={14} /></button>
          ) : (
            <div className="flex gap-1">
              <button onClick={onDelete} className="btn-small bg-[#C96A6A] text-ivory !min-h-[30px] !px-2 text-xs">Sí</button>
              <button onClick={() => setConfirmDel(false)} className="btn-small btn-ghost !min-h-[30px] !px-2 text-xs">No</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function WeeklySummary() {
  const missions = useWorld((s) => s.missions);
  const level = useWorld((s) => s.level);
  // últimos 7 días con actividad
  const days = useMemoLast7();
  const totalThisWeek = missions.reduce((acc, m) => acc + m.completions.filter((d) => days.includes(d)).length, 0);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-main">Ritmo semanal</h3>
        <p className="text-xs font-bold text-sub">Nivel {level} · {LEVEL_NAMES[level]}</p>
      </div>
      <div className="flex gap-2 mt-3 justify-between" aria-label="Actividad de los últimos 7 días">
        {days.map((d, i) => {
          const count = missions.reduce((acc, m) => acc + m.completions.filter((x) => x === d).length, 0);
          const shade = count === 0 ? '#E9F2E4' : count >= 4 ? '#527D59' : count >= 2 ? '#91C987' : '#BBDCAE';
          return (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <span
                className="w-8 h-8 rounded-full border-2 border-soft"
                style={{ background: shade }}
                title={`${count} misión(es) el ${d}`}
                aria-label={`${d}: ${count} misiones`}
              />
              <span className="text-[10px] font-bold text-sub">{['L', 'M', 'X', 'J', 'V', 'S', 'D'][(new Date(d + 'T00:00:00').getDay() + 6) % 7]}</span>
              {i === 6 && <span className="sr-only">hoy</span>}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-sub mt-3">
        {totalThisWeek === 0
          ? 'Semana en calma. Tu isla te espera sin prisa.'
          : `Esta semana has completado ${totalThisWeek} aventura${totalThisWeek === 1 ? '' : 's'}. El jardín lo nota.`}
      </p>
    </div>
  );
}

function useMemoLast7(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
