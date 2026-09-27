import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { Footer } from './components/Footer';
import { VictoryModal } from './components/Modals/VictoryModal';
import { DifficultyModal } from './components/Modals/DifficultyModal';
import { LevelSelectModal } from './components/Modals/LevelSelectModal';
import { CommunityModal } from './components/Modals/CommunityModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameMode } from './game/constants';
import { LevelData, generateLevel } from './game/generator';
import { AudioEngine } from './game/audio';

function CellflowGame() {
  const { user, profile, syncCloudSave } = useAuth();

  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentMode, setCurrentMode] = useState<GameMode>('challenging');
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [paths, setPaths] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hintText, setHintText] = useState<string>(
    'Trascina per collegare le ancore dello stesso colore senza intersecare altri flussi'
  );

  // Modals state
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isLevelsOpen, setIsLevelsOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  // Web Audio instance
  const audioRef = useRef<AudioEngine>(new AudioEngine(true));

  // 1. Initial Local Storage Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cellflow_progress_v2');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.currentLevel) setCurrentLevel(data.currentLevel);
        if (data.currentMode) setCurrentMode(data.currentMode);
        if (Array.isArray(data.completedLevels)) {
          setCompletedLevels(new Set(data.completedLevels));
        }
        if (data.sound !== undefined) {
          setSoundEnabled(!!data.sound);
          audioRef.current.enabled = !!data.sound;
        }
      }
    } catch (e) {
      console.warn('Local storage load error:', e);
    }
  }, []);

  // 2. Sync with Firebase Cloud Profile when available
  useEffect(() => {
    if (profile) {
      if (profile.completedLevels && profile.completedLevels.length > 0) {
        setCompletedLevels((prev) => {
          const merged = new Set([...prev, ...profile.completedLevels]);
          return merged;
        });
      }
      if (profile.currentMode) {
        setCurrentMode(profile.currentMode);
      }
      if (profile.currentLevel && profile.currentLevel > currentLevel) {
        setCurrentLevel(profile.currentLevel);
      }
    }
  }, [profile]);

  // Save progress helper
  const persistProgress = useCallback(
    (lvl: number, mode: GameMode, completed: Set<string>, sound: boolean) => {
      const completedArr = Array.from(completed);
      try {
        localStorage.setItem(
          'cellflow_progress_v2',
          JSON.stringify({
            currentLevel: lvl,
            currentMode: mode,
            completedLevels: completedArr,
            sound,
          })
        );
      } catch (e) {
        // Ignored
      }

      // Sync to Firebase if authenticated
      syncCloudSave({
        currentLevel: lvl,
        currentMode: mode,
        completedLevels: completedArr,
        soundEnabled: sound,
      });
    },
    [syncCloudSave]
  );

  // Load a puzzle level
  const loadPuzzle = useCallback((lvl: number, mode: GameMode) => {
    setLoading(true);
    setPaths([]);
    setHintText('Trascina per collegare le ancore dello stesso colore');

    setTimeout(() => {
      const data = generateLevel(lvl, mode);
      if (data) {
        setLevelData(data);
        setPaths(data.pairs.map(() => []));
        setHintText('Collega ciascuna coppia di ancore senza intersecare altri flussi');
      } else {
        console.error('Failed to generate level', lvl, mode);
      }
      setLoading(false);
    }, 40);
  }, []);

  // Load level on level or mode change
  useEffect(() => {
    loadPuzzle(currentLevel, currentMode);
  }, [currentLevel, currentMode, loadPuzzle]);

  // Audio Toggle
  const handleToggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    audioRef.current.enabled = nextSound;
    audioRef.current.init();
    persistProgress(currentLevel, currentMode, completedLevels, nextSound);
  };

  // Reset Level Paths
  const handleResetLevel = () => {
    if (!levelData) return;
    setPaths(levelData.pairs.map(() => []));
    setHintText('Percorsi azzerati. Riconnettiti con calma.');
  };

  // Clear single color path from footer badge
  const handleClearColorPath = (colorIdx: number) => {
    setPaths((prev) =>
      prev.map((p, idx) => (idx === colorIdx ? [] : p))
    );
  };

  // On puzzle completion
  const handleAllCompleted = () => {
    const key = `${currentMode}_${currentLevel}`;
    const nextCompleted = new Set(completedLevels);
    nextCompleted.add(key);
    nextCompleted.add(String(currentLevel));
    setCompletedLevels(nextCompleted);

    persistProgress(currentLevel, currentMode, nextCompleted, soundEnabled);
    audioRef.current.playWinSymphony();

    setTimeout(() => {
      setIsVictoryOpen(true);
    }, 400);
  };

  // Next level
  const handleNextLevel = () => {
    setIsVictoryOpen(false);
    const next = currentLevel + 1;
    setCurrentLevel(next);
    persistProgress(next, currentMode, completedLevels, soundEnabled);
  };

  // Replay current level
  const handleReplay = () => {
    setIsVictoryOpen(false);
    handleResetLevel();
  };

  // Select difficulty mode
  const handleSelectMode = (newMode: GameMode) => {
    if (newMode !== currentMode) {
      setCurrentMode(newMode);
      persistProgress(currentLevel, newMode, completedLevels, soundEnabled);
    }
  };

  // Select level from grid
  const handleSelectLevel = (selectedLevel: number) => {
    setCurrentLevel(selectedLevel);
    persistProgress(selectedLevel, currentMode, completedLevels, soundEnabled);
  };

  // Calculate current coverage percentage
  const totalCells = levelData?.numCells || 54;
  const connectedSet = new Set<number>();
  paths.forEach((p) => p.forEach((c) => connectedSet.add(c)));
  const coveragePct = Math.round((connectedSet.size / totalCells) * 100);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-3 max-h-screen overflow-hidden select-none">
      {/* Top Header */}
      <Header
        currentLevel={currentLevel}
        currentMode={currentMode}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onResetLevel={handleResetLevel}
        onOpenDifficulty={() => setIsDifficultyOpen(true)}
        onOpenLevels={() => setIsLevelsOpen(true)}
        onOpenCommunity={() => setIsCommunityOpen(true)}
      />

      {/* Main Interactive Board */}
      <Board
        levelData={levelData}
        loading={loading}
        paths={paths}
        audio={audioRef.current}
        onPathsChange={setPaths}
        onPathCompleted={() => {}}
        onAllCompleted={handleAllCompleted}
        onStep={(text) => setHintText(text)}
      />

      {/* Bottom Flow Tracker & Badges */}
      <Footer
        levelData={levelData}
        paths={paths}
        hintText={hintText}
        onClearColorPath={handleClearColorPath}
      />

      {/* Modals */}
      <VictoryModal
        isOpen={isVictoryOpen}
        level={currentLevel}
        mode={currentMode}
        coveragePct={coveragePct}
        totalColors={levelData?.pairs.length || 4}
        onNextLevel={handleNextLevel}
        onReplay={handleReplay}
      />

      <DifficultyModal
        isOpen={isDifficultyOpen}
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        onClose={() => setIsDifficultyOpen(false)}
      />

      <LevelSelectModal
        isOpen={isLevelsOpen}
        currentLevel={currentLevel}
        currentMode={currentMode}
        completedLevels={completedLevels}
        onSelectLevel={handleSelectLevel}
        onClose={() => setIsLevelsOpen(false)}
      />

      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CellflowGame />
    </AuthProvider>
  );
}
