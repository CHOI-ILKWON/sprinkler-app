/**
 * 수원 · 가압송수장치 산정
 *
 * 근거
 *  · NFTC 103 2.1.1.1  수원 = 기준개수 × 1.6 ㎥ (설치개수가 기준개수보다 적으면 그 설치개수)
 *  · NFTC 103 2.1.2    옥상수조 = 유효수량의 1/3 이상 (6가지 면제)
 *  · NFTC 103 2.2.1.10 헤드 선단 0.1 MPa 이상 1.2 MPa 이하
 *  · NFTC 103 2.2.1.11 / 2.2.1.12  송수량 = 기준개수 × 80 L/min
 *  · NFTC 103 2.2.1.5  체절 140 % 이하 / 150 % 유량에서 65 % 이상
 *  · NFTC 103 2.5.6.2  유량측정장치 정격토출량의 175 % 이상
 *  · NFTC 103 2.5.3.3 단서  가지배관 6 ㎧, 그 밖의 배관 10 ㎧
 *  · NFTC 103 2.13.1   겸용 시 저수량은 합한 양 이상 (구획 시 최대값)
 *  · NFPC 609 제7조②1 / 제7조③1  창고 3.2(랙식 9.6) ㎥ · 160 L/min
 */

import type { WaterSupplyInput, WaterSupplyResult, LawCheck, PipeSize } from '../types';
import {
  WATER_SUPPLY,
  ROOF_TANK,
  HEAD_PRESSURE,
  PUMP_PERFORMANCE,
  SHAFT_POWER_CONST,
  MOTOR_SIZES,
  VELOCITY_LIMIT,
  PIPE_INNER_DIAMETER,
  COMBINED_SUPPLY,
  WATER_SUPPLY_MINUTES,
} from '../constants/nfpc';

const NOMINAL_SIZES = Object.keys(PIPE_INNER_DIAMETER)
  .map(Number)
  .sort((a, b) => a - b);

/** 유속 기준 필요 내경(㎜)을 만족하는 최소 호칭경 */
export function pipeSizeByVelocity(flowM3min: number, velocity: number): PipeSize {
  if (flowM3min <= 0 || velocity <= 0) return { size: '25A', mm: 25 };
  const area = flowM3min / 60 / velocity; // ㎡
  const dMM = Math.sqrt((4 * area) / Math.PI) * 1000;
  const found = NOMINAL_SIZES.find(mm => PIPE_INNER_DIAMETER[mm] >= dMM);
  const mm = found ?? NOMINAL_SIZES[NOMINAL_SIZES.length - 1];
  return { size: `${mm}A`, mm };
}

/** 이론 내경(㎜) — 화면 표기용 */
export function theoreticalDiameterMM(flowM3min: number, velocity: number): number {
  if (flowM3min <= 0 || velocity <= 0) return 0;
  const area = flowM3min / 60 / velocity;
  return Math.sqrt((4 * area) / Math.PI) * 1000;
}

function pickMotor(kw: number): number {
  return MOTOR_SIZES.find(m => m >= kw) ?? MOTOR_SIZES[MOTOR_SIZES.length - 1];
}

export function calcWaterSupply(input: WaterSupplyInput): WaterSupplyResult {
  const spec = WATER_SUPPLY[input.standard];

  // 2.1.1.1 — 설치개수가 기준개수보다 적으면 그 설치개수를 적용
  const installed = Math.max(0, Math.floor(input.installedHeads));
  const usedInstalledCount = installed > 0 && installed < input.standardHeadCount;
  const N = usedInstalledCount ? installed : input.standardHeadCount;

  const waterVolume = N * spec.coefficient;
  const roofTankVolume = input.roofTankExempt ? 0 : waterVolume * ROOF_TANK.ratio;

  const designFlowLPM = N * spec.flowPerHead;
  const designFlowM3min = designFlowLPM / 1000;

  // 전양정 H = h₁ + h₂ + 10 m (= 헤드 선단 0.1 MPa 환산)
  const pressureHeadM = HEAD_PRESSURE.min * 100;
  const totalHead = input.h1 + input.h2 + pressureHeadM;
  const totalHeadMPa = totalHead / 100;

  const eff = Math.min(0.95, Math.max(0.3, input.efficiency));
  const shaftPowerKW = (SHAFT_POWER_CONST * designFlowM3min * totalHead) / eff * input.transmission;
  const motorKW = pickMotor(shaftPowerKW);

  const churnMaxHead = totalHead * PUMP_PERFORMANCE.churnMaxRatio;
  const peakFlowLPM = designFlowLPM * PUMP_PERFORMANCE.peakFlowRatio;
  const peakMinHead = totalHead * PUMP_PERFORMANCE.peakPressureRatio;
  const flowMeterMinLPM = designFlowLPM * PUMP_PERFORMANCE.flowMeterRatio;

  const velocity = Math.min(VELOCITY_LIMIT.other, Math.max(0.5, input.velocity));
  const mainPipe = pipeSizeByVelocity(designFlowM3min, velocity);
  const minMainPipe = pipeSizeByVelocity(designFlowM3min, VELOCITY_LIMIT.other);

  const combinedTotal =
    input.combinedOtherVolume && input.combinedOtherVolume > 0
      ? waterVolume + input.combinedOtherVolume
      : undefined;

  const checks: LawCheck[] = [
    {
      label: '적용 기준개수',
      actual: `${N} 개${usedInstalledCount ? ' (실제 설치개수 적용)' : ''}`,
      standard: `기준개수 ${input.standardHeadCount} 개 / 실제 설치 ${installed} 개 중 작은 값`,
      isPassing: true,
      law: 'NFTC 103 2.1.1.1',
    },
    {
      label: '수원(유효수량)',
      actual: `${waterVolume.toFixed(1)} ㎥`,
      standard: `${N} × ${spec.coefficient} ㎥ 이상`,
      isPassing: true,
      law: spec.waterLaw,
    },
    {
      label: '옥상수조',
      actual: input.roofTankExempt ? '면제 적용' : `${roofTankVolume.toFixed(1)} ㎥`,
      standard: input.roofTankExempt ? '2.1.2 단서 (1)~(6) 중 해당' : '유효수량의 1/3 이상',
      isPassing: true,
      isWarning: input.roofTankExempt,
      law: ROOF_TANK.law,
    },
    {
      label: '펌프 토출량',
      actual: `${designFlowLPM.toLocaleString()} L/min`,
      standard: `${N} × ${spec.flowPerHead} L/min 이상 (0.1 MPa 기준)`,
      isPassing: true,
      law: spec.flowLaw,
    },
    {
      label: '헤드 선단 방수압력',
      actual: `${totalHeadMPa.toFixed(2)} MPa (전양정 환산)`,
      standard: `${HEAD_PRESSURE.min} MPa 이상 ${HEAD_PRESSURE.max} MPa 이하`,
      isPassing: totalHeadMPa >= HEAD_PRESSURE.min,
      isWarning: totalHeadMPa > HEAD_PRESSURE.max,
      law: HEAD_PRESSURE.law,
    },
    {
      label: '체절운전 압력 상한',
      actual: `${churnMaxHead.toFixed(1)} m 이하`,
      standard: '정격토출압력의 140 %를 초과하지 않을 것',
      isPassing: true,
      law: PUMP_PERFORMANCE.performanceLaw,
    },
    {
      label: '150 % 유량 시 압력',
      actual: `${peakMinHead.toFixed(1)} m 이상 @ ${Math.round(peakFlowLPM).toLocaleString()} L/min`,
      standard: '정격토출량의 150 %로 운전 시 정격토출압력의 65 % 이상',
      isPassing: true,
      law: PUMP_PERFORMANCE.performanceLaw,
    },
    {
      label: '유량측정장치 성능',
      actual: `${Math.round(flowMeterMinLPM).toLocaleString()} L/min 이상 측정 가능`,
      standard: '펌프 정격토출량의 175 % 이상',
      isPassing: true,
      law: PUMP_PERFORMANCE.flowMeterLaw,
    },
    {
      label: '주배관 유속',
      actual: `${velocity.toFixed(1)} ㎧ 설계 → ${mainPipe.size}`,
      standard: `그 밖의 배관 ${VELOCITY_LIMIT.other} ㎧ 이하 (최소 ${minMainPipe.size})`,
      isPassing: velocity <= VELOCITY_LIMIT.other,
      law: VELOCITY_LIMIT.law,
    },
  ];

  if (combinedTotal !== undefined) {
    checks.push({
      label: '겸용 수조 저수량',
      actual: `${combinedTotal.toFixed(1)} ㎥`,
      standard: COMBINED_SUPPLY.rule,
      isPassing: true,
      isWarning: true,
      law: COMBINED_SUPPLY.law,
    });
  }

  return {
    appliedHeadCount: N,
    usedInstalledCount,
    coefficient: spec.coefficient,
    flowPerHead: spec.flowPerHead,
    waterVolume,
    roofTankVolume,
    roofTankExempt: input.roofTankExempt,
    combinedTotal,
    designFlowLPM,
    designFlowM3min,
    totalHead,
    totalHeadMPa,
    shaftPowerKW,
    motorKW,
    churnMaxHead,
    peakFlowLPM,
    peakMinHead,
    flowMeterMinLPM,
    mainPipe,
    minMainPipe,
    checks,
    laws: [
      `${spec.waterLaw} — 수원`,
      `${ROOF_TANK.law} — 옥상수조 1/3`,
      `${spec.flowLaw} — 방수량`,
      `${HEAD_PRESSURE.law} — 방수압력 0.1~1.2 MPa`,
      `${PUMP_PERFORMANCE.performanceLaw} — 펌프 성능 140 % / 65 %`,
      `${PUMP_PERFORMANCE.flowMeterLaw} — 유량측정장치 175 %`,
      `${VELOCITY_LIMIT.law} — 유속 상한`,
      `NFTC 103 2.1.1 단서 — 수리계산 시 1분당 송수량 × ${WATER_SUPPLY_MINUTES}`,
    ],
  };
}
