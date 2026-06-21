import type { ReportData, CheckItem } from '../types';
import { RISK_TABLE, HEAD_PRESSURE, MAX_HEADS_PER_BRANCH } from '../constants/nfpc';

export function buildCheckItems(data: ReportData): CheckItem[] {
  const items: CheckItem[] = [];
  const { rooms, pipeResult, hydraulicResult } = data;
  if (!rooms.length || !pipeResult) return items;

  const dominantRisk = (['extra', 'ordinary2', 'ordinary1', 'light'] as const)
    .find(r => rooms.some(rm => rm.risk === r)) ?? 'ordinary1';
  const risk = RISK_TABLE[dominantRisk];

  // 헤드 방호면적
  const maxAreaPerHead = Math.max(
    ...pipeResult.roomDetails.map(r => (r.room.w * r.room.d) / r.heads)
  );
  items.push({
    label: '헤드 방호면적',
    actual: `최대 ${maxAreaPerHead.toFixed(1)}㎡/헤드`,
    standard: `${risk.area}㎡ 이하`,
    isPassing: maxAreaPerHead <= risk.area + 0.01,
    law: 'NFPC 103 제10조① 별표1',
  });

  // 헤드 간격
  const maxSpacing = Math.max(
    ...pipeResult.roomDetails.map(r => Math.max(r.actualSpacingX, r.actualSpacingY))
  );
  items.push({
    label: '헤드 최대 간격',
    actual: `최대 ${maxSpacing.toFixed(2)}m`,
    standard: `${risk.spacing}m 이하`,
    isPassing: pipeResult.roomDetails.every(r => r.spacingOk),
    law: 'NFPC 103 제10조① 별표1',
  });

  // 가지관 헤드 수
  const maxBranch = Math.max(...pipeResult.roomDetails.map(r => r.hxCount));
  items.push({
    label: '가지관 최대 헤드수',
    actual: `${maxBranch}개`,
    standard: `${MAX_HEADS_PER_BRANCH}개 이하`,
    isPassing: maxBranch <= MAX_HEADS_PER_BRANCH,
    law: 'NFPC 103 제6조②',
  });

  // 말단 헤드 압력
  if (hydraulicResult) {
    items.push({
      label: '말단 헤드 최소압력',
      actual: `필요 공급압력 ${hydraulicResult.requiredSupplyPressure.toFixed(3)} MPa`,
      standard: `말단 ${HEAD_PRESSURE.min} MPa 이상`,
      isPassing: hydraulicResult.isPassing,
      isWarning: hydraulicResult.isOverPressure,
      law: HEAD_PRESSURE.law,
    });
  }

  return items;
}

export function buildMaterialList(data: ReportData) {
  const { rooms, pipeResult, systemResult, warehouseCheck } = data;
  if (!rooms.length || !pipeResult) return null;

  const totalHeads = pipeResult.totalHeads;
  const sys = systemResult?.system ?? 'wet';
  const valveCount = warehouseCheck?.valveCount ?? 1;

  const mainValveName =
    sys === 'wet' ? '알람밸브 (습식 유수검지장치)' :
    sys === 'dry' ? '건식밸브 (건식 유수검지장치)' :
    sys === 'deluge' ? '델류지밸브 (일제개방밸브)' :
    '프리액션밸브 (준비작동식 유수검지장치)';

  const pipeLengths: Record<string, number> = {};
  pipeResult.roomDetails.forEach(r => {
    const bKey = r.branchPipe.size;
    const cKey = r.crossPipe.size;
    pipeLengths[bKey] = (pipeLengths[bKey] ?? 0) + r.room.w * r.hxCount * 1.1;
    pipeLengths[cKey] = (pipeLengths[cKey] ?? 0) + r.room.d * 1.1;
  });
  pipeLengths[pipeResult.riserPipe.size] = (pipeLengths[pipeResult.riserPipe.size] ?? 0) + 20;

  return {
    heads: [
      { name: '스프링클러 헤드', spec: '폐쇄형 하향형 K=80, 68°C', qty: totalHeads, unit: '개' },
    ],
    valves: [
      { name: 'OS&Y 개폐밸브',   spec: pipeResult.valveSize,           qty: valveCount * 2, unit: '개' },
      { name: mainValveName,      spec: pipeResult.valveSize,           qty: valveCount,     unit: '개' },
      { name: '압력계',           spec: '0~1.6 MPa',                   qty: valveCount * 2, unit: '개' },
      { name: '배수밸브',         spec: '25A',                          qty: valveCount,     unit: '개' },
      { name: '유수검지장치',     spec: pipeResult.valveSize,           qty: valveCount,     unit: '개' },
      { name: '말단시험밸브',     spec: '25A (오리피스 포함)',            qty: rooms.length,   unit: '개' },
    ],
    pipes: Object.entries(pipeLengths).map(([size, len]) => ({
      name: '배관용 탄소강강관',
      spec: `${size}, KS D 3507`,
      qty: Math.ceil(len),
      unit: 'm',
    })),
  };
}

export const USAGE_LABEL: Record<string, string> = {
  office:            '사무소',
  hotel:             '호텔',
  apartment:         '아파트',
  retail:            '판매시설',
  warehouse_general: '창고 (일반)',
  warehouse_rack:    '창고 (랙식)',
  warehouse_high:    '창고 (고천장)',
  parking_indoor:    '옥내 주차장',
  parking_outdoor:   '옥외 주차장',
  factory_normal:    '공장 (무위험)',
  factory_hazard:    '공장 (위험)',
  data_center:       '데이터센터',
  museum:            '박물관·미술관',
  stage:             '무대부',
  cold_storage:      '냉동·냉장창고',
  hospital:          '병원',
};

export const SYSTEM_LABEL: Record<string, string> = {
  wet:       '습식 스프링클러설비',
  dry:       '건식 스프링클러설비',
  deluge:    '일제살수식 스프링클러설비',
  preaction: '준비작동식 스프링클러설비',
};
