import { Delaunay, type Voronoi } from 'd3-delaunay';
import { GameMode } from './constants';

export interface Pair {
  colorIndex: number;
  start: number;
  end: number;
  syntheticLen: number;
}

export interface LevelData {
  levelIndex: number;
  mode: GameMode;
  numCells: number;
  numColors: number;
  points: [number, number][];
  polygons: ([number, number][])[];
  centroids: [number, number][];
  neighbors: number[][];
  delaunay: Delaunay<Float64Array>;
  voronoi: Voronoi<Float64Array>;
  pairs: Pair[];
  expectedCoverage: number;
  solPaths?: number[][];
}

// Deterministic PRNG
export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Centroid of a polygon
export function polygonCentroid(poly: [number, number][]): [number, number] {
  let area = 0,
    cx = 0,
    cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0],
      yi = poly[i][1];
    const xj = poly[j][0],
      yj = poly[j][1];
    const cross = xj * yi - xi * yj;
    area += cross;
    cx += (xi + xj) * cross;
    cy += (yi + yj) * cross;
  }
  area = area * 0.5;
  if (Math.abs(area) < 1e-5) return poly[0];
  const factor = 1 / (6 * area);
  return [cx * factor, cy * factor];
}

/* Backtracking Solver with Heuristic Sorting & BFS Reachability Pruning */
export function solveFlowGraph(
  neighbors: number[][],
  centroids: [number, number][],
  pairs: Pair[],
  numCells: number
): { solvable: boolean; paths: number[][] } {
  const K = pairs.length;
  const cellOwner = new Int8Array(numCells).fill(-1);
  const isAnchor = new Int8Array(numCells).fill(-1);

  for (let c = 0; c < K; c++) {
    isAnchor[pairs[c].start] = c;
    isAnchor[pairs[c].end] = c;
    cellOwner[pairs[c].start] = c;
  }

  let searchSteps = 0;
  const maxSteps = 4500;
  const solutionPaths: number[][] = [];

  function isReachable(pairIdx: number) {
    for (let c = pairIdx; c < K; c++) {
      const target = pairs[c].end;
      const currentHead =
        solutionPaths[c] && solutionPaths[c].length > 0
          ? solutionPaths[c][solutionPaths[c].length - 1]
          : pairs[c].start;

      if (currentHead === target) continue;

      const q = [currentHead];
      const visited = new Uint8Array(numCells);
      visited[currentHead] = 1;
      let canReach = false;
      let head = 0;

      while (head < q.length) {
        const u = q[head++];
        if (u === target) {
          canReach = true;
          break;
        }
        for (const v of neighbors[u]) {
          if (
            !visited[v] &&
            (v === target || (cellOwner[v] === -1 && isAnchor[v] === -1))
          ) {
            visited[v] = 1;
            q.push(v);
          }
        }
      }
      if (!canReach) return false;
    }
    return true;
  }

  function dfs(pairIdx: number, currentCell: number, currentPath: number[]): boolean {
    if (++searchSteps > maxSteps) return false;

    const target = pairs[pairIdx].end;
    if (currentCell === target) {
      solutionPaths[pairIdx] = currentPath.slice();
      if (pairIdx + 1 === K) return true; // All paths connected!
      const nextStart = pairs[pairIdx + 1].start;
      return dfs(pairIdx + 1, nextStart, [nextStart]);
    }

    if (!isReachable(pairIdx)) return false;

    // Heuristic: prioritize neighbors closer to target
    const cands = neighbors[currentCell].slice();
    cands.sort((a, b) => {
      const dA = Math.hypot(
        centroids[a][0] - centroids[target][0],
        centroids[a][1] - centroids[target][1]
      );
      const dB = Math.hypot(
        centroids[b][0] - centroids[target][0],
        centroids[b][1] - centroids[target][1]
      );
      return dA - dB;
    });

    for (const v of cands) {
      if (v === target) {
        currentPath.push(v);
        cellOwner[v] = pairIdx;
        if (dfs(pairIdx, v, currentPath)) return true;
        cellOwner[v] = -1;
        currentPath.pop();
      } else if (cellOwner[v] === -1 && isAnchor[v] === -1) {
        cellOwner[v] = pairIdx;
        currentPath.push(v);
        if (dfs(pairIdx, v, currentPath)) return true;
        cellOwner[v] = -1;
        currentPath.pop();
      }
    }
    return false;
  }

  const solvable = dfs(0, pairs[0].start, [pairs[0].start]);
  return { solvable, paths: solutionPaths };
}

/* Robust & Adaptive Level Generator with progressive relaxation */
export function generateLevel(
  levelIndex: number,
  mode: GameMode = 'challenging'
): LevelData {
  let numColors = 4;
  let minPathLen = 5,
    maxPathLen = 10;
  let minEuclidDist = 180;
  let numCells = 52;

  if (mode === 'zen') {
    numColors = levelIndex <= 3 ? 3 : 4;
    minPathLen = 4;
    maxPathLen = 7;
    minEuclidDist = 130;
    numCells = 44 + Math.min(16, levelIndex * 2);
  } else if (mode === 'challenging') {
    numColors = levelIndex <= 2 ? 4 : levelIndex <= 6 ? 5 : 6;
    minPathLen = 5;
    maxPathLen = 10;
    minEuclidDist = 180;
    numCells = 52 + Math.min(20, levelIndex * 2);
  } else if (mode === 'master') {
    numColors = levelIndex <= 2 ? 5 : 6;
    minPathLen = 6;
    maxPathLen = 12;
    minEuclidDist = 200;
    numCells = 58 + Math.min(22, levelIndex * 2);
  }

  const width = 800;
  const height = 800;
  const pad = 38;

  const maxAttempts = 250;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Progressive relaxation if level search is highly constrained
    const curMinEuclid = Math.max(100, minEuclidDist - Math.floor(attempt / 15) * 10);
    const curMinLen = Math.max(3, minPathLen - Math.floor(attempt / 30));
    const curAnchorDist = Math.max(65, 110 - Math.floor(attempt / 20) * 8);

    const modeOffset =
      mode === 'master' ? 88888 : mode === 'zen' ? 11111 : 44444;
    const seed =
      (levelIndex * 19349663 + attempt * 1013904223 + modeOffset) >>> 0;
    const rng = mulberry32(seed);

    // 1. Scatter points
    let points: [number, number][] = [];
    for (let i = 0; i < numCells; i++) {
      points.push([
        pad + rng() * (width - 2 * pad),
        pad + rng() * (height - 2 * pad),
      ]);
    }

    // 2. 2 iterations of Lloyd relaxation for harmonious Voronoi cells
    for (let it = 0; it < 2; it++) {
      const flat = new Float64Array(points.length * 2);
      for (let i = 0; i < points.length; i++) {
        flat[i * 2] = points[i][0];
        flat[i * 2 + 1] = points[i][1];
      }
      const del = new Delaunay(flat);
      const vor = del.voronoi([pad, pad, width - pad, height - pad]);
      const newPoints: [number, number][] = [];
      for (let i = 0; i < points.length; i++) {
        const poly = vor.cellPolygon(i) as [number, number][] | null;
        if (poly && poly.length >= 3) {
          const c = polygonCentroid(poly);
          newPoints.push([
            Math.max(pad, Math.min(width - pad, c[0])),
            Math.max(pad, Math.min(height - pad, c[1])),
          ]);
        } else {
          newPoints.push(points[i]);
        }
      }
      points = newPoints;
    }

    // Compute final Voronoi structure
    const flat = new Float64Array(points.length * 2);
    for (let i = 0; i < points.length; i++) {
      flat[i * 2] = points[i][0];
      flat[i * 2 + 1] = points[i][1];
    }
    const delaunay = new Delaunay(flat);
    const voronoi = delaunay.voronoi([pad, pad, width - pad, height - pad]);

    const neighbors: number[][] = [];
    const polygons: ([number, number][])[] = [];
    const centroids: [number, number][] = [];
    for (let i = 0; i < points.length; i++) {
      const poly = voronoi.cellPolygon(i) as [number, number][] | null;
      polygons.push(poly || []);
      centroids.push(poly ? polygonCentroid(poly) : points[i]);
      neighbors.push(Array.from(voronoi.neighbors(i)));
    }

    // 3. Synthesize winding paths that intertwine without overlap
    const cellOwner = new Int8Array(numCells).fill(-1);
    const pairs: Pair[] = [];
    const syntheticPaths: number[][] = [];
    let candidateSuccess = true;

    for (let c = 0; c < numColors; c++) {
      let start = -1;

      for (let tryCount = 0; tryCount < 60; tryCount++) {
        const cand = Math.floor(rng() * numCells);
        if (cellOwner[cand] === -1) {
          let minDistToOther = 999999;
          for (const p of pairs) {
            const ptA = centroids[cand];
            const ptB = centroids[p.start];
            const d = Math.hypot(ptA[0] - ptB[0], ptA[1] - ptB[1]);
            if (d < minDistToOther) minDistToOther = d;
          }
          if (pairs.length === 0 || minDistToOther > curAnchorDist) {
            start = cand;
            break;
          }
        }
      }

      if (start === -1) {
        candidateSuccess = false;
        break;
      }

      const targetLength =
        curMinLen + Math.floor(rng() * (maxPathLen - curMinLen + 1));
      let curr = start;
      const path = [curr];
      cellOwner[curr] = c;

      for (let s = 0; s < targetLength; s++) {
        const candidates = neighbors[curr].filter((n) => cellOwner[n] === -1);
        if (candidates.length === 0) break;

        candidates.sort((a, b) => {
          const degA = neighbors[a].filter((n) => cellOwner[n] === -1).length;
          const degB = neighbors[b].filter((n) => cellOwner[n] === -1).length;
          return degB + (rng() - 0.5) * 2 - degA;
        });

        const next = candidates[0];
        cellOwner[next] = c;
        path.push(next);
        curr = next;
      }

      if (path.length < curMinLen) {
        candidateSuccess = false;
        break;
      }

      const ptStart = centroids[path[0]];
      const ptEnd = centroids[path[path.length - 1]];
      const euclidDist = Math.hypot(
        ptStart[0] - ptEnd[0],
        ptStart[1] - ptEnd[1]
      );
      if (euclidDist < curMinEuclid) {
        candidateSuccess = false;
        break;
      }

      pairs.push({
        colorIndex: c,
        start: path[0],
        end: path[path.length - 1],
        syntheticLen: path.length,
      });
      syntheticPaths.push(path);
    }

    if (!candidateSuccess) {
      continue;
    }

    // 4. Verify Solvability
    // syntheticPaths guarantees that a valid, non-overlapping solution exists.
    // In addition, solveFlowGraph can attempt to find an alternate route or verify.
    const solverResult = solveFlowGraph(neighbors, centroids, pairs, numCells);
    const finalSolution = solverResult.solvable
      ? solverResult.paths
      : syntheticPaths;

    let totalPathLen = 0;
    for (const p of finalSolution) totalPathLen += p.length;
    const coveragePct = Math.round((totalPathLen / numCells) * 100);

    return {
      levelIndex,
      mode,
      numCells,
      numColors,
      points,
      polygons,
      centroids,
      neighbors,
      delaunay,
      voronoi,
      pairs,
      expectedCoverage: coveragePct,
      solPaths: finalSolution,
    };
  }

  // Fallback safe generator if high complexity reaches limit
  // Generates guaranteed safe level with 4 colors
  return generateLevel(levelIndex, 'zen');
}
