import { PASTELS } from './constants';
import { LevelData } from './generator';

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  levelData: LevelData | null,
  paths: number[][],
  hoveredCell: number,
  isPointerDown: boolean,
  timeOffset: number = 0
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.scale(scale, scale);

  if (!levelData) {
    ctx.restore();
    return;
  }

  const { polygons, centroids, pairs } = levelData;

  const cellColorMap = new Map<number, number>();
  for (let c = 0; c < paths.length; c++) {
    for (const cellIdx of paths[c]) {
      cellColorMap.set(cellIdx, c);
    }
  }

  // 1. Draw Voronoi Cells (Polygons)
  for (let i = 0; i < polygons.length; i++) {
    const poly = polygons[i];
    if (!poly || poly.length < 3) continue;

    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let j = 1; j < poly.length; j++) {
      ctx.lineTo(poly[j][0], poly[j][1]);
    }
    ctx.closePath();

    let isAnchor = false;
    let anchorColor = -1;
    for (let c = 0; c < pairs.length; c++) {
      if (pairs[c].start === i || pairs[c].end === i) {
        isAnchor = true;
        anchorColor = c;
        break;
      }
    }

    const pathColor = cellColorMap.get(i);

    if (pathColor !== undefined) {
      const pastel = PASTELS[pairs[pathColor].colorIndex % PASTELS.length];
      ctx.fillStyle = pastel.fill;
      ctx.fill();

      ctx.strokeStyle = pastel.border;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    } else if (isAnchor) {
      const pastel = PASTELS[pairs[anchorColor].colorIndex % PASTELS.length];
      ctx.fillStyle = pastel.halo;
      ctx.fill();

      ctx.strokeStyle = pastel.border;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else {
      if (hoveredCell === i && isPointerDown) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.024)';
      }
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
  }

  // 2. Draw Smooth Continuous Flow Lines along Paths
  for (let c = 0; c < paths.length; c++) {
    const path = paths[c];
    if (path.length < 2) continue;

    const pastel = PASTELS[pairs[c].colorIndex % PASTELS.length];

    // Build curved path
    ctx.beginPath();
    const first = centroids[path[0]];
    if (!first) continue;
    ctx.moveTo(first[0], first[1]);

    for (let k = 1; k < path.length; k++) {
      const curr = centroids[path[k]];
      if (!curr) continue;
      if (k < path.length - 1) {
        const next = centroids[path[k + 1]];
        if (!next) continue;
        const mx = (curr[0] + next[0]) / 2;
        const my = (curr[1] + next[1]) / 2;
        ctx.quadraticCurveTo(curr[0], curr[1], mx, my);
      } else {
        ctx.lineTo(curr[0], curr[1]);
      }
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Pass 1: Wide soft halo
    ctx.strokeStyle = pastel.halo;
    ctx.lineWidth = 14;
    ctx.stroke();

    // Pass 2: Main vibrant color
    ctx.strokeStyle = pastel.main;
    ctx.lineWidth = 6.5;
    ctx.stroke();

    // Pass 3: Crisp luminous center
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Flow nodes
    for (let k = 0; k < path.length; k++) {
      const pt = centroids[path[k]];
      if (!pt) continue;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 4.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }

  // 3. Draw Colored Anchors (Concentric rings with pulsing glow)
  const time = timeOffset * 0.003;
  pairs.forEach((pair, c) => {
    const pastel = PASTELS[pair.colorIndex % PASTELS.length];
    const path = paths[c];
    const isComplete =
      path &&
      path.length >= 2 &&
      ((path[0] === pair.start && path[path.length - 1] === pair.end) ||
        (path[0] === pair.end && path[path.length - 1] === pair.start));

    const pulse = Math.sin(time + c * 1.5) * 2;

    [pair.start, pair.end].forEach((anchorCell) => {
      const center = centroids[anchorCell];
      if (!center) return;

      // Outer aura ring
      ctx.beginPath();
      ctx.arc(center[0], center[1], 18 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = pastel.main;
      ctx.lineWidth = isComplete ? 2.5 : 1.5;
      ctx.globalAlpha = isComplete ? 0.85 : 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Soft aura disk
      ctx.beginPath();
      ctx.arc(center[0], center[1], 13.5, 0, Math.PI * 2);
      ctx.fillStyle = pastel.halo;
      ctx.fill();

      // Anchor Orb
      ctx.beginPath();
      ctx.arc(center[0], center[1], 10, 0, Math.PI * 2);
      ctx.fillStyle = pastel.main;
      ctx.fill();

      // Inner luminous core
      ctx.beginPath();
      ctx.arc(center[0], center[1], 4.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
  });

  ctx.restore();
}
