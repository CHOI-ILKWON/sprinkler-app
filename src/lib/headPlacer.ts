import type { Room, RoomPlacement, PipeSize, SystemType } from '../types';
import { RISK_TABLE, PIPE_BY_HEADS, MAX_HEADS_PER_BRANCH } from '../constants/nfpc';
import { selectHead } from './headSpec';

export function placeHeads(room: Room, system: SystemType): RoomPlacement {
  const risk = RISK_TABLE[room.risk];

  const hx = Math.ceil(room.w / risk.spacing);
  const hy = Math.ceil(room.d / risk.spacing);
  const heads = hx * hy;

  const actualSpacingX = room.w / hx;
  const actualSpacingY = room.d / hy;

  const spacingOk =
    actualSpacingX <= risk.spacing && actualSpacingY <= risk.spacing;

  const wallDistX = actualSpacingX / 2;
  const wallDistY = actualSpacingY / 2;

  const headType = selectHead(room.risk, system);
  const flowPerHead = risk.flow;
  const roomFlow = heads * flowPerHead;

  // 가지관: 한 행의 헤드 수 기준
  const branchPipe = getPipeSizeByHeads(hx);
  // 교차관: 실 전체 헤드 수 기준
  const crossPipe = getPipeSizeByHeads(heads);

  return {
    room,
    hxCount: hx,
    hyCount: hy,
    heads,
    actualSpacingX,
    actualSpacingY,
    spacingOk,
    wallDistX,
    wallDistY,
    flowPerHead,
    roomFlow,
    headType,
    branchPipe,
    crossPipe,
  };
}

export function getBranchWarning(hxCount: number): string | null {
  if (hxCount > MAX_HEADS_PER_BRANCH) {
    return `⚠ 가지관 헤드 ${hxCount}개 — 최대 ${MAX_HEADS_PER_BRANCH}개 초과 (NFPC 103 제6조②), 가지관 분리 필요`;
  }
  return null;
}

function getPipeSizeByHeads(heads: number): PipeSize {
  const entry = PIPE_BY_HEADS.find(p => heads <= p.maxHeads)!;
  return { size: entry.size, mm: entry.mm };
}
