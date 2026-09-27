import React, { useEffect, useState } from 'react';
import { X, Cloud, LogIn, LogOut, CheckCircle2, Trophy, Sparkles, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToRecentHarmonies, HarmonyRecordData } from '../../firebase';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, profile, signIn, signOut } = useAuth();
  const [harmonies, setHarmonies] = useState<HarmonyRecordData[]>([]);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Real-time listener for community harmonies
    const unsubscribe = subscribeToRecentHarmonies((records) => {
      setHarmonies(records);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(5,8,12,0.82)] backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-[460px] max-h-[85vh] bg-[#131923] border border-[rgba(255,255,255,0.12)] rounded-[24px] p-5 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.7)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[rgba(165,148,249,0.15)] flex items-center justify-center text-[#a594f9]">
              <Cloud size={16} />
            </div>
            <div>
              <h2 className="text-base font-medium text-white tracking-wide">
                Firebase Cloud & Community
              </h2>
              <p className="text-[11px] text-[#8a99ad]">
                Sincronizzazione progressi & feed armonie
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] text-[#8a99ad] hover:text-white flex items-center justify-center transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* User Auth Section */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 mb-4">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-9 h-9 rounded-full border border-[rgba(165,148,249,0.4)] object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#a594f9]/20 flex items-center justify-center text-[#c4b5fd] font-semibold text-sm">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {user.displayName || 'Armonista'}
                    </div>
                    <div className="text-[11px] text-[#8a99ad]">{user.email}</div>
                  </div>
                </div>

                <button
                  onClick={signOut}
                  className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.06)] text-[#8a99ad] hover:text-[#f28482] hover:bg-[rgba(242,132,130,0.12)] text-xs transition-all flex items-center gap-1"
                >
                  <LogOut size={13} />
                  <span>Esci</span>
                </button>
              </div>

              {/* Status details */}
              <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-[#8a99ad]">
                <span className="flex items-center gap-1 text-[#52b788]">
                  <CheckCircle2 size={13} />
                  Salvataggio Cloud attivo
                </span>
                <span>
                  Livelli risolti: <strong className="text-white">{profile?.totalSolved || 0}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3">
              <p className="text-xs text-[#8a99ad] leading-relaxed">
                Accedi con Google per salvare i tuoi progressi nel database Firebase e condividere le tue armonie con la community globale.
              </p>
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-[#0a0e14] hover:bg-[#f0f4f8] font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{signingIn ? 'Connessione...' : 'Accedi con Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Community Harmonies Stream */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white flex items-center gap-1.5">
              <Activity size={13} className="text-[#a594f9]" />
              Ultime Armonie della Community
            </span>
            <span className="text-[10px] text-[#8a99ad] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)]">
              Live Firestore
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[140px]">
            {harmonies.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8a99ad]">
                <Sparkles size={20} className="text-[#a594f9] mb-1.5 opacity-60" />
                <span className="text-xs">Nessuna armonia ancora registrata.</span>
                <span className="text-[11px] text-[#6c7c93]">
                  Completa un livello e condividi il tuo primo flusso!
                </span>
              </div>
            ) : (
              harmonies.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[rgba(165,148,249,0.1)] flex items-center justify-center text-[#c4b5fd]">
                      <Trophy size={13} />
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {h.userDisplayName}
                      </div>
                      <div className="text-[10px] text-[#8a99ad]">
                        Livello {h.level} • <span className="capitalize">{h.mode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[#52b788] font-semibold text-xs">
                      {h.coverage}%
                    </div>
                    <div className="text-[9px] text-[#6c7c93]">
                      copertura
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
