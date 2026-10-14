/**
 * Vista JOURNAL (My Story): línea temporal de recuerdos con ánimo, imagen opcional
 * (guardada como Blob en IndexedDB) y conexión con misiones.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Camera, ImagePlus, Link2, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MOODS, categoryOf } from '../data/catalog';
import type { JournalEntry, MoodId } from '../lib/types';
import { todayStr, uid } from '../lib/types';
import { loadImage } from '../lib/storage';
import { useWorld } from '../state/worldStore';
import { EmptyState, Modal } from './ui';

export default function JournalView() {
  const s = useWorld();
  const [composing, setComposing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // agrupar por mes para la línea temporal
  const groups = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of s.journal) {
      const key = e.date.slice(0, 7); // YYYY-MM
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [s.journal]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-5 pb-28 lg:pb-8">
        <header className="card p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-butter/60 grid place-items-center shrink-0" aria-hidden>
              <BookOpen size={20} className="text-[#8a6d1f]" />
            </span>
            <div>
              <h1 className="font-display text-2xl text-main leading-tight">My Story</h1>
              <p className="text-sm text-sub font-bold">
                {s.journal.length === 0 ? 'Tu diario espera su primera página.' : `${s.journal.length} recuerdo${s.journal.length === 1 ? '' : 's'} guardados.`}
              </p>
            </div>
          </div>
          <button onClick={() => setComposing(true)} className="btn-small btn-primary shrink-0">+ Recuerdo</button>
        </header>

        {s.journal.length === 0 ? (
          <EmptyState
            title="Aún no hay historias"
            text="Escribe un pequeño recuerdo de hoy: qué misión completaste, cómo te sentiste, qué creció en tu mundo."
            action={<button onClick={() => setComposing(true)} className="btn-primary">Escribir el primero</button>}
          />
        ) : (
          <div className="relative pl-6">
            {/* hilo de la línea temporal */}
            <div className="absolute left-[9px] top-2 bottom-2 w-[3px] rounded-pill bg-mint" aria-hidden />
            {groups.map(([ym, entries]) => (
              <section key={ym} aria-label={monthLabel(ym)}>
                <h2 className="font-display text-lg text-forest capitalize mt-4 mb-3 relative">
                  <span className="absolute -left-6 top-1.5 w-[15px] h-[15px] rounded-full bg-forest border-4 border-mint" aria-hidden />
                  {monthLabel(ym)}
                </h2>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {entries.map((e) => (
                      <JournalCard
                        key={e.id} entry={e}
                        missionTitle={s.missions.find((m) => m.id === e.linkedMissionId)?.title}
                        confirmingDelete={confirmDelete === e.id}
                        onAskDelete={() => setConfirmDelete(e.id)}
                        onCancelDelete={() => setConfirmDelete(null)}
                        onDelete={async () => { await s.deleteJournal(e.id); setConfirmDelete(null); }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <ComposeModal open={composing} onClose={() => setComposing(false)} />
    </div>
  );
}

// ── Tarjeta de entrada ───────────────────────────────────────────────
function JournalCard({ entry, missionTitle, confirmingDelete, onAskDelete, onCancelDelete, onDelete }: {
  entry: JournalEntry;
  missionTitle?: string;
  confirmingDelete: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let created: string | null = null;
    if (entry.imageId) {
      void loadImage(entry.imageId).then((blob) => {
        if (!alive || !blob) return;
        created = URL.createObjectURL(blob);
        setImgUrl(created);
      });
    } else setImgUrl(null);
    return () => { alive = false; if (created) URL.revokeObjectURL(created); };
  }, [entry.imageId]);

  const mood = MOODS.find((m) => m.id === entry.mood);
  const day = new Date(entry.date + 'T12:00:00');
  const dateLabel = day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <motion.article
      layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      className="card p-4 relative"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-main leading-snug">{entry.title}</h3>
          <p className="text-[11px] font-bold text-sub mt-0.5 flex flex-wrap items-center gap-x-2">
            <span className="capitalize">{dateLabel}</span>
            {mood && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill" style={{ background: `${mood.color}44`, color: '#35483B' }}>
                {mood.label}
              </span>
            )}
            {missionTitle && (
              <span className="inline-flex items-center gap-1 text-forest">
                <Link2 size={11} /> {missionTitle}
              </span>
            )}
          </p>
        </div>
        {!confirmingDelete ? (
          <button onClick={onAskDelete} className="btn-ghost !min-h-[34px] !px-1.5 shrink-0" aria-label={`Eliminar ${entry.title}`} title="Eliminar recuerdo">
            <Trash2 size={14} />
          </button>
        ) : (
          <span className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-bold text-[#B25667]">¿Borrar?</span>
            <button onClick={onDelete} className="btn-small bg-[#C96A6A] text-ivory !min-h-[32px] !px-2">Sí</button>
            <button onClick={onCancelDelete} className="btn-small btn-ghost !min-h-[32px] !px-2">No</button>
          </span>
        )}
      </div>
      <p className="text-sm text-main/90 mt-2 whitespace-pre-line leading-relaxed">{entry.text}</p>
      {imgUrl && (
        <img src={imgUrl} alt={`Imagen del recuerdo: ${entry.title}`} className="mt-3 rounded-panel max-h-56 w-full object-cover" loading="lazy" />
      )}
    </motion.article>
  );
}

// ── Modal de creación ────────────────────────────────────────────────
function ComposeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useWorld();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState(todayStr());
  const [mood, setMood] = useState<MoodId | null>(null);
  const [missionId, setMissionId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const previewRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); };
  }, []);

  const pickFile = (f: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = f ? URL.createObjectURL(f) : null;
    setFile(f);
  };

  const save = async () => {
    if (!title.trim() || !text.trim()) return;
    await s.addJournal(
      {
        title: title.trim(),
        text: text.trim(),
        date,
        mood: mood ?? undefined,
        linkedMissionId: missionId || undefined,
      },
      file ?? undefined,
    );
    setTitle(''); setText(''); setMood(null); setMissionId(''); pickFile(null);
    onClose();
  };

  const valid = title.trim().length > 0 && text.trim().length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Nuevo recuerdo">
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-extrabold text-sub uppercase tracking-wide">Título</span>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
            placeholder="El día que planté mi primera flor…"
            className="mt-1 w-full rounded-panel border-2 border-mint surface-2 px-3 py-2.5 text-main font-bold focus:border-forest outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-extrabold text-sub uppercase tracking-wide">¿Qué pasó hoy?</span>
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={4}
            placeholder="Pequeñas victorias, sensaciones, lo que creció en tu mundo…"
            className="mt-1 w-full rounded-panel border-2 border-mint surface-2 px-3 py-2.5 text-main resize-y outline-none focus:border-forest"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-extrabold text-sub uppercase tracking-wide">Fecha</span>
            <input
              type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-panel border-2 border-mint surface-2 px-3 py-2 text-main font-bold outline-none focus:border-forest"
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-sub uppercase tracking-wide">Misión relacionada</span>
            <select
              value={missionId} onChange={(e) => setMissionId(e.target.value)}
              className="mt-1 w-full rounded-panel border-2 border-mint surface-2 px-2 py-2 text-main font-bold outline-none focus:border-forest bg-white"
            >
              <option value="">Ninguna</option>
              {s.missions.map((m) => (
                <option key={m.id} value={m.id}>{m.title} · {categoryOf(m.category).label}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="text-xs font-extrabold text-sub uppercase tracking-wide mb-1.5">Ánimo del día</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ánimo">
            {MOODS.map((m) => (
              <button
                key={m.id} type="button" role="radio" aria-checked={mood === m.id}
                onClick={() => setMood(mood === m.id ? null : m.id)}
                className={`px-3 py-1.5 rounded-pill text-xs font-extrabold border transition-all ${
                  mood === m.id ? 'text-ivory shadow-soft scale-105' : 'surface hover:scale-105'
                }`}
                style={mood === m.id ? { background: m.color, borderColor: m.color, color: '#35483B' } : { borderColor: `${m.color}`, color: '#35483B' }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <span className="text-xs font-extrabold text-sub uppercase tracking-wide block mb-1.5">Foto (opcional)</span>
          <input
            ref={fileRef} type="file" accept="image/*" className="sr-only" id="journal-photo"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {previewRef.current && file ? (
            <div className="relative">
              <img src={previewRef.current} alt="Vista previa de la foto" className="rounded-panel max-h-40 w-full object-cover" />
              <button
                onClick={() => pickFile(null)} aria-label="Quitar foto"
                className="absolute top-2 right-2 w-8 h-8 rounded-full surface grid place-items-center shadow-lift"
              ><X size={15} /></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="btn-small btn-secondary w-full border-2 border-dashed !border-mint">
              <ImagePlus size={15} /> Añadir una imagen
            </button>
          )}
          <p className="text-[11px] text-sub mt-1.5 flex items-center gap-1"><Camera size={11} /> Se guarda solo en este navegador (IndexedDB).</p>
        </div>

        <button onClick={save} disabled={!valid} className={`btn-primary w-full ${valid ? '' : 'opacity-50 cursor-not-allowed'}`}>
          Guardar recuerdo
        </button>
      </div>
    </Modal>
  );
}

// id único reutilizable por si se amplía (evita warning de import no usado al minificar)
void uid;
