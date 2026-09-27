import React from 'react';
import { GameMode, GAME_MODES } from '../../game/constants';
import { X, Check } from 'lucide-react';

interface DifficultyModalProps {
  isOpen: boolean;
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onClose: () => void;
}

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  isOpen,
  currentMode,
  onSelectMode,
  onClose,
}) => {
  if (!isOpen) return null;

  const modes: GameMode[] = ['zen', 'challenging', 'master'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(5,8,12,0.82)] backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-[420px] bg-[#131923] border border-[rgba(255,255,255,0.12)] rounded-[24px] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.7)] flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-2">
          <h2 className="text-xl font-light text-white tracking-wide">
            Difficoltà del Flusso
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] text-[#8a99ad] hover:text-white flex items-center justify-center transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-xs text-[#8a99ad] text-left w-full mb-4">
          Configura la complessità dei percorsi e la densità delle celle Voronoi.
        </p>

        <div className="w-full flex flex-col gap-2.5 mb-5">
          {modes.map((m) => {
            const info = GAME_MODES[m];
            const isSelected = currentMode === m;

            return (
              <button
                key={m}
                onClick={() => {
                  onSelectMode(m);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-[rgba(165,148,249,0.14)] border-[#a594f9] shadow-[0_0_15px_rgba(165,148,249,0.15)]'
                    : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium text-white flex items-center gap-1.5">
                    {info.name}
                    {isSelected && <Check size={14} className="text-[#a594f9]" />}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.08)] text-[#c4b5fd]">
                    {info.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[#8a99ad] leading-relaxed">
                  {info.description}
                </p>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] text-xs text-[#8a99ad] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-all"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
};
