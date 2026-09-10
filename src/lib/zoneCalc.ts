/**
 * 방호구역(유수검지장치 담당구역) 분할
 *
 * 근거
 *  · NFTC 103 2.3.1.1  하나의 방호구역의 바닥면적은 3,000 ㎡를 초과하지 않을 것.
 *                       다만 격자형배관방식을 채택하는 때에는 3,700 ㎡ 범위 내에서 수리학적 계산으로 입증.
 *  · NFTC 103 2.3.1.2  방호구역마다 1개 이상의 유수검지장치
 *  · NFTC 103 2.3.1.3  하나의 방호구역은 2개 층에 미치지 않도록 할 것
 *  · NFTC 103 표 2.5.3.3 [비고] 1  1개 층에 하나의 급수배관(또는 밸브)이 담당하는 구역의 최대면적 3,000 ㎡
 *  · NFTC 103 2.4.1.3  개방형 — 하나의 방수구역 헤드 50개 이하 (2구역 분할 시 각 25개 이상)
 *  · NFTC 103 2.5.12.1 건식 2차측 내용적 2,840 L 초과 시 1분 이내 방수
 *
 * ※ 국내 기준에는 「밸브당 헤드 개수 상한」이 없다. 면적으로만 규율한다.
 *   (건식 1,850 ㎡ / 500개 같은 값은 국내 근거가 없음)
 */

import type { Room, Zone, ZoneCheck, SystemType, StandardCode, RoomPlacement } from '../types';
import {
  ZONE_LIMIT,
  DELUGE_ZONE_LIMIT,
  DRY_SYSTEM_VOLUME,
  VALVE_AREA_NOTE,
  BRANCH_HEAD_LIMIT,
} from '../constants/nfpc';
import { pipeSizeByHeads } from './pipeTable';
import { pipeSizeByVelocity } from './waterSupply';
import { VELOCITY_LIMIT } from '../constants/nfpc';

export function calcZones(
  rooms: Room[],
  placements: RoomPlacement[],
  system: SystemType,
  standard: StandardCode,
  gridPipe: boolean,
  /** 설계유량 (기준개수 × 방수량, L/min) — 밸브·주배관 구경 산정용 */
  designFlowLPM?: number,
): ZoneCheck {
  const maxArea = gridPipe ? ZONE_LIMIT.areaMaxGridPipe : ZONE_LIMIT.areaMax;
  const zones: Zone[] = [];
  const warnings: string[] = [];

  let cur = { area: 0, heads: 0, rooms: [] as string[], flow: 0 };

  // 밸브·주배관은 「설계유량(기준개수 × 방수량)」으로 정한다.
  // 존 내 전체 헤드의 합산유량으로 잡으면 과대 산정된다 — 동시에 열리는 헤드는 기준개수뿐이다.
  const sizingFlowM3min = (designFlowLPM ?? 0) / 1000;

  const flush = () => {
    if (cur.rooms.length === 0) return;
    zones.push({
      zoneId: zones.length + 1,
      area: cur.area,
      headCount: cur.heads,
      rooms: [...cur.rooms],
      valveSize:
        sizingFlowM3min > 0
          ? pipeSizeByVelocity(sizingFlowM3min, VELOCITY_LIMIT.other).size
          : pipeSizeByHeads(cur.heads, '가').size,
      crossMainPipe: pipeSizeByHeads(cur.heads, '가').size,
      mainPipe:
        sizingFlowM3min > 0
          ? pipeSizeByVelocity(sizingFlowM3min, 6).size
          : pipeSizeByHeads(cur.heads, '가').size,
    });
    cur = { area: 0, heads: 0, rooms: [], flow: 0 };
  };

  rooms.forEach((room, i) => {
    const p = placements[i];
    if (!p) return;
    const roomArea = room.w * room.d;

    if (cur.area + roomArea > maxArea && cur.rooms.length > 0) {
      flush();
      warnings.push(
        `방호구역 ${zones.length + 1} 시작: ${room.name} — 직전 구역이 ${maxArea.toLocaleString()} ㎡ 한도에 도달 (${ZONE_LIMIT.law})`,
      );
    }

    if (roomArea > maxArea) {
      warnings.push(
        `⚠ ${room.name}: 단일 실 면적 ${roomArea.toFixed(1)} ㎡가 방호구역 한도 ${maxArea.toLocaleString()} ㎡를 초과 — 실 내부를 구획하여 유수검지장치를 추가하십시오 (${ZONE_LIMIT.law})`,
      );
    }

    if (!p.branchOk) {
      warnings.push(
        `⚠ ${room.name}: 한쪽 가지배관 헤드 ${p.headsPerBranchSide}개 — ${BRANCH_HEAD_LIMIT[standard].max}개 이하 위반 (${BRANCH_HEAD_LIMIT[standard].law})`,
      );
    }

    cur.area += roomArea;
    cur.heads += p.heads;
    cur.flow += p.roomFlow;
    cur.rooms.push(room.name);
  });

  flush();

  const laws = [
    `${ZONE_LIMIT.law} — 방호구역 ${ZONE_LIMIT.areaMax.toLocaleString()} ㎡ 이하 (격자형 ${ZONE_LIMIT.areaMaxGridPipe.toLocaleString()} ㎡)`,
    `${VALVE_AREA_NOTE.law} — 급수배관(밸브) 담당구역 최대면적 3,000 ㎡`,
    `${ZONE_LIMIT.installLaw} — 유수검지장치 0.8~1.5 m, 출입문 0.5 m × 1 m, 「유수검지장치실」 표지`,
    BRANCH_HEAD_LIMIT[standard].law + ` — 한쪽 가지배관 헤드 ${BRANCH_HEAD_LIMIT[standard].max}개 이하`,
  ];

  if (gridPipe) {
    warnings.push(`격자형 배관방식 적용 — ${ZONE_LIMIT.gridPipeNote}`);
  }

  if (system === 'deluge') {
    laws.push(`${DELUGE_ZONE_LIMIT.law} — 하나의 방수구역 헤드 ${DELUGE_ZONE_LIMIT.maxHeads}개 이하`);
    zones.forEach(z => {
      if (z.headCount > DELUGE_ZONE_LIMIT.maxHeads) {
        warnings.push(
          `⚠ 방수구역 ${z.zoneId}: 헤드 ${z.headCount}개 — ${DELUGE_ZONE_LIMIT.maxHeads}개 이하 위반. ` +
            `2개 이상으로 나눌 경우 각 구역은 ${DELUGE_ZONE_LIMIT.minHeadsWhenSplit}개 이상이어야 합니다 (${DELUGE_ZONE_LIMIT.law})`,
        );
      }
    });
  }

  if (system === 'dry') {
    laws.push(`${DRY_SYSTEM_VOLUME.law} — 2차측 내용적 ${DRY_SYSTEM_VOLUME.liters.toLocaleString()} L 초과 시 1분 이내 방수`);
    warnings.push(
      `건식: 유수검지장치 2차측 배관의 내용적을 구경별로 집계하여 ${DRY_SYSTEM_VOLUME.liters.toLocaleString()} L 초과 여부를 확인하십시오. ` +
        `초과 시 시험장치 개폐밸브 완전 개방 후 1분 이내 방수를 입증해야 합니다 (${DRY_SYSTEM_VOLUME.law}). ※ 면적 기준이 아니라 내용적 기준입니다.`,
    );
  }

  zones.forEach(z => {
    if (z.headCount >= 100) {
      warnings.push(
        `방호구역 ${z.zoneId}: 담당 헤드 ${z.headCount}개 — 100개 이상의 헤드를 담당하는 급수배관의 구경을 100 ㎜로 하는 경우 수리계산으로 유속을 검증해야 합니다 (표 2.5.3.3 [비고] 2)`,
      );
    }
  });

  return {
    system,
    standard,
    totalArea: rooms.reduce((s, r) => s + r.w * r.d, 0),
    maxAreaPerValve: maxArea,
    gridPipe,
    valveCount: zones.length,
    zones,
    warnings,
    laws,
  };
}
