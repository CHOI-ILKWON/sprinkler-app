/**
 * 헤드 배치
 *
 * 국내 기준은 「헤드 1개당 방호면적」을 규정하지 않는다.
 * 천장·반자·덕트·선반 등의 각 부분으로부터 하나의 헤드까지의 **수평거리 R**만 규정한다.
 *
 * 근거
 *  · NFTC 103 2.7.3     수평거리 — 무대부·특수가연물 1.7 m / 그 밖 2.1 m (내화구조 2.3 m)
 *                        ※ 2.7.3.2(구 랙식 창고 2.5 m)·2.7.3.3(구 아파트 3.2 m)은 2024.1.1 삭제
 *  · NFPC 609 제7조⑤1   창고 라지드롭형 — 특수가연물 1.7 m / 그 외 2.1 m(내화 2.3 m)
 *  · NFTC 103 2.5.9.2   한쪽 가지배관 헤드 8개 이하
 *  · NFPC 609 제7조④    창고시설은 한쪽 가지배관 헤드 4개 이하
 *  · NFTC 103 표 2.5.3.3 급수관 구경
 *
 * 정방형 배치에서 수평거리 R을 만족하는 최대 간격 S = 2R·cos45° = 1.414 R
 * (네 헤드의 중심점까지 거리가 S√2/2 ≤ R 이어야 하므로)
 */

import type { Room, RoomPlacement, SystemType, StandardCode } from '../types';
import { horizontalDistance, BRANCH_HEAD_LIMIT, WATER_SUPPLY } from '../constants/nfpc';
import { selectHead } from './headSpec';
import { pipeSizeByHeads, selectPipeColumn } from './pipeTable';

export const SQUARE_FACTOR = Math.SQRT2; // 2·cos45° = √2 ≒ 1.414

export function maxSpacingFor(r: number): number {
  return r * SQUARE_FACTOR;
}

export function placeHeads(
  room: Room,
  system: SystemType,
  standard: StandardCode,
  fireproof: boolean,
  ambientC = 30,
): RoomPlacement {
  const r = horizontalDistance(room.hazard, fireproof);
  const maxSpacing = maxSpacingFor(r);

  const hx = Math.max(1, Math.ceil(room.w / maxSpacing));
  const hy = Math.max(1, Math.ceil(room.d / maxSpacing));
  const heads = hx * hy;

  const actualSpacingX = room.w / hx;
  const actualSpacingY = room.d / hy;
  const spacingOk = actualSpacingX <= maxSpacing + 1e-9 && actualSpacingY <= maxSpacing + 1e-9;

  // 벽 ~ 첫 헤드는 헤드 간격의 1/2로 배치 → 모서리점까지 거리 = (S/2)·√2 ≤ R
  const wallDistX = actualSpacingX / 2;
  const wallDistY = actualSpacingY / 2;
  const cornerDistance = Math.hypot(wallDistX, wallDistY);
  const wallDistOk = cornerDistance <= r + 1e-9;

  // 가지배관은 세로(d) 방향으로 깔고 교차배관은 가로 방향으로 둔다고 가정.
  // 교차배관 1개가 담당하는 행 수 g에서 한쪽 가지배관 헤드 수 = ceil(g / 2)
  const limit = BRANCH_HEAD_LIMIT[standard].max;
  const crossMainCount = Math.max(1, Math.ceil(hy / (2 * limit)));
  const rowsPerCrossMain = Math.ceil(hy / crossMainCount);
  const headsPerBranchSide = Math.ceil(rowsPerCrossMain / 2);
  const branchOk = headsPerBranchSide <= limit;

  const { column } = selectPipeColumn(room.hazard, system, room.ceilingVoidHeads);
  const branchPipe = pipeSizeByHeads(headsPerBranchSide, column);
  const headsPerCrossMain = hx * rowsPerCrossMain;
  const crossPipe = pipeSizeByHeads(headsPerCrossMain, column);

  const headType = selectHead(standard, system, ambientC);
  const flowPerHead = WATER_SUPPLY[standard].flowPerHead;

  return {
    room,
    horizontalDistance: r,
    maxSpacing,
    hxCount: hx,
    hyCount: hy,
    heads,
    actualSpacingX,
    actualSpacingY,
    spacingOk,
    wallDistX,
    wallDistY,
    wallDistOk,
    flowPerHead,
    roomFlow: heads * flowPerHead,
    headType,
    headsPerBranchSide,
    branchLimit: limit,
    branchOk,
    pipeColumn: column,
    branchPipe,
    crossPipe,
    crossMainCount,
  };
}

/** 가지배관 헤드 개수 경고 — 원문 문언과 예외를 함께 반환 */
export function getBranchWarning(p: RoomPlacement, standard: StandardCode): string | null {
  if (p.branchOk) return null;
  const { max, law } = BRANCH_HEAD_LIMIT[standard];
  return `한쪽 가지배관 헤드 ${p.headsPerBranchSide}개 — ${max}개 이하 위반 (${law}). 교차배관을 ${p.crossMainCount + 1}개 이상으로 분할하십시오.`;
}
