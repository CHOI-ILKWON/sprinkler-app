import type { Room, WarehouseZone, WarehouseCheck } from '../types';
import { WAREHOUSE_LIMITS, RISK_TABLE, PIPE_BY_HEADS, PIPE_BY_FLOW } from '../constants/nfpc';

export function calcWarehouseZones(
  rooms: Room[],
  system: 'wet' | 'dry'
): WarehouseCheck {
  const limits = WAREHOUSE_LIMITS[system];
  const zones: WarehouseZone[] = [];
  const warnings: string[] = [];

  let currentZone: { area: number; heads: number; rooms: string[]; totalFlow: number } =
    { area: 0, heads: 0, rooms: [], totalFlow: 0 };

  const flushZone = () => {
    if (currentZone.rooms.length === 0) return;
    const zoneFlow = currentZone.totalFlow;
    zones.push({
      zoneId: zones.length + 1,
      area: currentZone.area,
      headCount: currentZone.heads,
      rooms: [...currentZone.rooms],
      valveSize: getValveSizeByFlow(zoneFlow),
      crossMainPipe: getPipeSizeByHeads(currentZone.heads).size,
      mainPipe: getPipeSizeByFlow(zoneFlow).size,
    });
    currentZone = { area: 0, heads: 0, rooms: [], totalFlow: 0 };
  };

  rooms.forEach(room => {
    const risk = RISK_TABLE[room.risk];
    const hx = Math.ceil(room.w / risk.spacing);
    const hy = Math.ceil(room.d / risk.spacing);
    const roomHeads = hx * hy;
    const roomArea = room.w * room.d;
    const roomFlow = roomHeads * risk.flow;

    const wouldExceedArea  = currentZone.area  + roomArea  > limits.maxAreaPerValve;
    const wouldExceedHeads = currentZone.heads + roomHeads > limits.maxHeadsPerValve;

    if ((wouldExceedArea || wouldExceedHeads) && currentZone.rooms.length > 0) {
      flushZone();
      warnings.push(
        `존 ${zones.length + 1} 시작: ${room.name} — ` +
        (wouldExceedArea
          ? `면적 초과 (${limits.maxAreaPerValve}㎡ 한도)`
          : `헤드수 초과 (${limits.maxHeadsPerValve}개 한도)`)
      );
    }

    if (roomHeads > limits.maxHeadsPerValve) {
      warnings.push(
        `⚠ ${room.name}: 단일 실 헤드 ${roomHeads}개가 밸브당 한도 ` +
        `${limits.maxHeadsPerValve}개 초과 — 실 내부 구획 분할 필요`
      );
    }
    if (roomArea > limits.maxAreaPerValve) {
      warnings.push(
        `⚠ ${room.name}: 단일 실 면적 ${roomArea.toFixed(1)}㎡가 밸브당 한도 ` +
        `${limits.maxAreaPerValve}㎡ 초과 — 실 내부 구획 분할 필요`
      );
    }

    currentZone.area      += roomArea;
    currentZone.heads     += roomHeads;
    currentZone.totalFlow += roomFlow;
    currentZone.rooms.push(room.name);
  });

  flushZone();

  if (system === 'dry') {
    warnings.push(
      `건식 ${zones.length}개 존 모두: 헤드 개방 후 60초 이내 말단 헤드까지 충수 검증 필요 (NFPC 103 제8조③)`
    );
    if (zones.some(z => z.headCount > 500)) {
      warnings.push('⚠ 일부 존 헤드 500개 초과 — 추가 분할 필요');
    }
  }

  return {
    system,
    totalArea: rooms.reduce((s, r) => s + r.w * r.d, 0),
    maxAreaPerValve: limits.maxAreaPerValve,
    maxHeadsPerValve: limits.maxHeadsPerValve,
    valveCount: zones.length,
    zones,
    warnings,
    laws: [
      limits.law,
      'NFPC 103 제6조 ② — 가지관 헤드 최대 8개',
      'NFPC 103 별표1 — 헤드 수 기준 배관경',
    ],
  };
}

function getPipeSizeByHeads(heads: number) {
  return PIPE_BY_HEADS.find(p => heads <= p.maxHeads)!;
}

function getPipeSizeByFlow(lpm: number) {
  return PIPE_BY_FLOW.find(p => lpm <= p.maxLPM)!;
}

function getValveSizeByFlow(lpm: number): string {
  if (lpm <= 454)  return '40A';
  if (lpm <= 757)  return '50A';
  if (lpm <= 1514) return '65A';
  if (lpm <= 3028) return '80A';
  if (lpm <= 6057) return '100A';
  return '125A';
}
