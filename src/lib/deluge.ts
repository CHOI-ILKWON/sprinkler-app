/**
 * 개방형(일제살수식) 방수구역 계획 및 수리계산
 *
 * 근거
 *  · NFTC 103 2.1.1.2   최대 방수구역 헤드 30개 이하 → 설치헤드수 × 1.6 ㎥
 *                       30개 초과 → 수리계산
 *  · NFTC 103 2.2.1.13  송수량도 동일하게 30개를 경계로 간이식 / 수리계산
 *  · NFTC 103 표 2.5.3.3 [비고] 5  배관구경도 30개 경계
 *  · NFTC 103 2.4.1.1   하나의 방수구역은 2개 층에 미치지 않아야 한다
 *  · NFTC 103 2.4.1.2   방수구역마다 일제개방밸브를 설치
 *  · NFTC 103 2.4.1.3   하나의 방수구역 헤드 50개 이하.
 *                       2개 이상으로 나눌 경우 각 방수구역은 25개 이상
 *  · NFTC 103 2.1.1 단서 수리계산에 의하는 경우 수원 = 1분당 송수량 × 20
 *
 * ※ 「30개」는 층이 아니라 **방수구역(zone)** 단위다. 한 층에 방수구역을 여럿 둘 수 있고,
 *   방수구역마다 일제개방밸브가 하나씩 붙는다. 수원은 그중 「최대 방수구역」 하나로 정한다.
 */

import { hazenWilliams } from './hydraulicCalc';
import {
  DELUGE_ZONE_LIMIT,
  DELUGE_SIMPLE_METHOD_LIMIT,
  HEAD_PRESSURE,
  PIPE_INNER_DIAMETER,
  WATER_SUPPLY_MINUTES,
  VELOCITY_LIMIT,
} from '../constants/nfpc';

// ─────────────────────────────────────────────────────────────
// 1. 방수구역 분할 계획
// ─────────────────────────────────────────────────────────────

export interface DelugeZonePlan {
  totalHeads: number;
  zoneCount: number;
  headsPerZone: number[];
  maxZoneHeads: number;
  minZoneHeads: number;
  legal: boolean;
  simpleMethodOk: boolean;
  messages: { text: string; level: 'ok' | 'warn' | 'error'; law: string }[];
}

function distribute(total: number, zones: number): number[] {
  const base = Math.floor(total / zones);
  const rem = total % zones;
  return Array.from({ length: zones }, (_, i) => base + (i < rem ? 1 : 0));
}

export function planDelugeZones(totalHeads: number, zoneCount: number): DelugeZonePlan {
  const n = Math.max(1, Math.floor(zoneCount));
  const headsPerZone = distribute(Math.max(0, Math.floor(totalHeads)), n);
  const maxZoneHeads = Math.max(...headsPerZone, 0);
  const minZoneHeads = Math.min(...headsPerZone, 0);

  const messages: DelugeZonePlan['messages'] = [];
  let legal = true;

  if (maxZoneHeads > DELUGE_ZONE_LIMIT.maxHeads) {
    legal = false;
    messages.push({
      level: 'error',
      text: `방수구역 최대 ${maxZoneHeads}개 — 하나의 방수구역은 ${DELUGE_ZONE_LIMIT.maxHeads}개 이하여야 합니다. 구역을 더 나누십시오.`,
      law: DELUGE_ZONE_LIMIT.law,
    });
  }

  if (n >= 2 && minZoneHeads < DELUGE_ZONE_LIMIT.minHeadsWhenSplit) {
    legal = false;
    messages.push({
      level: 'error',
      text: `방수구역 최소 ${minZoneHeads}개 — 2개 이상의 방수구역으로 나눌 경우 하나의 방수구역은 ${DELUGE_ZONE_LIMIT.minHeadsWhenSplit}개 이상이어야 합니다. 구역 수를 줄이십시오.`,
      law: DELUGE_ZONE_LIMIT.law,
    });
  }

  const simpleMethodOk = maxZoneHeads <= DELUGE_SIMPLE_METHOD_LIMIT.heads;
  messages.push({
    level: simpleMethodOk ? 'ok' : 'warn',
    text: simpleMethodOk
      ? `최대 방수구역 ${maxZoneHeads}개 ≤ ${DELUGE_SIMPLE_METHOD_LIMIT.heads}개 — 수원·송수량·배관구경 모두 간이식 적용 가능`
      : `최대 방수구역 ${maxZoneHeads}개 > ${DELUGE_SIMPLE_METHOD_LIMIT.heads}개 — 수원·송수량·배관구경 모두 수리계산에 따라야 합니다`,
    law: DELUGE_SIMPLE_METHOD_LIMIT.laws.join(' / '),
  });

  messages.push({
    level: 'warn',
    text: `방수구역마다 일제개방밸브를 설치해야 하므로 밸브·감지회로·제어반 회선이 ${n}세트 필요합니다. 하나의 방수구역은 2개 층에 미치지 않아야 합니다.`,
    law: 'NFTC 103 2.4.1.1 / 2.4.1.2',
  });

  return { totalHeads, zoneCount: n, headsPerZone, maxZoneHeads, minZoneHeads, legal, simpleMethodOk, messages };
}

/** 30개 이하를 만족하면서 2.4.1.3에도 적합한 최소 구역 수. 불가능하면 null */
export function suggestZoneCount(totalHeads: number): { zoneCount: number | null; note: string } {
  const total = Math.max(0, Math.floor(totalHeads));
  if (total <= DELUGE_SIMPLE_METHOD_LIMIT.heads) {
    return { zoneCount: 1, note: '단일 방수구역으로 간이식 적용 가능합니다.' };
  }
  for (let n = 2; n <= Math.ceil(total / DELUGE_ZONE_LIMIT.minHeadsWhenSplit); n++) {
    const d = distribute(total, n);
    const mx = Math.max(...d);
    const mn = Math.min(...d);
    if (mx <= DELUGE_SIMPLE_METHOD_LIMIT.heads && mn >= DELUGE_ZONE_LIMIT.minHeadsWhenSplit) {
      return { zoneCount: n, note: `${n}개 구역으로 나누면 각 구역이 25~30개가 되어 간이식을 유지할 수 있습니다.` };
    }
  }
  // 30 이하를 못 맞추는 구간 — 50개 이하·25개 이상만 만족시키는 최소 구역 수
  for (let n = 1; n <= Math.ceil(total / DELUGE_ZONE_LIMIT.minHeadsWhenSplit); n++) {
    const d = distribute(total, n);
    const mx = Math.max(...d);
    const mn = Math.min(...d);
    if (mx <= DELUGE_ZONE_LIMIT.maxHeads && (n === 1 || mn >= DELUGE_ZONE_LIMIT.minHeadsWhenSplit)) {
      return {
        zoneCount: n,
        note:
          `헤드 ${total}개는 25개 이상·30개 이하를 동시에 만족시키는 분할이 없습니다. ` +
          `${n}개 구역이 2.4.1.3에는 적합하지만 각 구역이 30개를 넘으므로 수리계산을 피할 수 없습니다.`,
      };
    }
  }
  return { zoneCount: null, note: '2.4.1.3을 만족하는 분할을 찾지 못했습니다. 헤드 수 또는 배치를 재검토하십시오.' };
}

// ─────────────────────────────────────────────────────────────
// 2. 수리계산 — 말단 헤드부터 밸브까지 한 개씩 거슬러 올라간다
// ─────────────────────────────────────────────────────────────

export interface DelugeHydraulicInput {
  /** 한 가지배관에 달린 헤드 수 */
  headsPerBranch: number;
  /** 방수구역 내 가지배관 수 */
  branchCount: number;
  /** 헤드 간격 (m) */
  headSpacing: number;
  /** 가지배관 간격 (m) */
  branchSpacing: number;
  branchPipeMM: number;
  crossPipeMM: number;
  /** 헤드 방수상수 K (표준형 호칭15 = 80) */
  K: number;
  /** 조도계수 */
  C: number;
  /** 말단 헤드 방수압력 (MPa) — 기본 0.1 */
  terminalPressure: number;
}

export interface HeadStep {
  no: number;
  pressure: number;
  flow: number;
  cumulative: number;
  lossToNext: number;
  velocity: number;
}

export interface BranchStep {
  no: number;
  inletPressure: number;
  flow: number;
  cumulative: number;
  lossToNext: number;
  velocity: number;
}

export interface DelugeHydraulicResult {
  heads: HeadStep[];
  branches: BranchStep[];
  branchFlow: number;
  branchInletPressure: number;
  branchK: number;
  totalHeads: number;
  totalFlow: number;
  valvePressure: number;
  /** 간이식 값 (설치헤드수 × K√(10×0.1)) */
  simpleFlow: number;
  differencePct: number;
  /** 수리계산 기준 수원 = 총유량 × 20분 */
  waterVolume: number;
  simpleWaterVolume: number;
  maxBranchVelocity: number;
  maxCrossVelocity: number;
  overPressure: boolean;
}

function flowAt(K: number, pressureMPa: number): number {
  return K * Math.sqrt(10 * Math.max(0, pressureMPa));
}

function velocity(flowLPM: number, nominalMM: number): number {
  const innerMM = PIPE_INNER_DIAMETER[nominalMM];
  if (!innerMM || flowLPM <= 0) return 0;
  const areaM2 = Math.PI * Math.pow(innerMM / 2 / 1000, 2);
  return flowLPM / 1000 / 60 / areaM2;
}

export function calcDelugeHydraulic(input: DelugeHydraulicInput): DelugeHydraulicResult {
  const {
    headsPerBranch,
    branchCount,
    headSpacing,
    branchSpacing,
    branchPipeMM,
    crossPipeMM,
    K,
    C,
    terminalPressure,
  } = input;

  const branchInnerMM = PIPE_INNER_DIAMETER[branchPipeMM] ?? 41.6;
  const crossInnerMM = PIPE_INNER_DIAMETER[crossPipeMM] ?? 105.3;

  // ── 최원거리 가지배관: 말단 헤드 → 교차배관 방향으로 한 개씩
  const heads: HeadStep[] = [];
  let P = terminalPressure;
  let cum = 0;
  for (let i = 0; i < Math.max(1, headsPerBranch); i++) {
    if (i > 0) {
      const loss = hazenWilliams(cum, C, branchInnerMM, headSpacing);
      P += loss;
      heads[i - 1].lossToNext = loss;
    }
    const q = flowAt(K, P);
    cum += q;
    heads.push({
      no: i + 1,
      pressure: P,
      flow: q,
      cumulative: cum,
      lossToNext: 0,
      velocity: velocity(cum, branchPipeMM),
    });
  }

  const branchFlow = cum;
  // 마지막 헤드 → 교차배관 접속점까지 (헤드 간격의 1/2로 가정)
  const branchTailLoss = hazenWilliams(branchFlow, C, branchInnerMM, headSpacing / 2);
  const branchInletPressure = P + branchTailLoss;
  const branchK = branchFlow / Math.sqrt(10 * branchInletPressure);

  // ── 교차배관: 최원거리 가지배관 → 밸브 방향으로 한 개씩
  const branches: BranchStep[] = [];
  let Pb = branchInletPressure;
  let totalFlow = 0;
  for (let j = 0; j < Math.max(1, branchCount); j++) {
    if (j > 0) {
      const loss = hazenWilliams(totalFlow, C, crossInnerMM, branchSpacing);
      Pb += loss;
      branches[j - 1].lossToNext = loss;
    }
    const q = j === 0 ? branchFlow : branchK * Math.sqrt(10 * Pb);
    totalFlow += q;
    branches.push({
      no: j + 1,
      inletPressure: Pb,
      flow: q,
      cumulative: totalFlow,
      lossToNext: 0,
      velocity: velocity(totalFlow, crossPipeMM),
    });
  }

  const totalHeads = Math.max(1, headsPerBranch) * Math.max(1, branchCount);
  const simpleFlow = totalHeads * flowAt(K, HEAD_PRESSURE.min);

  return {
    heads,
    branches,
    branchFlow,
    branchInletPressure,
    branchK,
    totalHeads,
    totalFlow,
    valvePressure: Pb,
    simpleFlow,
    differencePct: simpleFlow > 0 ? ((totalFlow - simpleFlow) / simpleFlow) * 100 : 0,
    waterVolume: (totalFlow * WATER_SUPPLY_MINUTES) / 1000,
    simpleWaterVolume: (simpleFlow * WATER_SUPPLY_MINUTES) / 1000,
    maxBranchVelocity: Math.max(...heads.map(h => h.velocity), 0),
    maxCrossVelocity: Math.max(...branches.map(b => b.velocity), 0),
    overPressure: Pb > HEAD_PRESSURE.max,
  };
}

export const VELOCITY_REF = VELOCITY_LIMIT;
