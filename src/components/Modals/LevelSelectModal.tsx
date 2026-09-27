import React from 'react';
import { X, Check } from 'lucide-react';
import { GameMode } from '../../game/constants';

interface LevelSelectModalProps {
  isOpen: boolean;
  currentLevel: number;
  currentMode: GameMode;
  completedLevels: Set<string>;
  onSelectLevel: (level: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  currentLevel,
  currentMode,
  completedLevels,
  onSelectLevel,
  onClose,
}) => {
  if (!isOpen) return null;

  const maxLevel = Math.max(30, currentLevel + 8);
  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(5,8,12,0.82)] backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-[440px] max-h-[85vh] bg-[#131923] border border-[rgba(255,255,255,0.12)] rounded-[24px] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.7)] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-light text-white tracking-wide">
            Seleziona Flusso
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] text-[#8a99ad] hover:text-white flex items-center justify-center transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-xs text-[#8a99ad] mb-4">
          Scegli un livello da esplorare in modalità{' '}
          <span className="text-[#c4b5fd] font-medium capitalize">{currentMode}</span>.
        </p>

        {/* Level Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-5 sm:grid-cols-6 gap-2.5 my-2">
          {levels.map((lvl) => {
            const isCurrent = lvl === currentLevel;
            const key = `${currentMode}_${lvl}`;
            const isCompleted =
              completedLevels.has(key) || completedLevels.has(String(lvl));

            return (
              <button
                key={lvl}
                onClick={() => {
                  onSelectLevel(lvl);
                  onClose();
                }}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-[#a594f9] text-[#0a0e14] font-bold shadow-[0_0_16px_rgba(165,148,249,0.5)] scale-105'
                    : isCompleted
                    ? 'bg-[rgba(82,183,136,0.18)] text-[#95d5b2] border border-[rgba(82,183,136,0.4)] hover:bg-[rgba(82,183,136,0.28)]'
                    : 'bg-[rgba(255,255,255,0.04)] text-[#8a99ad] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                }`}
              >
                <span>{lvl}</span>
                {isCompleted && !isCurrent && (
                  <Check
                    size={10}
                    className="absolute bottom-1 right-1 text-[#52b788]"
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] text-xs text-[#8a99ad] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-all"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
};
