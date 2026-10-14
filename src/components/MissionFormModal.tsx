/**
 * Modal de creación/edición de misiones con validación real.
 */
import { useState } from 'react';
import { CATEGORIES, categoryOf } from '../data/catalog';
import type { CategoryId, Frequency, Mission } from '../lib/types';
import { useWorld } from '../state/worldStore';
import { Chip, Modal } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Mission | null;
}

const FREQ_LABEL: Record<Frequency, string> = { once: 'Una vez', daily: 'Diaria', weekly: 'Semanal' };

export default function MissionFormModal({ open, onClose, editing }: Props) {
  const addMission = useWorld((s) => s.addMission);
  const updateMission = useWorld((s) => s.updateMission);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [category, setCategory] = useState<CategoryId>(editing?.category ?? 'creativity');
  const [frequency, setFrequency] = useState<Frequency>(editing?.frequency ?? 'daily');
  const [target, setTarget] = useState<string>(editing?.target ? String(editing.target) : '');
  const [xp, setXp] = useState<string>(String(editing?.xp ?? 20));
  const [seeds, setSeeds] = useState<string>(String(editing?.seeds ?? 2));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // reset al cambiar misión editada / reabrir
  const [lastKey, setLastKey] = useState<string>('');
  const key = `${open}-${editing?.id ?? 'new'}`;
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setTitle(editing?.title ?? '');
      setDescription(editing?.description ?? '');
      setCategory(editing?.category ?? 'creativity');
      setFrequency(editing?.frequency ?? 'daily');
      setTarget(editing?.target ? String(editing.target) : '');
      setXp(String(editing?.xp ?? 20));
      setSeeds(String(editing?.seeds ?? 2));
      setErrors({});
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Ponle un nombre a tu aventura.';
    else if (title.trim().length > 80) errs.title = 'Demasiado largo (máx. 80).';
    const xpN = Number(xp);
    if (!Number.isFinite(xpN) || xpN <= 0 || xpN > 200) errs.xp = 'XP entre 1 y 200.';
    const seedsN = Number(seeds);
    if (!Number.isFinite(seedsN) || seedsN < 0 || seedsN > 50) errs.seeds = 'Semillas entre 0 y 50.';
    const targetN = target === '' ? undefined : Number(target);
    if (targetN !== undefined && (!Number.isFinite(targetN) || targetN <= 0)) errs.target = 'Cantidad no válida.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      frequency,
      target: targetN,
      xp: Math.round(xpN),
      seeds: Math.round(seedsN),
    };
    if (editing) {
      updateMission(editing.id, payload);
      useWorld.getState().pushToast('Misión actualizada.', 'success');
    } else {
      addMission(payload);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar misión' : 'Nueva misión'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="m-title" className="block text-sm font-bold text-main mb-1">Nombre de la actividad *</label>
          <input
            id="m-title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej.: Leer 20 minutos"
            className="w-full rounded-panel border-2 border-mint surface-2 px-3.5 py-2.5 text-main focus:border-turquoise outline-none transition-colors"
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="text-[#C96A6A] text-xs font-bold mt-1">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="m-desc" className="block text-sm font-bold text-main mb-1">Descripción (opcional)</label>
          <textarea
            id="m-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Un pequeño detalle sobre por qué importa…"
            className="w-full rounded-panel border-2 border-mint surface-2 px-3.5 py-2.5 text-main focus:border-turquoise outline-none resize-none"
          />
        </div>

        <div>
          <span className="block text-sm font-bold text-main mb-1.5">Categoría</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Chip key={c.id} color={c.color} soft={c.soft} active={category === c.id} onClick={() => setCategory(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
          <p className="text-sub text-xs mt-1">Color actual: {categoryOf(category).label}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="m-freq" className="block text-sm font-bold text-main mb-1">Frecuencia</label>
            <select
              id="m-freq" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="w-full rounded-panel border-2 border-mint surface-2 px-3 py-2.5 text-main"
            >
              {(Object.keys(FREQ_LABEL) as Frequency[]).map((f) => (
                <option key={f} value={f}>{FREQ_LABEL[f]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="m-target" className="block text-sm font-bold text-main mb-1">Objetivo (opcional)</label>
            <input
              id="m-target" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)}
              placeholder="p. ej. 20 minutos"
              className="w-full rounded-panel border-2 border-mint surface-2 px-3.5 py-2.5 text-main"
              aria-invalid={!!errors.target}
            />
            {errors.target && <p className="text-[#C96A6A] text-xs font-bold mt-1">{errors.target}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="m-xp" className="block text-sm font-bold text-main mb-1">Experiencia (XP)</label>
            <input id="m-xp" inputMode="numeric" value={xp} onChange={(e) => setXp(e.target.value)}
              className="w-full rounded-panel border-2 border-mint surface-2 px-3.5 py-2.5 text-main" aria-invalid={!!errors.xp} />
            {errors.xp && <p className="text-[#C96A6A] text-xs font-bold mt-1">{errors.xp}</p>}
          </div>
          <div>
            <label htmlFor="m-seeds" className="block text-sm font-bold text-main mb-1">Semillas mágicas</label>
            <input id="m-seeds" inputMode="numeric" value={seeds} onChange={(e) => setSeeds(e.target.value)}
              className="w-full rounded-panel border-2 border-mint surface-2 px-3.5 py-2.5 text-main" aria-invalid={!!errors.seeds} />
            {errors.seeds && <p className="text-[#C96A6A] text-xs font-bold mt-1">{errors.seeds}</p>}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit" className="btn-primary flex-1">
            {editing ? 'Guardar cambios' : 'Plantar la misión 🌱'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
