import type { DesignCondition, SystemResult, SystemType, ValveItem } from '../types';

const WAREHOUSE_USAGES = [
  'warehouse_general', 'warehouse_rack', 'warehouse_high', 'cold_storage',
];

export function selectSystem(cond: DesignCondition): SystemResult {
  let system: SystemType;
  let isManualOverride = false;

  if (WAREHOUSE_USAGES.includes(cond.usage) && cond.warehouseSystemOverride) {
    system = cond.warehouseSystemOverride;
    isManualOverride = true;
  } else if (cond.usage === 'stage') {
    system = 'deluge';
  } else if (cond.usage === 'factory_hazard' && cond.fire === 'fast') {
    system = 'deluge';
  } else if (cond.damage === 'critical' || cond.damage === 'sensitive') {
    system = 'preaction';
  } else if (
    cond.temp === 'freeze' ||
    cond.usage === 'cold_storage' ||
    cond.usage === 'parking_outdoor' ||
    cond.usage === 'warehouse_rack' ||
    cond.usage === 'warehouse_high'
  ) {
    system = 'dry';
  } else if (cond.temp === 'cold') {
    system = 'dry';
  } else {
    system = 'wet';
  }

  return buildResult(system, cond, isManualOverride);
}

function buildResult(
  system: SystemType,
  cond: DesignCondition,
  isManualOverride: boolean
): SystemResult {
  const reasons = getReasonsForSystem(system, cond, isManualOverride);
  const laws = getLawsForSystem(system);
  const valves = getValveList(system);

  return { system, reasons, laws, valves, isManualOverride };
}

function getReasonsForSystem(
  system: SystemType,
  cond: DesignCondition,
  isManualOverride: boolean
): string[] {
  if (isManualOverride) {
    return [`사용자가 ${SYSTEM_LABELS[system]} 시스템을 직접 선택하였습니다.`];
  }

  const reasons: string[] = [];
  switch (system) {
    case 'wet':
      reasons.push('동결 우려 없는 실내 공간');
      reasons.push('수손피해 우려가 없거나 낮은 용도');
      break;
    case 'dry':
      if (cond.temp === 'freeze' || cond.usage === 'cold_storage')
        reasons.push('동결 위험 공간 (냉동창고 또는 동결온도 환경)');
      if (cond.usage === 'parking_outdoor')
        reasons.push('옥외 주차장 — 동결 및 수손 위험');
      if (cond.usage === 'warehouse_rack' || cond.usage === 'warehouse_high')
        reasons.push('랙식·고천장 창고 — 건식 또는 ESFR 권장');
      if (cond.temp === 'cold')
        reasons.push('저온 환경 (동결 가능성)');
      break;
    case 'deluge':
      if (cond.usage === 'stage')
        reasons.push('무대부 — 일제살수식 의무 적용 (NFPC 103 제15조)');
      if (cond.usage === 'factory_hazard')
        reasons.push('화재위험도 높은 공장 + 급속화재 — 일제살수 권장');
      break;
    case 'preaction':
      if (cond.damage === 'critical')
        reasons.push('수손 시 치명적 손실 발생 우려 (데이터센터·박물관급)');
      if (cond.damage === 'sensitive')
        reasons.push('수손에 민감한 용도 — 준비작동식으로 오방수 방지');
      break;
  }
  return reasons;
}

function getLawsForSystem(system: SystemType): string[] {
  const common = [
    'NFPC 103 제4조 — 스프링클러설비의 설치장소',
    'NFPC 103 제6조 — 배관 기준',
    'NFPC 103 제10조 — 헤드 수량 및 간격 기준',
  ];
  switch (system) {
    case 'wet':
      return [...common, 'NFPC 103 제7조 — 습식 유수검지장치'];
    case 'dry':
      return [...common, 'NFPC 103 제8조 — 건식 유수검지장치', 'NFPC 103 제8조③④ — 충수시간 60초'];
    case 'deluge':
      return [...common, 'NFPC 103 제9조 — 일제개방밸브', 'NFPC 103 제15조 — 무대부 설치기준'];
    case 'preaction':
      return [...common, 'NFPC 103 제7조의2 — 준비작동식 유수검지장치'];
  }
}

export function getValveList(system: SystemType, size = '80A'): ValveItem[] {
  const common: ValveItem[] = [
    { icon: '🔧', name: '주배관 제어밸브', size, desc: 'OS&Y 게이트밸브 또는 버터플라이밸브' },
    { icon: '📊', name: '유량계', size, desc: '배관 유량 모니터링' },
  ];
  switch (system) {
    case 'wet':
      return [
        { icon: '💧', name: '습식 유수검지장치 (알람밸브)', size, desc: 'NFPC 103 제7조' },
        { icon: '🔔', name: '압력스위치', size: '-', desc: '화재경보 연동' },
        { icon: '🚰', name: '시험밸브', size: '25A', desc: '말단 유량 시험용' },
        ...common,
      ];
    case 'dry':
      return [
        { icon: '💨', name: '건식 유수검지장치', size, desc: 'NFPC 103 제8조' },
        { icon: '⚡', name: '가속기', size: '-', desc: '충수시간 단축' },
        { icon: '🌡️', name: '공기공급장치', size: '-', desc: '배관 내 압축공기 유지' },
        { icon: '🚰', name: '시험밸브', size: '25A', desc: '말단 유량 시험용' },
        ...common,
      ];
    case 'deluge':
      return [
        { icon: '🌊', name: '일제개방밸브', size, desc: 'NFPC 103 제9조' },
        { icon: '🔥', name: '화재감지기 연동반', size: '-', desc: '감지기 신호로 밸브 개방' },
        { icon: '🔔', name: '압력스위치', size: '-', desc: '경보 연동' },
        ...common,
      ];
    case 'preaction':
      return [
        { icon: '⚙️', name: '준비작동식 유수검지장치', size, desc: 'NFPC 103 제7조의2' },
        { icon: '🔥', name: '화재감지기 연동반', size: '-', desc: '1차 감지 → 밸브 준비' },
        { icon: '🔔', name: '압력스위치', size: '-', desc: '경보 연동' },
        { icon: '🚰', name: '시험밸브', size: '25A', desc: '말단 유량 시험용' },
        ...common,
      ];
  }
}

const SYSTEM_LABELS: Record<SystemType, string> = {
  wet: '습식',
  dry: '건식',
  deluge: '일제살수식',
  preaction: '준비작동식',
};
