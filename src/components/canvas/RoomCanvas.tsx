import { useRef, useEffect } from 'react';
import type { RoomPlacement, WarehouseZone, PipeCalcResult, WorstHead } from '../../types';
import { SIMULTANEOUS_HEADS, RISK_TABLE } from '../../constants/nfpc';

interface RoomCanvasProps {
  placements: RoomPlacement[];
  zones?: WarehouseZone[];
  pipeResult: PipeCalcResult | null;
  worstHead: WorstHead | null;
  onWorstHeadChange: (w: WorstHead) => void;
}

type HeadCoord = {
  canvasX: number;
  canvasY: number;
  crossCanvasX: number;
  mainCanvasY: number;
  placementIdx: number;
  absoluteIX: number;
  hyIdx: number;
  hxInGroup: number;
};

const MAX_BRANCH_HEADS = 8; // NFPC 103 제6조②
const ZONE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];
const SCALE    = 44;
const MARGIN_L = 48;
const MARGIN_T = 36;
const MARGIN_B = 52;
const ROOM_GAP = 28;
const CLICK_RADIUS = 14;

function splitBranchGroups(hxCount: number): number[] {
  if (hxCount <= MAX_BRANCH_HEADS) return [hxCount];
  const groups: number[] = [];
  let remaining = hxCount;
  const numGroups = Math.ceil(hxCount / MAX_BRANCH_HEADS);
  for (let g = 0; g < numGroups; g++) {
    const share = Math.ceil(remaining / (numGroups - g));
    groups.push(share);
    remaining -= share;
  }
  return groups;
}

function buildWorstHeadFromPlacement(
  p: RoomPlacement,
  idx: number,
  placements: RoomPlacement[],
  pipeResult: PipeCalcResult | null,
): WorstHead {
  const groups = splitBranchGroups(p.hxCount);
  const lastGroupIdx = groups.length - 1;
  const colOffset = groups.slice(0, lastGroupIdx).reduce((a, b) => a + b, 0);
  const lastHxInGroup = groups[lastGroupIdx] - 1;
  const lastAbsoluteIX = colOffset + lastHxInGroup;

  const dominantRisk = (['extra', 'ordinary2', 'ordinary1', 'light'] as const)
    .find(r => placements.some(pl => pl.room.risk === r)) ?? 'ordinary1';
  const simHeads = SIMULTANEOUS_HEADS[dominantRisk] ?? 20;
  const flowPerHead = RISK_TABLE[dominantRisk].flow;

  return {
    roomName: p.room.name,
    roomW: p.room.w,
    roomD: p.room.d,
    hxIndex: lastAbsoluteIX,
    hyIndex: p.hyCount - 1,
    hxCount: p.hxCount,
    hyCount: p.hyCount,
    hxInGroup: lastHxInGroup,
    branchPipeSize: p.branchPipe.size,
    crossPipeSize: p.crossPipe.size,
    riserPipeSize: pipeResult?.riserPipe.size ?? p.crossPipe.size,
    flowPerHead,
    designFlow: simHeads * flowPerHead,
  };
  void idx;
}

export default function RoomCanvas({ placements, zones, pipeResult, worstHead, onWorstHeadChange }: RoomCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headCoordsRef = useRef<HeadCoord[]>([]);

  // 최불리 헤드 초기값: placements 변경 시 마지막 실의 마지막 헤드로 자동 설정
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (placements.length === 0) return;
    const lastIdx = placements.length - 1;
    onWorstHeadChange(buildWorstHeadFromPlacement(placements[lastIdx], lastIdx, placements, pipeResult));
  }, [placements]);

  // 캔버스 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || placements.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    headCoordsRef.current = [];

    // 캔버스 크기 계산
    let totalW = MARGIN_L;
    const roomLayouts = placements.map(p => {
      const x = totalW;
      const w = p.room.w * SCALE;
      const h = p.room.d * SCALE;
      totalW += w + ROOM_GAP;
      return { x, y: MARGIN_T, w, h };
    });
    canvas.width  = totalW - ROOM_GAP + MARGIN_L;
    canvas.height = Math.max(...roomLayouts.map(r => r.h)) + MARGIN_T + MARGIN_B;

    // 배경
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 입상관
    const riserX = MARGIN_L - 18;
    const riserY1 = MARGIN_T;
    const riserY2 = canvas.height - MARGIN_B;
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(riserX, riserY1);
    ctx.lineTo(riserX, riserY2);
    ctx.stroke();
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('입상관', riserX, riserY1 - 6);

    // Pass 1: 실별 배경 + 배관 + 헤드
    placements.forEach((p, idx) => {
      const { x, y, w, h } = roomLayouts[idx];

      let zoneColor = '#4b5563';
      if (zones) {
        const zi = zones.findIndex(z => z.rooms.includes(p.room.name));
        if (zi >= 0) zoneColor = ZONE_COLORS[zi % ZONE_COLORS.length];
      }

      ctx.fillStyle = '#1a2235';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = zoneColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);

      const sx  = p.wallDistX * SCALE;
      const sy  = p.wallDistY * SCALE;
      const spx = p.actualSpacingX * SCALE;
      const spy = p.actualSpacingY * SCALE;

      const groups = splitBranchGroups(p.hxCount);
      const crossXPositions: number[] = [];
      let colOffset = 0;
      groups.forEach(groupCount => {
        crossXPositions.push(x + sx + colOffset * spx - spx * 0.5);
        colOffset += groupCount;
      });

      const mainY = y + Math.max(sy * 0.5, 10);

      // ① 주배관
      const lastCrossX = crossXPositions[crossXPositions.length - 1];
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(riserX, mainY);
      ctx.lineTo(lastCrossX, mainY);
      ctx.stroke();
      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(p.crossPipe.size, riserX + 2, mainY - 3);

      // ② 교차관
      crossXPositions.forEach((cx, gi) => {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, mainY);
        ctx.lineTo(cx, y + h);
        ctx.stroke();
        if (gi === 0) {
          ctx.fillStyle = '#6ee7b7';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.branchPipe.size, cx, mainY + 10);
        }
      });

      // ③ 가지관 + 헤드
      colOffset = 0;
      groups.forEach((groupCount, gi) => {
        const crossX = crossXPositions[gi];
        for (let iy = 0; iy < p.hyCount; iy++) {
          const branchY = y + sy + iy * spy;
          const lastHeadX = x + sx + (colOffset + groupCount - 1) * spx;
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(crossX, branchY);
          ctx.lineTo(lastHeadX + spx * 0.3, branchY);
          ctx.stroke();

          for (let ix = 0; ix < groupCount; ix++) {
            const hx = x + sx + (colOffset + ix) * spx;
            const hy = branchY;

            headCoordsRef.current.push({
              canvasX: hx, canvasY: hy,
              crossCanvasX: crossX, mainCanvasY: mainY,
              placementIdx: idx,
              absoluteIX: colOffset + ix,
              hyIdx: iy,
              hxInGroup: ix,
            });

            const isWorst = worstHead !== null
              && placements[idx].room.name === worstHead.roomName
              && (colOffset + ix) === worstHead.hxIndex
              && iy === worstHead.hyIndex;

            if (!isWorst) {
              ctx.beginPath();
              ctx.arc(hx, hy, 4, 0, Math.PI * 2);
              ctx.fillStyle = '#3b82f6';
              ctx.fill();
              ctx.strokeStyle = '#60a5fa';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(hx - 5, hy); ctx.lineTo(hx + 5, hy);
              ctx.moveTo(hx, hy - 5); ctx.lineTo(hx, hy + 5);
              ctx.stroke();
            }
          }
        }
        colOffset += groupCount;
      });

      // 실 이름
      ctx.fillStyle = '#f9fafb';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(p.room.name, x + w / 2, y + 3);
      ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#9ca3af';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.heads}개`, x + w / 2, y + h - 3);

      if (zones) {
        const zi = zones.findIndex(z => z.rooms.includes(p.room.name));
        if (zi >= 0) {
          ctx.fillStyle = ZONE_COLORS[zi % ZONE_COLORS.length];
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`Z${zi + 1}`, x + 3, y + 12);
        }
      }

      if (groups.length > 1) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`교차관 ${groups.length}열`, x + w - 2, y + 12);
      }
    });

    // Pass 2: 최불리 경로 + ★
    if (worstHead) {
      const wh = headCoordsRef.current.find(hc =>
        placements[hc.placementIdx].room.name === worstHead.roomName &&
        hc.absoluteIX === worstHead.hxIndex &&
        hc.hyIdx === worstHead.hyIndex
      );
      if (wh) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(wh.canvasX, wh.canvasY);
        ctx.lineTo(wh.crossCanvasX, wh.canvasY);
        ctx.lineTo(wh.crossCanvasX, wh.mainCanvasY);
        ctx.lineTo(riserX, wh.mainCanvasY);
        ctx.lineTo(riserX, riserY2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', wh.canvasX, wh.canvasY);
        ctx.textBaseline = 'alphabetic';
      }
    }

    // 범례
    const legendY = canvas.height - MARGIN_B + 12;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    const items: [string, string][] = [
      ['#60a5fa', '━ 주배관'],
      ['#10b981', '━ 교차관'],
      ['#34d399', '━ 가지관'],
      ['#3b82f6', '● 헤드'],
      ['#ef4444', '★ 최불리 헤드'],
      ['#ef4444', '- - 최불리 경로'],
    ];
    let lx = MARGIN_L;
    items.forEach(([color, label]) => {
      ctx.fillStyle = color;
      ctx.fillText(label, lx, legendY);
      lx += ctx.measureText(label).width + 16;
    });
    ctx.fillStyle = '#6b7280';
    ctx.fillText('§ NFPC 103 제6조②', lx, legendY);

  }, [placements, zones, worstHead]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || placements.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    let nearest: HeadCoord | null = null;
    let minDist = CLICK_RADIUS;
    for (const hc of headCoordsRef.current) {
      const dist = Math.sqrt((clickX - hc.canvasX) ** 2 + (clickY - hc.canvasY) ** 2);
      if (dist < minDist) { minDist = dist; nearest = hc; }
    }
    if (!nearest) return;

    const p = placements[nearest.placementIdx];
    const dominantRisk = (['extra', 'ordinary2', 'ordinary1', 'light'] as const)
      .find(r => placements.some(pl => pl.room.risk === r)) ?? 'ordinary1';
    const simHeads = SIMULTANEOUS_HEADS[dominantRisk] ?? 20;
    const flowPerHead = RISK_TABLE[dominantRisk].flow;

    onWorstHeadChange({
      roomName: p.room.name,
      roomW: p.room.w,
      roomD: p.room.d,
      hxIndex: nearest.absoluteIX,
      hyIndex: nearest.hyIdx,
      hxCount: p.hxCount,
      hyCount: p.hyCount,
      hxInGroup: nearest.hxInGroup,
      branchPipeSize: p.branchPipe.size,
      crossPipeSize: p.crossPipe.size,
      riserPipeSize: pipeResult?.riserPipe.size ?? p.crossPipe.size,
      flowPerHead,
      designFlow: simHeads * flowPerHead,
    });
  };

  if (placements.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-800 rounded-lg border border-gray-700 text-gray-500 text-sm">
        실 정보를 입력하면 배치도 및 배관 계통이 표시됩니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-2">
        <canvas ref={canvasRef} className="rounded cursor-pointer" onClick={handleClick} />
      </div>
      <p className="text-xs text-gray-500">
        헤드를 클릭하면 최불리 헤드(★)를 변경합니다. 선택된 헤드는 탭⑤ 수리계산 기준점으로 자동 연동됩니다.
      </p>
    </div>
  );
}
