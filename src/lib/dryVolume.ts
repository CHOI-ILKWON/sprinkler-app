/**
 * 건식스프링클러설비 2차측 내용적 검증
 *
 * 근거 — NFTC 103 2.5.12.1 후단
 *   "유수검지장치 2차 측 설비의 내용적이 2,840 L를 초과하는 건식스프링클러설비는
 *    시험장치 개폐밸브를 완전 개방 후 1분 이내에 물이 방사되어야 한다."
 *
 * 주의 — 이 규정은 「내용적(L)」이지 「면적(㎡)」이 아니다.
 *   면적으로 환산하려면 배관 체적밀도(L/㎡)를 알아야 하는데, 그 값은 구경 구성과
 *   헤드 간격에 따라 대략 0.7 ~ 2.5 L/㎡ 사이에서 크게 변한다.
 *   따라서 「건식 = ○○㎡ 이하」로 고정하면 다음 두 방향 모두에서 틀린다.
 *     · 소면적 + 대구경 배관 → 면적은 통과하지만 실제 내용적은 초과
 *     · 대면적 + 소구경 배관 → 면적은 초과하지만 실제 내용적은 여유
 *   이 모듈은 구경별 연장을 받아 실제 내용적을 계산하고,
 *   참고로 해당 프로젝트의 체적밀도와 그에 대응하는 환산면적을 함께 보여준다.
 */

import type { DryPipeSegment, DryVolumeResult } from '../types';
import { DRY_SYSTEM_VOLUME, PIPE_INNER_DIAMETER } from '../constants/nfpc';

/** 호칭경 1 m당 내용적 (L/m) = π/4 × (내경[m])² × 1000 */
export function litersPerMeter(nominalMM: number): number {
  const innerMM = PIPE_INNER_DIAMETER[nominalMM];
  if (!innerMM) return 0;
  const rM = innerMM / 2 / 1000;
  return Math.PI * rM * rM * 1000;
}

export function calcDryVolume(segments: DryPipeSegment[], protectedAreaM2?: number): DryVolumeResult {
  const detailed = segments.map(s => {
    const lpm = litersPerMeter(s.mm);
    return { ...s, litersPerM: lpm, liters: lpm * Math.max(0, s.length) };
  });

  const totalLiters = detailed.reduce((sum, s) => sum + s.liters, 0);
  const exceeds = totalLiters > DRY_SYSTEM_VOLUME.liters;

  let volumePerArea: number | undefined;
  let equivalentArea: number | undefined;
  if (protectedAreaM2 && protectedAreaM2 > 0 && totalLiters > 0) {
    volumePerArea = totalLiters / protectedAreaM2;
    equivalentArea = DRY_SYSTEM_VOLUME.liters / volumePerArea;
  }

  return {
    segments: detailed,
    totalLiters,
    limitLiters: DRY_SYSTEM_VOLUME.liters,
    exceeds,
    volumePerArea,
    equivalentArea,
    requirement: DRY_SYSTEM_VOLUME.requirement,
    law: DRY_SYSTEM_VOLUME.law,
  };
}

/** 구경별 「2,840 L에 해당하는 단일 구경 연장(m)」 — 감각 잡기용 참고표 */
export function volumeReferenceTable(): { mm: number; litersPerM: number; lengthAtLimit: number }[] {
  return Object.keys(PIPE_INNER_DIAMETER)
    .map(Number)
    .filter(mm => mm <= 150)
    .sort((a, b) => a - b)
    .map(mm => {
      const lpm = litersPerMeter(mm);
      return { mm, litersPerM: lpm, lengthAtLimit: lpm > 0 ? DRY_SYSTEM_VOLUME.liters / lpm : 0 };
    });
}
