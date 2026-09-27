import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, ArrowRight, RotateCcw, Share2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { submitHarmonyRecord } from '../../firebase';
import { GameMode } from '../../game/constants';

interface VictoryModalProps {
  isOpen: boolean;
  level: number;
  mode: GameMode;
  coveragePct: number;
  totalColors: number;
  onNextLevel: () => void;
  onReplay: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  level,
  mode,
  coveragePct,
  totalColors,
  onNextLevel,
  onReplay,
}) => {
  const { user, profile } = useAuth();
  const [shared, setShared] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      setShared(false);
      // Gentle celebratory pastel confetti burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#A594F9', '#48CAE4', '#52B788', '#F4A261', '#F28482'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShareToCommunity = async () => {
    if (!user || shared || sharing) return;
    setSharing(true);
    try {
      const recordId = `${user.uid}_${mode}_${level}_${Date.now()}`;
      await submitHarmonyRecord({
        id: recordId,
        userId: user.uid,
        userDisplayName: user.displayName || profile?.displayName || 'Armonista',
        mode,
        level,
        coverage: coveragePct,
        createdAt: new Date().toISOString(),
      });
      setShared(true);
    } catch (e) {
      console.error('Failed to share to community:', e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(5,8,12,0.82)] backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-[420px] bg-[#131923] border border-[rgba(255,255,255,0.12)] rounded-[24px] p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.7)] flex flex-col items-center">
        <div className="text-4xl mb-2">✨</div>
        <h2 className="text-2xl font-light tracking-wide text-white mb-1.5">
          Armonia Raggiunta
        </h2>
        <p className="text-xs text-[#8a99ad] leading-relaxed max-w-[320px] mb-4">
          Tutti i <span className="text-[#a594f9] font-medium">{totalColors} flussi</span> scivolano fluidamente senza sovrapporsi.
        </p>

        {/* Coverage pill */}
        <div className="mb-5 px-3 py-1.5 rounded-full bg-[rgba(165,148,249,0.12)] border border-[rgba(165,148,249,0.3)] text-xs text-[#c4b5fd]">
          Copertura Voronoi: <span className="font-semibold text-white">{coveragePct}%</span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onNextLevel}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#a594f9] to-[#76c7b7] text-[#0a0e14] font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(165,148,249,0.3)]"
          >
            <span>Prossimo Flusso</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onReplay}
            className="w-full py-2.5 px-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#8a99ad] text-xs font-medium hover:text-white hover:bg-[rgba(255,255,255,0.1)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>Rigioca Livello</span>
          </button>

          {/* Share to Firebase Community Feed */}
          {user && (
            <button
              onClick={handleShareToCommunity}
              disabled={shared || sharing}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                shared
                  ? 'bg-[rgba(82,183,136,0.2)] text-[#52b788] border border-[rgba(82,183,136,0.3)]'
                  : 'bg-[rgba(165,148,249,0.1)] text-[#c4b5fd] border border-[rgba(165,148,249,0.2)] hover:bg-[rgba(165,148,249,0.2)]'
              }`}
            >
              {shared ? (
                <>
                  <Check size={14} />
                  <span>Condiviso nella Community!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>{sharing ? 'Salvataggio...' : 'Condividi Armonia nel Cloud'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
