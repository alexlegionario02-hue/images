import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LevelData } from '../game/generator';
import { AudioEngine } from '../game/audio';
import { renderBoard } from '../game/renderer';

interface BoardProps {
  levelData: LevelData | null;
  loading: boolean;
  paths: number[][];
  audio: AudioEngine;
  onPathsChange: (newPaths: number[][]) => void;
  onPathCompleted: (colorIdx: number) => void;
  onAllCompleted: () => void;
  onStep: (text: string) => void;
}

export const Board: React.FC<BoardProps> = ({
  levelData,
  loading,
  paths,
  audio,
  onPathsChange,
  onPathCompleted,
  onAllCompleted,
  onStep,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [isPointerDown, setIsPointerDown] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<number>(-1);

  // Keep a ref of paths to avoid stale closures during high-frequency pointer movements
  const pathsRef = useRef<number[][]>(paths);
  pathsRef.current = paths;

  const activeColorRef = useRef<number | null>(activeColor);
  activeColorRef.current = activeColor;

  const isPointerDownRef = useRef<boolean>(isPointerDown);
  isPointerDownRef.current = isPointerDown;

  const hoveredCellRef = useRef<number>(hoveredCell);
  hoveredCellRef.current = hoveredCell;

  const levelDataRef = useRef<LevelData | null>(levelData);
  levelDataRef.current = levelData;

  // Handle Canvas Resizing
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  // Animation render loop
  useEffect(() => {
    let animId: number;
    let startTime = performance.now();

    const renderLoop = (now: number) => {
      if (canvasRef.current && containerRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const rect = containerRef.current.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const scale = (rect.width / 800) * dpr;

          renderBoard(
            ctx,
            canvasRef.current.width,
            canvasRef.current.height,
            scale,
            levelDataRef.current,
            pathsRef.current,
            hoveredCellRef.current,
            isPointerDownRef.current,
            now - startTime
          );
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Coordinate mapping
  const getCoord = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 800 / rect.height;
    return {
      x: Math.max(0, Math.min(800, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(800, (e.clientY - rect.top) * scaleY)),
    };
  };

  const findCellAt = (x: number, y: number): number => {
    const currentData = levelDataRef.current;
    if (!currentData || !currentData.delaunay) return -1;
    const cell = currentData.delaunay.find(x, y);
    const poly = currentData.polygons[cell];
    if (!poly || poly.length < 3) return -1;
    return cell;
  };

  // Pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    audio.init();

    if (canvasRef.current && canvasRef.current.setPointerCapture) {
      try {
        canvasRef.current.setPointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }

    const { x, y } = getCoord(e);
    const cell = findCellAt(x, y);
    const currentData = levelDataRef.current;
    if (cell === -1 || !currentData) return;

    setIsPointerDown(true);
    setHoveredCell(cell);

    // 1. Check if clicked an anchor
    const anchorPairIdx = currentData.pairs.findIndex(
      (p) => p.start === cell || p.end === cell
    );
    if (anchorPairIdx !== -1) {
      setActiveColor(anchorPairIdx);
      const nextPaths = pathsRef.current.map((p, i) =>
        i === anchorPairIdx ? [cell] : p
      );
      pathsRef.current = nextPaths;
      onPathsChange(nextPaths);
      audio.playCellTone(anchorPairIdx, 0);
      onStep('Flusso avviato, guida il percorso verso la seconda ancora');
      return;
    }

    // 2. Check if clicked inside an existing path
    for (let c = 0; c < pathsRef.current.length; c++) {
      const idxInPath = pathsRef.current[c].indexOf(cell);
      if (idxInPath !== -1) {
        setActiveColor(c);
        const truncated = pathsRef.current[c].slice(0, idxInPath + 1);
        const nextPaths = pathsRef.current.map((p, i) =>
          i === c ? truncated : p
        );
        pathsRef.current = nextPaths;
        onPathsChange(nextPaths);
        audio.playCellTone(c, idxInPath);
        onStep('Ripreso flusso da questo punto');
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || activeColorRef.current === null) return;
    const currentData = levelDataRef.current;
    if (!currentData) return;

    const { x, y } = getCoord(e);
    const cell = findCellAt(x, y);
    if (cell === -1) return;
    setHoveredCell(cell);

    const c = activeColorRef.current;
    const currentPath = pathsRef.current[c];
    if (!currentPath || currentPath.length === 0) return;

    const head = currentPath[currentPath.length - 1];
    if (cell === head) return;

    // 1. Backtracking check: moving back to previous cell pops head
    if (currentPath.length >= 2 && currentPath[currentPath.length - 2] === cell) {
      const popped = currentPath.slice(0, -1);
      const nextPaths = pathsRef.current.map((p, idx) =>
        idx === c ? popped : p
      );
      pathsRef.current = nextPaths;
      onPathsChange(nextPaths);
      audio.playCellTone(c, popped.length);
      return;
    }

    // 2. Must be an adjacent neighbor of head
    const neighbors = currentData.neighbors[head];
    if (!neighbors || !neighbors.includes(cell)) return;

    // 3. Cannot reuse cell already in this path
    if (currentPath.includes(cell)) return;

    // 4. Cannot cross other color paths
    for (let i = 0; i < pathsRef.current.length; i++) {
      if (i !== c && pathsRef.current[i].includes(cell)) {
        return;
      }
    }

    // 5. Cannot step onto anchors of other colors
    for (let i = 0; i < currentData.pairs.length; i++) {
      if (i !== c) {
        if (
          currentData.pairs[i].start === cell ||
          currentData.pairs[i].end === cell
        ) {
          return;
        }
      }
    }

    const targetPair = currentData.pairs[c];
    const isTargetAnchor =
      (currentPath[0] === targetPair.start && cell === targetPair.end) ||
      (currentPath[0] === targetPair.end && cell === targetPair.start);

    // Append cell
    const updatedPath = [...currentPath, cell];
    const nextPaths = pathsRef.current.map((p, idx) =>
      idx === c ? updatedPath : p
    );
    pathsRef.current = nextPaths;
    onPathsChange(nextPaths);

    audio.playCellTone(c, updatedPath.length);

    if (isTargetAnchor) {
      audio.playConnectedChord(c);
      onPathCompleted(c);
      setIsPointerDown(false);
      setActiveColor(null);

      // Verify if all completed
      const allComplete = currentData.pairs.every((pair, pairIdx) => {
        const p = nextPaths[pairIdx];
        if (!p || p.length < 2) return false;
        return (
          (p[0] === pair.start && p[p.length - 1] === pair.end) ||
          (p[0] === pair.end && p[p.length - 1] === pair.start)
        );
      });

      if (allComplete) {
        onAllCompleted();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (canvasRef.current && canvasRef.current.releasePointerCapture) {
      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
    setIsPointerDown(false);
    setActiveColor(null);
  };

  return (
    <main className="relative flex-1 w-full max-w-[580px] flex items-center justify-center p-1">
      <div
        ref={containerRef}
        className="relative w-[min(88vw,86vh,520px)] h-[min(88vw,86vh,520px)] rounded-[28px] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_0_0_1px_rgba(255,255,255,0.08)] bg-[#0d121b] touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full block cursor-pointer touch-none"
        />

        {/* Harmonization Loader */}
        {loading && (
          <div className="absolute inset-0 bg-[#0d121b]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 transition-opacity">
            <div className="w-8 h-8 rounded-full border-2 border-[rgba(165,148,249,0.2)] border-t-[#a594f9] animate-spin" />
            <span className="text-xs text-[#8a99ad] font-light tracking-wide">
              Armonizzazione celle Voronoi...
            </span>
          </div>
        )}
      </div>
    </main>
  );
};
