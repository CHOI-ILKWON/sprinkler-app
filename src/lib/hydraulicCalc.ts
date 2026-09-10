/**
 * 수리계산 — Hazen-Williams
 *
 * 근거
 *  · NFTC 103 2.2.1.10  헤드 선단 방수압력 0.1 MPa 이상 1.2 MPa 이하
 *  · NFTC 103 2.5.3.3   배관의 구경은 수리계산에 의하거나 표 2.5.3.3에 따를 것
 *                       단서 — 가지배관 유속 6 ㎧, 그 밖의 배관 유속 10 ㎧를 초과할 수 없다
 *  · NFTC 103 2.1.1 단서 수리계산에 의하는 경우 수원은 1분당 송수량 × 20
 *
 * ※ 관부속 상당길이 표는 국내 화재안전기준에 없다. NFPA 13 계열 참고값이며
 *   실시설계에서는 제조사 자료 또는 프로젝트 시방서 값을 사용해야 한다.
 */

import type {
  PipeSectionInput,
  PipeSectionResult,
  HydraulicInput,
  HydraulicResult,
  LawCheck,
} from '../types';
import {
  FITTING_EQUIV,
  PIPE_INNER_DIAMETER,
  HEAD_PRESSURE,
  VELOCITY_LIMIT,
  MPA_PER_METER,
  HAZEN_WILLIAMS_CONST,
  HAZEN_WILLIAMS_NOTE,
  FITTING_EQUIV_NOTE,
  WATER_SUPPLY_MINUTES,
} from '../constants/nfpc';

/**
 * ΔP(MPa) = 6.053×10⁴ × Q^1.85 / (C^1.85 × D^4.87) × L
 * Q: L/min, D: ㎜, L: m
 * ※ 6.053×10⁵ 은 kgf/㎠ 기준 상수다 — MPa 로 쓰면 10배 과대계산된다.
 */
export function hazenWilliams(Q_lpm: number, C: number, D_mm: number, L_m: number): number {
  if (Q_lpm <= 0 || D_mm <= 0 || L_m <= 0) return 0;
  return ((HAZEN_WILLIAMS_CONST * Math.pow(Q_lpm, 1.85)) / (Math.pow(C, 1.85) * Math.pow(D_mm, 4.87))) * L_m;
}

function extractPipeMM(pipeSize: string): number {
  const match = pipeSize.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 50;
}

function calcEquivalentLength(pipeMM: number, fittings: PipeSectionInput['fittings']): number {
  const key = pipeMM as keyof typeof FITTING_EQUIV.elbow90;
  return (
    (FITTING_EQUIV.elbow90[key] ?? 0) * fittings.elbow90 +
    (FITTING_EQUIV.teeDiv[key] ?? 0) * fittings.teeDiv +
    (FITTING_EQUIV.osy[key] ?? 0) * fittings.osy +
    (FITTING_EQUIV.alarm[key] ?? 0) * fittings.alarm +
    (FITTING_EQUIV.check[key] ?? 0) * fittings.check
  );
}

/** 구간명이 가지배관이면 6 ㎧, 그 밖이면 10 ㎧ */
function velocityLimitFor(name: string): number {
  return name.includes('가지') ? VELOCITY_LIMIT.branch : VELOCITY_LIMIT.other;
}

function velocityOf(flowLPM: number, innerMM: number): number {
  if (flowLPM <= 0 || innerMM <= 0) return 0;
  const areaM2 = Math.PI * Math.pow(innerMM / 2 / 1000, 2);
  return flowLPM / 1000 / 60 / areaM2;
}

export function calcHydraulic(input: HydraulicInput): HydraulicResult {
  const { C, elevation, sections } = input;

  const sectionResults: PipeSectionResult[] = sections.map(sec => {
    const pipeMM = extractPipeMM(sec.pipeSize);
    const innerD = PIPE_INNER_DIAMETER[pipeMM] ?? 53.0;
    const equivLen = calcEquivalentLength(pipeMM, sec.fittings);
    const totalLen = sec.straightLength + equivLen;
    const pLoss = hazenWilliams(sec.flowLPM, C, innerD, totalLen);
    const v = velocityOf(sec.flowLPM, innerD);
    const vLimit = velocityLimitFor(sec.name);
    return {
      ...sec,
      innerDiameter: innerD,
      equivalentLength: equivLen,
      totalLength: totalLen,
      pressureLoss: pLoss,
      velocity: v,
      velocityLimit: vLimit,
      velocityOk: v <= vLimit,
    };
  });

  const totalFrictionLoss = sectionResults.reduce((s, r) => s + r.pressureLoss, 0);
  const elevationLoss = elevation * MPA_PER_METER;
  const requiredSupplyPressure = totalFrictionLoss + elevationLoss + HEAD_PRESSURE.min;

  const checks: LawCheck[] = [
    {
      label: '말단 헤드 방수압력',
      actual: `${HEAD_PRESSURE.min.toFixed(2)} MPa (설계 기준점)`,
      standard: `${HEAD_PRESSURE.min} MPa 이상 ${HEAD_PRESSURE.max} MPa 이하`,
      isPassing: true,
      law: HEAD_PRESSURE.law,
    },
    {
      label: '필요 송수압력',
      actual: `${requiredSupplyPressure.toFixed(3)} MPa`,
      standard: `${HEAD_PRESSURE.max} MPa 초과 시 감압장치 검토`,
      isPassing: requiredSupplyPressure <= HEAD_PRESSURE.max,
      isWarning: requiredSupplyPressure > HEAD_PRESSURE.max,
      law: HEAD_PRESSURE.law,
    },
    ...sectionResults.map(r => ({
      label: `${r.name} 유속`,
      actual: `${r.velocity.toFixed(2)} ㎧ (${r.pipeSize}, 내경 ${r.innerDiameter} ㎜)`,
      standard: `${r.velocityLimit} ㎧ 이하`,
      isPassing: r.velocityOk,
      law: VELOCITY_LIMIT.law,
    })),
    {
      label: '수리계산 시 수원',
      actual: '1분당 송수량 × 20',
      standard: `NFTC 103 2.1.1 단서 — ${WATER_SUPPLY_MINUTES}분 방수량 이상`,
      isPassing: true,
      isWarning: true,
      law: 'NFTC 103 2.1.1 단서',
    },
    {
      label: '압력손실 공식',
      actual: 'ΔP = 6.053×10⁴ × Q^1.85 / (C^1.85 × d^4.87) × L',
      standard: HAZEN_WILLIAMS_NOTE,
      isPassing: true,
      law: 'Hazen-Williams (국내 기준에 공식 자체는 규정 없음)',
    },
    {
      label: '관부속 상당길이',
      actual: 'NFPA 13 계열 참고값 적용',
      standard: FITTING_EQUIV_NOTE,
      isPassing: true,
      isWarning: true,
      law: '국내 기준에 규정 없음 (설계 시방)',
    },
  ];

  return {
    sections: sectionResults,
    totalFrictionLoss,
    elevationLoss,
    terminalPressure: HEAD_PRESSURE.min,
    requiredSupplyPressure,
    isPassing: requiredSupplyPressure <= HEAD_PRESSURE.max,
    isOverPressure: requiredSupplyPressure > HEAD_PRESSURE.max,
    checks,
    law: HEAD_PRESSURE.law,
  };
}

export function buildDefaultSections(
  designFlow: number,
  flowPerHead: number,
  branchPipeSize: string,
  crossPipeSize: string,
  riserPipeSize: string,
  headsPerBranchSide: number,
): PipeSectionInput[] {
  const branchFlow = headsPerBranchSide * flowPerHead;
  return [
    {
      name: '헤드 접속배관',
      pipeSize: '25A',
      flowLPM: flowPerHead,
      straightLength: 2.0,
      fittings: { elbow90: 2, teeDiv: 0, osy: 0, alarm: 0, check: 0 },
    },
    {
      name: '가지배관',
      pipeSize: branchPipeSize,
      flowLPM: branchFlow,
      straightLength: 8.0,
      fittings: { elbow90: 2, teeDiv: 2, osy: 0, alarm: 0, check: 0 },
    },
    {
      name: '교차배관',
      pipeSize: crossPipeSize,
      flowLPM: designFlow,
      straightLength: 10.0,
      fittings: { elbow90: 2, teeDiv: 1, osy: 0, alarm: 0, check: 0 },
    },
    {
      name: '수평주행배관',
      pipeSize: riserPipeSize,
      flowLPM: designFlow,
      straightLength: 15.0,
      fittings: { elbow90: 1, teeDiv: 1, osy: 1, alarm: 1, check: 1 },
    },
    {
      name: '입상관',
      pipeSize: riserPipeSize,
      flowLPM: designFlow,
      straightLength: 10.0,
      fittings: { elbow90: 1, teeDiv: 0, osy: 1, alarm: 0, check: 0 },
    },
  ];
}
