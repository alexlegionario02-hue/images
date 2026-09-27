import React from 'react';
import { PASTELS } from '../game/constants';
import { LevelData } from '../game/generator';

interface FooterProps {
  levelData: LevelData | null;
  paths: number[][];
  hintText: string;
  onClearColorPath: (colorIdx: number) => void;
}

export const Footer: React.FC<FooterProps> = ({
  levelData,
  paths,
  hintText,
  onClearColorPath,
}) => {
  if (!levelData) {
    return (
      <footer className="w-full max-w-[580px] flex flex-col items-center gap-2 px-4 pb-3.5 pt-1 z-10" />
    );
  }

  const totalCells = levelData.numCells;
  const connectedSet = new Set<number>();
  paths.forEach((p) => p.forEach((c) => connectedSet.add(c)));
  const connectedCount = connectedSet.size;
  const coveragePct = Math.round((connectedCount / totalCells) * 100);

  const isComplete = (idx: number): boolean => {
    const path = paths[idx];
    if (!path || path.length < 2) return false;
    const pair = levelData.pairs[idx];
    return (
      (path[0] === pair.start && path[path.length - 1] === pair.end) ||
      (path[0] === pair.end && path[path.length - 1] === pair.start)
    );
  };

  return (
    <footer className="w-full max-w-[580px] flex flex-col items-center gap-2 px-4 pb-3.5 pt-1 z-10">
      {/* Flow Progress Bar */}
      <div className="w-full max-w-[380px] h-[3px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden mb-0.5">
        <div
          className="h-full bg-gradient-to-r from-[#a594f9] via-[#48cae4] to-[#76c7b7] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${coveragePct}%` }}
        />
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between w-full max-w-[380px] text-[11px] text-[#7b8eab] px-1">
        <span>{connectedCount}/{totalCells} celle connesse</span>
        <span>{coveragePct}% mappa</span>
      </div>

      {/* Pairs Tracker Badges */}
      <div className="flex items-center justify-center flex-wrap gap-2.5 bg-[rgba(18,24,34,0.78)] border border-[rgba(255,255,255,0.08)] px-3.5 py-1.5 rounded-full backdrop-blur-md">
        {levelData.pairs.map((pair, idx) => {
          const pastel = PASTELS[pair.colorIndex % PASTELS.length];
          const complete = isComplete(idx);

          return (
            <button
              key={idx}
              onClick={() => onClearColorPath(idx)}
              className={`flex items-center gap-1.5 px-1 py-0.5 transition-all duration-200 cursor-pointer ${
                complete ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-75'
              }`}
              style={{ color: pastel.main }}
              title={`${pastel.name}: ${complete ? 'Connesso' : 'Incompleto'} (clicca per azzerare)`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: pastel.main,
                  boxShadow: complete ? `0 0 8px ${pastel.main}` : 'none',
                }}
              />
              <div
                className="w-3.5 h-[3px] rounded-full"
                style={{
                  backgroundColor: pastel.main,
                  opacity: complete ? 1 : 0.4,
                }}
              />
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: pastel.main,
                  boxShadow: complete ? `0 0 8px ${pastel.main}` : 'none',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Calming Hint Text */}
      <div className="text-[11px] font-light tracking-wide text-[#6c7c93] text-center min-h-[16px] transition-colors">
        {hintText}
      </div>
    </footer>
  );
};
