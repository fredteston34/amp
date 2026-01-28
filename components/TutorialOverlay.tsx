
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Check, Music4, Mic, Sliders, Play, Wand2 } from 'lucide-react';
import clsx from 'clsx';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: "Bienvenue dans VibeChord",
    desc: "Ceci est votre studio de guitare intelligent. Créez des morceaux, jammez avec l'IA et sculptez votre son. Faisons un tour rapide !",
    position: "center", // Centered modal
    icon: Music4,
    color: "bg-green-500"
  },
  {
    title: "1. La Grille d'Accords",
    desc: "C'est ici que votre morceau prend vie. Glissez-déposez les cartes pour changer l'ordre. Cliquez sur une grille pour changer le doigté de l'accord.",
    position: "top-center", // Points to the chord list
    icon: Music4,
    color: "bg-indigo-500",
    highlightArea: "top-[20%] left-0 right-0 h-[300px]"
  },
  {
    title: "2. L'Intelligence Artificielle",
    desc: "En panne d'inspiration ? Cliquez sur le bouton 'AI' (Baguette Magique). Décrivez une ambiance (ex: 'Jazz Mélancolique') et Gemini composera tout pour vous.",
    position: "bottom-right-ai", // Points to AI button
    icon: Wand2,
    color: "bg-purple-500"
  },
  {
    title: "3. Le Groupe (Backing Track)",
    desc: "Activez le bouton 'BAND' pour ajouter instantanément une basse et une batterie qui suivent vos accords. Changez le style (Rock/Jazz/Funk) dans le Looper.",
    position: "bottom-left-band", // Points to Band button
    icon: Play,
    color: "bg-blue-500"
  },
  {
    title: "4. Votre Son (FX & Amplis)",
    desc: "Le bouton 'FX' ouvre votre pédalier. Choisissez votre ampli (Clean, Metal, British) et ajoutez des effets (Delay, Reverb) pour trouver votre ton unique.",
    position: "bottom-right-fx",
    icon: Sliders,
    color: "bg-orange-500"
  },
  {
    title: "5. Jouez en Live !",
    desc: "Branchez votre vraie guitare ! Ouvrez le MIXER (bouton Sliders), sélectionnez votre entrée micro, et activez le monitoring pour jouer avec les effets de l'appli.",
    position: "bottom-right-mixer",
    icon: Mic,
    color: "bg-red-500"
  }
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setCurrentStep(0);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Dynamic positioning classes
  const getPositionClasses = () => {
      switch (step.position) {
          case 'center': return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
          case 'top-center': return "top-[40%] left-1/2 -translate-x-1/2";
          case 'bottom-right-ai': return "bottom-24 right-24";
          case 'bottom-right-fx': return "bottom-24 right-48";
          case 'bottom-right-mixer': return "bottom-24 right-16";
          case 'bottom-left-band': return "bottom-24 left-24";
          default: return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      }
  };

  return (
    <div className="fixed inset-0 z-[200] pointer-events-auto">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500" />

      {/* Spotlight Effect (Optional visual cue) */}
      {step.highlightArea && (
           <div className={clsx("absolute border-2 border-white/30 bg-white/5 shadow-[0_0_100px_rgba(255,255,255,0.1)] rounded-xl transition-all duration-500", step.highlightArea)} />
      )}

      {/* Tutorial Card */}
      <AnimatePresence mode='wait'>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={clsx(
                "absolute w-full max-w-md bg-[#1e293b] border border-slate-600 rounded-2xl shadow-2xl overflow-hidden",
                getPositionClasses()
            )}
          >
             <div className={clsx("h-1.5 w-full", step.color)} />
             <div className="p-6">
                 <div className="flex items-start gap-4">
                     <div className={clsx("p-3 rounded-xl shrink-0 text-white shadow-lg", step.color)}>
                         <step.icon size={24} />
                     </div>
                     <div>
                         <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                         <p className="text-slate-300 text-sm leading-relaxed">{step.desc}</p>
                     </div>
                 </div>

                 <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-700">
                     <div className="flex gap-1">
                         {STEPS.map((_, i) => (
                             <div key={i} className={clsx("w-2 h-2 rounded-full transition-colors", i === currentStep ? step.color : "bg-slate-700")} />
                         ))}
                     </div>
                     <div className="flex gap-3">
                         <button 
                            onClick={onClose} 
                            className="text-xs font-bold text-slate-500 hover:text-white px-3 py-2"
                         >
                             PASSER
                         </button>
                         <button 
                            onClick={handleNext}
                            className={clsx(
                                "flex items-center gap-2 px-5 py-2 rounded-lg text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all active:scale-95",
                                step.color
                            )}
                         >
                             {isLast ? "C'EST PARTI !" : "SUIVANT"}
                             {isLast ? <Check size={16} /> : <ChevronRight size={16} />}
                         </button>
                     </div>
                 </div>
             </div>
          </motion.div>
      </AnimatePresence>
    </div>
  );
};
