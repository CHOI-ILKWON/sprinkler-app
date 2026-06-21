/**
 * 수리계산 모듈 — Hazen-Williams 공식
 * § NFPC 103 제10조④: 헤드 방수압력 0.1 MPa 이상 1.2 MPa 이하
 */

import type { PipeSectionInput, PipeSectionResult, HydraulicInput, HydraulicResult } from '../types';
import { FITTING_EQUIV, PIPE_INNER_DIAMETER, HEAD_PRESSURE } from '../constants/nfpc';

/**
 * Hazen-Williams 압력손실
 * ΔP(MPa) = 6.053×10⁵ × Q^1.85 / (C^1.85 × D^4.87) × L
 */
export function hazenWilliams(Q_lpm: number, C: number, D_mm: number, L_m: number): number {
  if (Q_lpm <= 0 || D_mm <= 0 || L_m <= 0) return 0;
  return (6.053e5 * Math.pow(Q_lpm, 1.85)) / (Math.pow(C, 1.85) * Math.pow(D_mm, 4.87)) * L_m;
}

function extractPipeMM(pipeSize: string): number {
  const match = pipeSize.match(/^(\d+)A/);
  return match ? parseInt(match[1]) : 50;
}

function calcEquivalentLength(pipeMM: number, fittings: PipeSectionInput['fittings']): number {
  const key = pipeMM as keyof typeof FITTING_EQUIV.elbow90;
  return (
    (FITTING_EQUIV.elbow90[key] ?? 0) * fittings.elbow90 +
    (FITTING_EQUIV.teeDiv[key]  ?? 0) * fittings.teeDiv  +
    (FITTING_EQUIV.osy[key]     ?? 0) * fittings.osy     +
    (FITTING_EQUIV.alarm[key]   ?? 0) * fittings.alarm   +
    (FITTING_EQUIV.check[key]   ?? 0) * fittings.check
  );
}

export function calcHydraulic(input: HydraulicInput): HydraulicResult {
  const { C, elevation, sections } = input;

  const sectionResults: PipeSectionResult[] = sections.map(sec => {
    const pipeMM = extractPipeMM(sec.pipeSize);
    const innerD = PIPE_INNER_DIAMETER[pipeMM] ?? 53.0;
    const equivLen = calcEquivalentLength(pipeMM, sec.fittings);
    const totalLen = sec.straightLength + equivLen;
    const pLoss = hazenWilliams(sec.flowLPM, C, innerD, totalLen);
    return { ...sec, innerDiameter: innerD, equivalentLength: equivLen, totalLength: totalLen, pressureLoss: pLoss };
  });

  const totalFrictionLoss = sectionResults.reduce((s, r) => s + r.pressureLoss, 0);
  const elevationLoss = elevation * 0.0098;
  const requiredSupplyPressure = totalFrictionLoss + elevationLoss + HEAD_PRESSURE.min;

  return {
    sections: sectionResults,
    totalFrictionLoss,
    elevationLoss,
    terminalPressure: HEAD_PRESSURE.min,
    requiredSupplyPressure,
    isPassing: true,
    isOverPressure: requiredSupplyPressure > HEAD_PRESSURE.max,
    law: HEAD_PRESSURE.law,
  };
}

export function buildDefaultSections(
  designFlow: number,
  flowPerHead: number,
  branchPipeSize: string,
  crossPipeSize: string,
  riserPipeSize: string,
  branchHeadsPerRow: number,
): PipeSectionInput[] {
  const branchFlow = Math.min(branchHeadsPerRow, 8) * flowPerHead;
  return [
    {
      name: '헤드 배관',
      pipeSize: '25A',
      flowLPM: flowPerHead,
      straightLength: 2.0,
      fittings: { elbow90: 2, teeDiv: 0, osy: 0, alarm: 0, check: 0 },
    },
    {
      name: '가지관',
      pipeSize: branchPipeSize,
      flowLPM: branchFlow,
      straightLength: 8.0,
      fittings: { elbow90: 2, teeDiv: 2, osy: 0, alarm: 0, check: 0 },
    },
    {
      name: '교차관',
      pipeSize: crossPipeSize,
      flowLPM: designFlow,
      straightLength: 10.0,
      fittings: { elbow90: 2, teeDiv: 1, osy: 0, alarm: 0, check: 0 },
    },
    {
      name: '주배관',
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
