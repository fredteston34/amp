
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Music2, Sliders, Play, ArrowRight, Keyboard, BookOpen, HelpCircle, LayoutGrid, Mic, Zap, MousePointer, WifiOff, Download, Smartphone, Monitor, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAI: () => void;
  onLoadDemo: () => void;
  onStartTutorial: () => void; // Added prop
}

type Tab = 'START' | 'GUIDE' | 'SHORTCUTS' | 'TROUBLESHOOT';

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onOpenAI, onLoadDemo, onStartTutorial }) => {
  const [activeTab, setActiveTab] = useState<Tab>('START');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check local storage only on mount/open logic if needed
    // Logic is handled by parent regarding opening, here we handle the "save preference"
  }, []);

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isOpen) onClose();
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('vibechord_welcome_seen', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  const TabButton = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={clsx(
            "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-bold text-sm",
            activeTab === id 
                ? "bg-primary text-white shadow-lg shadow-green-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )}
      >
          <Icon size={18} />
          <span>{label}</span>
      </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0f172a] border border-slate-700 rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-2">
            <div className="mb-8 pl-2">
                <h1 className="text-2xl font-black text-white tracking-tighter italic">
                    VIBE<span className="text-primary">CHORD</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Help Center v3.1</p>
            </div>

            <TabButton id="START" icon={Sparkles} label="Bienvenue" />
            <TabButton id="GUIDE" icon={BookOpen} label="Guide des Outils" />
            <TabButton id="SHORTCUTS" icon={Keyboard} label="Raccourcis" />
            <TabButton id="TROUBLESHOOT" icon={HelpCircle} label="Dépannage" />

            <div className="mt-auto">
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <input 
                        type="checkbox" 
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-green-500 focus:ring-0" 
                    />
                    Ne plus afficher au démarrage
                </label>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 bg-[#1e293b] relative flex flex-col">
            <button onClick={handleClose} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors z-50">
                <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                <AnimatePresence mode='wait'>
                    
                    {/* --- TAB: START --- */}
                    {activeTab === 'START' && (
                        <motion.div 
                            key="start"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white">Le Studio Guitare Ultime.</h2>
                                <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                                    VibeChord combine un compositeur IA, un arrangeur de style DAW et une simulation d'amplis réaliste.
                                    Conçu pour les guitaristes, par des guitaristes.
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-between gap-6 mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><GraduationCap size={20} className="text-emerald-400"/> Nouveau ici ?</h3>
                                    <p className="text-sm text-slate-400">Suivez le guide interactif pour découvrir les fonctions clés en 30 secondes.</p>
                                </div>
                                <button 
                                    onClick={() => { handleClose(); onStartTutorial(); }}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 whitespace-nowrap"
                                >
                                    Lancer le Tutoriel
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => { onLoadDemo(); handleClose(); }}
                                    className="p-6 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-750 hover:border-primary/50 transition-all group text-left"
                                >
                                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-4 group-hover:scale-110 transition-transform">
                                        <Play size={24} fill="currentColor" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">Charger la Démo</h3>
                                    <p className="text-sm text-slate-400">Lancez une progression d'exemple pour tester le son immédiatement.</p>
                                </button>

                                <button 
                                    onClick={() => { handleClose(); onOpenAI(); }}
                                    className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 rounded-2xl hover:border-indigo-400 transition-all group text-left"
                                >
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                                        <Sparkles size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">Créer avec l'IA</h3>
                                    <p className="text-sm text-slate-400">Décrivez une ambiance ("Jazz Melancholique") et laissez Gemini composer.</p>
                                </button>
                            </div>

                            {/* INSTALLATION GUIDE */}
                            <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <WifiOff size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Comment installer l'App (Mode Hors-Ligne)</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        <div className="flex items-center gap-2 mb-2 text-slate-200 font-bold">
                                            <Monitor size={16} /> <span>Sur Ordinateur (Chrome/Edge)</span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Cliquez sur le bouton <strong>"INSTALLER (HORS-LIGNE)"</strong> situé en haut à droite de l'application, ou sur l'icône d'installation dans la barre d'adresse de votre navigateur.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        <div className="flex items-center gap-2 mb-2 text-slate-200 font-bold">
                                            <Smartphone size={16} /> <span>Sur Mobile (iOS/Android)</span>
                                        </div>
                                        <ul className="text-sm text-slate-400 space-y-2">
                                            <li className="flex items-start gap-2">
                                                <span className="bg-slate-700 text-white text-[10px] px-1.5 rounded mt-0.5">iOS</span>
                                                <span>Dans Safari, appuyez sur <strong>Partager</strong> <span className="inline-block border border-slate-600 px-1 rounded bg-slate-800">􀈂</span> puis <strong>"Sur l'écran d'accueil"</strong>.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="bg-slate-700 text-white text-[10px] px-1.5 rounded mt-0.5">Android</span>
                                                <span>Dans Chrome, ouvrez le menu (3 points) et choisissez <strong>"Installer l'application"</strong>.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- TAB: GUIDE --- */}
                    {activeTab === 'GUIDE' && (
                        <motion.div 
                            key="guide"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                             <div>
                                <h2 className="text-3xl font-bold text-white mb-6">Guide des Fonctionnalités</h2>
                                <div className="space-y-6">
                                    <FeatureRow 
                                        icon={LayoutGrid} color="text-orange-400" bg="bg-orange-500/10"
                                        title="L'Arrangeur (Grille)"
                                        desc="C'est votre espace principal. Glissez-déposez les accords pour changer l'ordre. Cliquez sur la grille d'un accord pour modifier le doigté (clic simple = ajouter doigt, clic sur le même = mute)."
                                    />
                                    <FeatureRow 
                                        icon={Mic} color="text-red-400" bg="bg-red-500/10"
                                        title="Looper & Enregistrement"
                                        desc="Ouvrez le Looper pour enregistrer votre voix ou une vraie guitare par dessus la grille. Utilisez un casque pour éviter le larsen !"
                                    />
                                    <FeatureRow 
                                        icon={Sliders} color="text-cyan-400" bg="bg-cyan-500/10"
                                        title="Pédalier FX & Amplis"
                                        desc="Sculptez votre son. Choisissez parmi 8 modèles d'amplis (Clean, British, Metal...) et ajoutez Chorus, Delay, Reverb et Overdrive."
                                    />
                                    <FeatureRow 
                                        icon={Music2} color="text-yellow-400" bg="bg-yellow-500/10"
                                        title="Backing Track (Band)"
                                        desc="Activez le mode 'BAND' pour qu'une basse et une batterie IA accompagnent automatiquement vos accords en temps réel."
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- TAB: SHORTCUTS --- */}
                    {activeTab === 'SHORTCUTS' && (
                        <motion.div 
                            key="shortcuts"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-3xl font-bold text-white mb-8">Raccourcis Clavier</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ShortcutKey keys={['Espace']} desc="Lecture / Pause" />
                                <ShortcutKey keys={['Ctrl', 'Z']} desc="Annuler la dernière action" />
                                <ShortcutKey keys={['Ctrl', 'Shift', 'Z']} desc="Rétablir (Redo)" />
                                <ShortcutKey keys={['Clic Droit (Accord)']} desc="Menu contextuel rapide (Copier/Coller)" />
                                <ShortcutKey keys={['Esc']} desc="Fermer les fenêtres modales" />
                            </div>
                        </motion.div>
                    )}

                    {/* --- TAB: TROUBLESHOOT --- */}
                    {activeTab === 'TROUBLESHOOT' && (
                        <motion.div 
                            key="troubleshoot"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-3xl font-bold text-white mb-6">Dépannage</h2>
                            
                            <div className="space-y-6">
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500" /> Pas de son ?
                                    </h3>
                                    <ul className="list-disc list-inside text-slate-400 space-y-2 ml-2">
                                        <li>Vérifiez que le volume de votre appareil est monté.</li>
                                        <li>Cliquez n'importe où sur la page pour "réveiller" le moteur audio (les navigateurs bloquent le son auto).</li>
                                        <li>Vérifiez le <strong>Mixer</strong> pour voir si le Master n'est pas à -inf.</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" /> Latence / Craquements ?
                                    </h3>
                                    <p className="text-slate-400 mb-2">
                                        VibeChord utilise des technologies web avancées. Pour une performance optimale :
                                    </p>
                                    <ul className="list-disc list-inside text-slate-400 space-y-2 ml-2">
                                        <li>Utilisez de préférence <strong>Google Chrome</strong> ou Edge sur Desktop.</li>
                                        <li>Fermez les autres onglets gourmands (YouTube, etc.).</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>

      </div>
    </div>
  );
};

// Helper Components
const FeatureRow = ({ icon: Icon, color, bg, title, desc }: any) => (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className={`p-3 rounded-xl ${bg} ${color} h-fit`}>
            <Icon size={24} />
        </div>
        <div>
            <h3 className={`font-bold text-lg ${color}`}>{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm mt-1">{desc}</p>
        </div>
    </div>
);

const ShortcutKey = ({ keys, desc }: { keys: string[], desc: string }) => (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <span className="text-slate-300 font-medium">{desc}</span>
        <div className="flex gap-2">
            {keys.map((k, i) => (
                <span key={i} className="px-3 py-1.5 bg-slate-900 border-b-2 border-slate-600 rounded-lg text-xs font-black text-slate-400 uppercase font-mono">
                    {k}
                </span>
            ))}
        </div>
    </div>
);
