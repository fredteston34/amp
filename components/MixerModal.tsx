
import React, { useEffect, useState } from 'react';
import { X, Sliders, Speaker, Music, Zap, Guitar, Mic, Settings2, Power, Activity } from 'lucide-react';
import clsx from 'clsx';
import { InstrumentType } from '../types';
import { setInstrumentVolume, initAudio, getAvailableAudioInputs, toggleLiveGuitarInput, setInputGain } from '../services/audioService';

interface MixerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MixerModal: React.FC<MixerModalProps> = ({ isOpen, onClose }) => {
  const [volumes, setVolumes] = useState<Record<InstrumentType, number>>({
      master: -2,
      guitar: -3,
      bass: -4,
      drums: -2,
      lead: -4,
      vocals: 0
  });

  // Input State
  const [availableInputs, setAvailableInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [inputGainValue, setInputGainValue] = useState(1);

  // Ensure audio nodes are created and fetch inputs
  useEffect(() => {
      if (isOpen) {
          initAudio();
          getAvailableAudioInputs().then(devices => {
              setAvailableInputs(devices);
              if (devices.length > 0 && !selectedInputId) {
                  setSelectedInputId(devices[0].deviceId);
              }
          });
      }
  }, [isOpen]);

  const handleVolumeChange = (inst: InstrumentType, val: number) => {
      setVolumes(prev => ({ ...prev, [inst]: val }));
      setInstrumentVolume(inst, val);
  };

  const handleToggleMonitoring = async () => {
      const newState = !isMonitoring;
      try {
          const success = await toggleLiveGuitarInput(newState, selectedInputId || undefined);
          setIsMonitoring(success);
          // Refresh list if permission was just granted
          if (success) {
              const devices = await getAvailableAudioInputs();
              setAvailableInputs(devices);
          }
      } catch (e) {
          console.error("Failed to toggle monitoring", e);
          setIsMonitoring(false);
      }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newId = e.target.value;
      setSelectedInputId(newId);
      if (isMonitoring) {
          await toggleLiveGuitarInput(false);
          await toggleLiveGuitarInput(true, newId);
      }
  };

  const handleInputGain = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setInputGainValue(val);
      setInputGain(val);
  };

  if (!isOpen) return null;

  const Slider = ({ label, type, icon: Icon }: { label: string, type: InstrumentType, icon: any }) => (
      <div className="flex flex-col items-center gap-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 min-w-[80px]">
          <div className="text-slate-400 mb-1">{<Icon size={20} />}</div>
          <div className="h-40 relative flex justify-center py-2">
              <input 
                  type="range"
                  min="-60"
                  max="6"
                  value={volumes[type]}
                  onChange={(e) => handleVolumeChange(type, Number(e.target.value))}
                  className="appearance-none w-2 h-36 bg-slate-700 rounded-lg outline-none cursor-pointer vertical-slider shadow-inner"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '8px' }}
              />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase">{label}</span>
          <span className="text-[10px] text-slate-500 font-mono">{volumes[type].toFixed(0)}dB</span>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-3xl w-full max-w-4xl p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3 text-cyan-400">
            <div className="p-2 bg-cyan-900/30 rounded-lg">
                <Sliders size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Console de Mixage</h2>
                <p className="text-xs text-slate-400 font-medium">Entrées & Sorties</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* INPUT STAGE SECTION */}
        <div className="bg-[#131b2e] border border-slate-700 rounded-2xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Source Select */}
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-3">
                        <Mic size={18} className="text-red-400" />
                        <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">Source d'Entrée (Guitare/Mic)</span>
                    </div>
                    <div className="relative">
                        <select 
                            value={selectedInputId}
                            onChange={handleInputChange}
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 appearance-none font-medium"
                        >
                            <option value="">Microphone par défaut</option>
                            {availableInputs.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Périphérique ${device.deviceId.slice(0,5)}...`}
                                </option>
                            ))}
                        </select>
                        <Settings2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Input Gain */}
                <div className="flex flex-col w-full md:w-auto items-center md:items-start min-w-[150px]">
                     <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Gain d'Entrée (Pre-amp)</span>
                     <input 
                        type="range" 
                        min="0" max="3" step="0.1" 
                        value={inputGainValue}
                        onChange={handleInputGain}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                     />
                     <div className="flex justify-between w-full text-[9px] text-slate-500 mt-1 font-mono">
                         <span>0</span>
                         <span>Unity</span>
                         <span>+10dB</span>
                     </div>
                </div>

                {/* Monitoring Toggle */}
                <div className="flex flex-col items-center">
                    <button 
                        onClick={handleToggleMonitoring}
                        className={clsx(
                            "w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all shadow-lg active:scale-95",
                            isMonitoring 
                                ? "bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
                                : "bg-slate-800 border-slate-600 text-slate-500 hover:border-slate-500"
                        )}
                    >
                        <Power size={24} />
                    </button>
                    <span className={clsx("mt-2 text-[10px] font-black uppercase tracking-widest", isMonitoring ? "text-red-400" : "text-slate-600")}>
                        {isMonitoring ? "ON AIR" : "OFF"}
                    </span>
                </div>
            </div>
        </div>

        {/* OUTPUT MIXER SECTION */}
        <div>
            <div className="flex items-center gap-2 mb-4 px-2">
                <Activity size={18} className="text-cyan-400" />
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mixage Sortie</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 bg-slate-900/30 p-6 rounded-2xl border border-slate-700/50">
                <Slider label="Master" type="master" icon={Speaker} />
                <div className="w-[1px] bg-slate-700 mx-2 hidden sm:block h-48 self-center"></div>
                <Slider label="Batterie" type="drums" icon={Music} />
                <Slider label="Basse" type="bass" icon={Zap} />
                <Slider label="Guitare" type="guitar" icon={Guitar} />
                <Slider label="Lead" type="lead" icon={Zap} />
                <Slider label="Backing" type="vocals" icon={Mic} />
            </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-slate-500">
            Ajustez les niveaux avant d'exporter. Utilisez l'entrée (section rouge) pour brancher votre guitare réelle.
        </div>
      </div>
    </div>
  );
};
