/**
 * Onboarding en 5 pasos, corto y bonito. Se puede saltar.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES } from '../data/catalog';
import type { CategoryId } from '../lib/types';
import { useWorld } from '../state/worldStore';
import { Chip } from './ui';

const SUGGESTED = ['Leer 15 minutos', 'Estirar el cuerpo', 'Regalar una sonrisa'];

export default function Onboarding() {
  const completeOnboarding = useWorld((s) => s.completeOnboarding);
  const addMission = useWorld((s) => s.addMission);
  const [step, setStep] = useState(0);
  const [worldName, setWorldName] = useState('');
  const [intents, setIntents] = useState<CategoryId[]>([]);
  const [gardenReady, setGardenReady] = useState(false);

  const finish = (withSuggested: boolean) => {
    completeOnboarding(worldName || 'Mi pequeño mundo', intents);
    if (withSuggested && intents.length === 0) {
      addMission({ title: SUGGESTED[0], category: 'learning', frequency: 'daily', xp: 20, seeds: 2 });
    }
  };

  const stepsTotal = 5;

  return (
    <div className="fixed inset-0 z-[80] bg-gradient-to-b from-sky via-cream to-mint flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* isla decorativa superior */}
        <div className="flex justify-center mb-2" aria-hidden>
          <motion.svg width="150" height="110" viewBox="0 0 150 110"
            animate={gardenReady ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.9 }}
          >
            <ellipse cx="75" cy="88" rx="46" ry="10" fill="#D8EED7" opacity="0.7" />
            <path d="M40 78 Q75 60 110 78 L92 96 Q75 104 58 96 Z" fill="#91C987" />
            <path d="M58 96 Q75 104 92 96 L80 112 Q75 116 70 112 Z" fill="#A87C5F" />
            <circle cx="62" cy="66" r="12" fill="#527D59" />
            <rect x="60" y="70" width="4" height="10" rx="2" fill="#9A7054" />
            <circle cx="90" cy="70" r="4" fill="#F5B8CA" />
            <circle cx="97" cy="74" r="3" fill="#F5DF91" />
            <circle cx="83" cy="75" r="3" fill="#D1C5F2" />
          </motion.svg>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
            className="card p-6 sm:p-7"
          >
            {step === 0 && (
              <div className="text-center">
                <p className="font-display text-forest text-sm tracking-widest uppercase">Little World</p>
                <h1 className="font-display text-2xl sm:text-3xl text-main mt-2 leading-snug">
                  Every little step grows something beautiful.
                </h1>
                <p className="text-sub mt-3">
                  Cada pequeña cosa que hagas hoy —leer, crear, moverte, cuidar algo— hará crecer tu propio jardín mágico.
                </p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-xl text-main">Ponle nombre a tu mundo</h2>
                <p className="text-sub text-sm mt-1 mb-4">Sonará cada vez que lo visites.</p>
                <label htmlFor="ob-name" className="sr-only">Nombre del mundo</label>
                <input
                  id="ob-name" autoFocus value={worldName} maxLength={30}
                  onChange={(e) => setWorldName(e.target.value)}
                  placeholder="Mi pequeño mundo"
                  className="w-full rounded-panel border-2 border-mint surface-2 px-4 py-3 text-main focus:border-turquoise outline-none font-display text-lg"
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-xl text-main">¿Qué quieres cuidar?</h2>
                <p className="text-sub text-sm mt-1 mb-4">Elige hasta tres intenciones. Nacerán como misiones diarias suaves.</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter((c) => c.id !== 'personal').map((c) => {
                    const active = intents.includes(c.id);
                    return (
                      <Chip
                        key={c.id} color={c.color} soft={c.soft} active={active}
                        onClick={() =>
                          setIntents((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id)
                              : prev.length >= 3 ? prev : [...prev, c.id])
                        }
                      >
                        {c.label}
                      </Chip>
                    );
                  })}
                </div>
                <p className="text-sub text-xs mt-3">{intents.length}/3 elegidas</p>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-2">
                <h2 className="font-display text-xl text-main">Naciendo tu jardín…</h2>
                <div className="flex justify-center my-5">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.45, duration: 1 }}
                    onAnimationComplete={() => setGardenReady(true)}
                  >
                    <svg width="130" height="130" viewBox="0 0 130 130" aria-hidden>
                      <ellipse cx="65" cy="100" rx="40" ry="9" fill="#D8EED7" />
                      <path d="M35 92 Q65 76 95 92 L80 110 Q65 118 50 110 Z" fill="#91C987" />
                      <path d="M50 110 Q65 118 80 110 L70 126 Q65 130 60 126 Z" fill="#A87C5F" />
                      <rect x="62" y="66" width="6" height="18" rx="3" fill="#9A7054" />
                      <circle cx="65" cy="58" r="17" fill="#527D59" />
                      <circle cx="45" cy="84" r="4.5" fill="#F5B8CA" />
                      <circle cx="85" cy="86" r="4" fill="#F5DF91" />
                      <circle cx="76" cy="80" r="3.5" fill="#D1C5F2" />
                    </svg>
                  </motion.div>
                </div>
                <p className="text-sub text-sm">
                  {gardenReady ? '¡Tu isla está lista! Le espera todo lo que construyas.' : 'Un poquito de magia…'}
                </p>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="font-display text-xl text-main">Tu primera aventura</h2>
                <p className="text-sub text-sm mt-1 mb-4">Empieza con algo tan pequeño que sea imposible fallar.</p>
                <button onClick={() => finish(true)} className="btn-primary w-full mb-2">
                  <Sparkles size={16} /> Empezar con «{SUGGESTED[0]}»
                </button>
                <button onClick={() => finish(false)} className="btn-secondary w-full">
                  Entrar sin misiones
                </button>
              </div>
            )}

            {/* navegación */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className={`btn-ghost !min-h-[40px] ${step === 0 ? 'invisible' : ''}`}
                aria-label="Atrás"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex gap-1.5" aria-label={`Paso ${step + 1} de ${stepsTotal}`}>
                {Array.from({ length: stepsTotal }, (_, i) => (
                  <span key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-forest' : 'bg-mint'}`} />
                ))}
              </div>
              {step < 3 ? (
                <button onClick={() => setStep((s) => s + 1)} className="btn-ghost !min-h-[40px]" aria-label="Siguiente">
                  <ArrowRight size={16} />
                </button>
              ) : step === 3 ? (
                <button onClick={() => setStep(4)} className="btn-small btn-primary">Continuar</button>
              ) : (
                <button onClick={() => finish(false)} className="btn-ghost text-xs">Saltar introducción</button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {step < 4 && (
          <button onClick={() => finish(false)} className="block mx-auto mt-3 text-sm font-bold text-sub hover:text-ink underline underline-offset-4">
            Saltar y entrar a mi mundo
          </button>
        )}
      </div>
    </div>
  );
}
