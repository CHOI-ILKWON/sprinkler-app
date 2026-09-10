/**
 * 표 2.5.3.3 스프링클러헤드 수별 급수관의 구경
 *
 * 어느 란(가/나/다)을 쓰는지가 핵심이다 — [비고] 2·3·4·5
 *   가 : 폐쇄형 헤드 (원칙)
 *   나 : 폐쇄형 헤드 + 반자 아래·반자 속 헤드를 동일 급수관 가지관상에 병설
 *   다 : 2.7.3.1의 경우(무대부·특수가연물) 폐쇄형 / 개방형 30개 이하
 */

import type { PipeColumn, PipeSize, HazardClass } from '../types';
import { PIPE_SIZES_2533, PIPE_TABLE_2533, PIPE_TABLE_LAW } from '../constants/nfpc';
import type { SystemType } from '../types';

/** 적용할 란 결정 */
export function selectPipeColumn(
  hazard: HazardClass,
  system: SystemType,
  ceilingVoidHeads = false,
): { column: PipeColumn; reason: string } {
  if (system === 'deluge') {
    return { column: '다', reason: '개방형 헤드 — 방수구역 30개 이하 (표 2.5.3.3 [비고] 5)' };
  }
  if (hazard === 'special') {
    return { column: '다', reason: '무대부·특수가연물 저장·취급 장소 (표 2.5.3.3 [비고] 4)' };
  }
  if (ceilingVoidHeads) {
    return { column: '나', reason: '반자 아래·반자 속 헤드를 동일 가지관에 병설 (표 2.5.3.3 [비고] 3)' };
  }
  return { column: '가', reason: '폐쇄형 헤드 (표 2.5.3.3 [비고] 2)' };
}

/** 헤드 수에 대응하는 급수관 구경 */
export function pipeSizeByHeads(heads: number, column: PipeColumn = '가'): PipeSize {
  const limits = PIPE_TABLE_2533[column];
  for (let i = 0; i < PIPE_SIZES_2533.length; i++) {
    if (heads <= limits[i]) {
      const mm = PIPE_SIZES_2533[i];
      return { size: `${mm}A`, mm };
    }
  }
  return { size: '150A', mm: 150 };
}

/**
 * [비고] 2 — 100개 이상의 헤드를 담당하는 급수배관(또는 밸브)의 구경을 100 ㎜로 할 경우에는
 * 수리계산을 통하여 2.5.3.3 단서의 유속에 적합하도록 할 것
 */
export function needsHydraulicVerification(heads: number, pipe: PipeSize, column: PipeColumn): boolean {
  return column === '가' && heads >= 100 && pipe.mm === 100;
}

export const PIPE_TABLE_SOURCE = PIPE_TABLE_LAW;
