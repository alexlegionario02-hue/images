import React from 'react';
import { Volume2, VolumeX, RotateCcw, LayoutGrid, Cloud, UserCheck, Flame } from 'lucide-react';
import { GameMode, GAME_MODES } from '../game/constants';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentLevel: number;
  currentMode: GameMode;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetLevel: () => void;
  onOpenDifficulty: () => void;
  onOpenLevels: () => void;
  onOpenCommunity: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLevel,
  currentMode,
  soundEnabled,
  onToggleSound,
  onResetLevel,
  onOpenDifficulty,
  onOpenLevels,
  onOpenCommunity,
}) => {
  const { user, profile } = useAuth();
  const modeInfo = GAME_MODES[currentMode];

  return (
    <header className="w-full max-w-[580px] flex items-center justify-between px-4 py-2.5 z-10">
      <div className="flex flex-col">
        <span className="text-[11px] font-bold tracking-[2.5px] uppercase text-[#8a99ad]">
          Cellflow
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xl font-light tracking-wide text-white">
            Livello {currentLevel}
          </span>
          <button
            onClick={onOpenDifficulty}
            className="text-[11px] px-2.5 py-0.5 rounded-full bg-[rgba(165,148,249,0.14)] text-[#c4b5fd] tracking-wide border border-[rgba(165,148,249,0.3)] hover:bg-[rgba(165,148,249,0.28)] hover:border-[rgba(165,148,249,0.55)] hover:text-white transition-all flex items-center gap-1 active:scale-95"
            title="Seleziona intensità del puzzle"
          >
            <span>{modeInfo.name}</span>
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Sound Toggle Button */}
        <button
          onClick={onToggleSound}
          className="w-9 h-9 rounded-full bg-[rgba(18,24,34,0.78)] border border-[rgba(255,255,255,0.08)] text-[#8a99ad] hover:text-white hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(30,40,56,0.9)] transition-all flex items-center justify-center active:scale-95 backdrop-blur-md"
          title={soundEnabled ? 'Disattiva suoni' : 'Attiva suoni'}
          aria-label="Audio"
        >
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>

        {/* Reset Current Paths */}
        <button
          onClick={onResetLevel}
          className="w-9 h-9 rounded-full bg-[rgba(18,24,34,0.78)] border border-[rgba(255,255,255,0.08)] text-[#8a99ad] hover:text-white hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(30,40,56,0.9)] transition-all flex items-center justify-center active:scale-95 backdrop-blur-md"
          title="Azzera percorsi attuali"
          aria-label="Ricomincia"
        >
          <RotateCcw size={16} />
        </button>

        {/* Levels Grid Dialog */}
        <button
          onClick={onOpenLevels}
          className="w-9 h-9 rounded-full bg-[rgba(18,24,34,0.78)] border border-[rgba(255,255,255,0.08)] text-[#8a99ad] hover:text-white hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(30,40,56,0.9)] transition-all flex items-center justify-center active:scale-95 backdrop-blur-md"
          title="Seleziona livello"
          aria-label="Livelli"
        >
          <LayoutGrid size={16} />
        </button>

        {/* Firebase Cloud Sync & Community Feed Button */}
        <button
          onClick={onOpenCommunity}
          className={`h-9 px-2.5 rounded-full border transition-all flex items-center gap-1.5 active:scale-95 backdrop-blur-md text-xs font-medium ${
            user
              ? 'bg-[rgba(82,183,136,0.15)] border-[rgba(82,183,136,0.35)] text-[#95d5b2] hover:bg-[rgba(82,183,136,0.25)] hover:text-white'
              : 'bg-[rgba(18,24,34,0.78)] border-[rgba(255,255,255,0.08)] text-[#8a99ad] hover:text-white hover:border-[rgba(255,255,255,0.25)]'
          }`}
          title={user ? `Sincronizzato: ${user.displayName || 'Utente'}` : 'Accedi e sincronizza con Firebase'}
          aria-label="Cloud e Community"
        >
          {user ? (
            <>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <UserCheck size={15} />
              )}
              <span className="hidden sm:inline text-[11px] max-w-[70px] truncate">
                {user.displayName?.split(' ')[0] || 'Sync'}
              </span>
            </>
          ) : (
            <>
              <Cloud size={15} />
              <span className="hidden sm:inline text-[11px]">Cloud</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
