/**
 * 배관 산정
 *
 * 근거
 *  · NFTC 103 2.5.3.3      배관의 구경은 수리계산에 의하거나 표 2.5.3.3에 따름
 *                          단서 — 가지배관 유속 6 ㎧, 그 밖의 배관 유속 10 ㎧ 초과 불가
 *  · NFTC 103 표 2.5.3.3   가/나/다 3란 + [비고] 1~5
 *  · NFTC 103 2.5.10.1     교차배관 최소구경 40 ㎜
 *  · NFTC 103 2.5.5        연결송수관설비 겸용 시 주배관 100 ㎜ 이상
 *  · NFPC 609 제7조④       창고 한쪽 가지배관 4개 이하
 *
 * ※ 설계유량은 「전체 헤드 합산유량」이 아니라 「기준개수 × 방수량」이다.
 *   전체 합산유량은 표 2.5.3.3 적용을 위한 참고값일 뿐이다.
 */

import type {
  Room,
  RoomPlacement,
  RoomPipeDetail,
  PipeCalcResult,
  SystemType,
  StandardCode,
  LawCheck,
  Zone,
} from '../types';
import {
  MIN_PIPE_SIZE,
  VELOCITY_LIMIT,
  BRANCH_HEAD_LIMIT,
  ZONE_LIMIT,
  PIPE_INNER_DIAMETER,
} from '../constants/nfpc';
import { pipeSizeByHeads, needsHydraulicVerification } from './pipeTable';
import { pipeSizeByVelocity, theoreticalDiameterMM } from './waterSupply';
import { getValveList } from './systemSelector';

/** 유속(㎧) = 유량 / 단면적 */
export function velocityOf(flowLPM: number, nominalMM: number): number {
  const innerMM = PIPE_INNER_DIAMETER[nominalMM];
  if (!innerMM || flowLPM <= 0) return 0;
  const areaM2 = Math.PI * Math.pow(innerMM / 2 / 1000, 2);
  return flowLPM / 1000 / 60 / areaM2;
}

export interface PipeCalcInput {
  rooms: Room[];
  placements: RoomPlacement[];
  system: SystemType;
  standard: StandardCode;
  /** 기준개수 × 방수량 (L/min) — waterSupply에서 산출 */
  designFlowLPM: number;
  /** 주배관 설계유속 */
  velocity: number;
  zones?: Zone[];
  /** 연결송수관설비와 배관을 겸용하는지 (2.5.5) */
  combinedWithStandpipe?: boolean;
}

export function calcPipes(input: PipeCalcInput): PipeCalcResult {
  const { rooms, placements, system, standard, designFlowLPM, velocity } = input;

  const totalHeads = placements.reduce((s, p) => s + p.heads, 0);
  const totalFlow = placements.reduce((s, p) => s + p.roomFlow, 0);

  const designFlowM3min = designFlowLPM / 1000;
  let mainPipe = pipeSizeByVelocity(designFlowM3min, velocity);

  // 2.5.5 — 연결송수관설비와 겸용하는 주배관은 100 ㎜ 이상
  if (input.combinedWithStandpipe && mainPipe.mm < MIN_PIPE_SIZE.hoseConnectionMain.mm) {
    mainPipe = { size: `${MIN_PIPE_SIZE.hoseConnectionMain.mm}A`, mm: MIN_PIPE_SIZE.hoseConnectionMain.mm };
  }
  const riserPipe = mainPipe;

  let cumulativeFlow = 0;
  let cumulativeHeads = 0;
  const roomDetails: RoomPipeDetail[] = placements.map(p => {
    cumulativeFlow += p.roomFlow;
    cumulativeHeads += p.heads;
    return {
      ...p,
      cumulativeFlow,
      cumulativePipe: pipeSizeByHeads(cumulativeHeads, p.pipeColumn),
    };
  });

  const valveSize = mainPipe.size;
  const checks: LawCheck[] = [];

  // 설계유량의 정의를 명시
  checks.push({
    label: '설계유량 산정 방식',
    actual: `${designFlowLPM.toLocaleString()} L/min (기준개수 × 방수량)`,
    standard: '전체 헤드 합산유량이 아니라 기준개수의 모든 헤드 방수량',
    isPassing: true,
    law: 'NFTC 103 2.2.1.11 / 2.2.1.12',
  });

  // 주배관 유속
  const mainVelocity = velocityOf(designFlowLPM, mainPipe.mm);
  checks.push({
    label: '주배관 유속',
    actual: `${mainPipe.size} → ${mainVelocity.toFixed(2)} ㎧ (이론 내경 ${theoreticalDiameterMM(designFlowM3min, velocity).toFixed(0)} ㎜)`,
    standard: `그 밖의 배관 ${VELOCITY_LIMIT.other} ㎧ 이하`,
    isPassing: mainVelocity <= VELOCITY_LIMIT.other,
    law: VELOCITY_LIMIT.law,
  });

  // 가지배관 유속 및 헤드 수
  placements.forEach(p => {
    const branchFlow = p.headsPerBranchSide * p.flowPerHead;
    const v = velocityOf(branchFlow, p.branchPipe.mm);
    checks.push({
      label: `${p.room.name} 가지배관`,
      actual: `한쪽 ${p.headsPerBranchSide}개 · ${p.branchPipe.size} · ${v.toFixed(2)} ㎧`,
      standard: `헤드 ${p.branchLimit}개 이하 / 가지배관 유속 ${VELOCITY_LIMIT.branch} ㎧ 이하`,
      isPassing: p.branchOk && v <= VELOCITY_LIMIT.branch,
      isWarning: p.branchOk && v > VELOCITY_LIMIT.branch,
      law: `${BRANCH_HEAD_LIMIT[standard].law} / ${VELOCITY_LIMIT.law}`,
    });

    // 교차배관 최소구경
    checks.push({
      label: `${p.room.name} 교차배관`,
      actual: `${p.crossPipe.size} (교차배관 ${p.crossMainCount}개)`,
      standard: `최소 ${MIN_PIPE_SIZE.crossMain.mm} ㎜ 이상`,
      isPassing: p.crossPipe.mm >= MIN_PIPE_SIZE.crossMain.mm,
      law: MIN_PIPE_SIZE.crossMain.law,
    });

    if (needsHydraulicVerification(p.heads, p.crossPipe, p.pipeColumn)) {
      checks.push({
        label: `${p.room.name} 100 ㎜ 급수배관`,
        actual: `헤드 ${p.heads}개를 100 ㎜가 담당`,
        standard: '수리계산으로 2.5.3.3 단서의 유속에 적합함을 입증할 것',
        isPassing: false,
        isWarning: true,
        law: 'NFTC 103 표 2.5.3.3 [비고] 2',
      });
    }
  });

  // 방호구역 면적
  const totalArea = rooms.reduce((s, r) => s + r.w * r.d, 0);
  const maxArea = ZONE_LIMIT.areaMax;
  checks.push({
    label: '방호구역 면적',
    actual: `${totalArea.toFixed(0)} ㎡ · 유수검지장치 ${input.zones?.length ?? Math.ceil(totalArea / maxArea)}개`,
    standard: `하나의 방호구역 ${maxArea.toLocaleString()} ㎡ 이하 (격자형 ${ZONE_LIMIT.areaMaxGridPipe.toLocaleString()} ㎡)`,
    isPassing: true,
    law: ZONE_LIMIT.law,
  });

  return {
    system,
    standard,
    totalHeads,
    totalFlow,
    designFlow: designFlowLPM,
    riserPipe,
    mainPipe,
    valveSize,
    roomDetails,
    valves: getValveList(system, valveSize),
    zones: input.zones,
    checks,
  };
}
