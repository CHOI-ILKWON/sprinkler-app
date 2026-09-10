/**
 * 국내 화재안전기준 상수 — 원문 대조본
 *
 * 근거 원문
 *  · 스프링클러설비의 화재안전기술기준(NFTC 103) 국립소방연구원공고 제2023-48호, 2024. 1. 1. 시행
 *  · 스프링클러설비의 화재안전성능기준(NFPC 103) 소방청고시
 *  · 창고시설의 화재안전성능기준(NFPC 609) 소방청고시 제2023-39호, 2024. 1. 1. 시행
 *  · 소방시설 설치 및 관리에 관한 법률 시행령 별표 4 제1호라목
 *
 * 표기 규칙
 *  · 성능기준은 「NFPC 103 제○조」, 기술기준은 「NFTC 103 2.○.○.○」로 분리 인용한다.
 *  · 이 파일의 모든 수치는 위 원문에서 직접 옮긴 것이며, 원문에 없는 값은 두지 않는다.
 */

// ─────────────────────────────────────────────────────────────
// 적용 기준 코드
// ─────────────────────────────────────────────────────────────

export type StandardCode = 'nftc103' | 'nfpc609' | 'nfpc609_rack';

export const STANDARD_LABEL: Record<StandardCode, string> = {
  nftc103: '일반 대상 (NFTC 103)',
  nfpc609: '창고시설 (NFPC 609)',
  nfpc609_rack: '랙식 창고 (NFPC 609)',
};

// ─────────────────────────────────────────────────────────────
// 표 2.1.1.1 스프링클러설비의 설치장소별 스프링클러헤드의 기준개수 <개정 2024. 1. 1.>
//   ※ 2024.1.1 개정으로 「공장 또는 창고(랙크식창고를 포함한다)」가 「공장」으로 축소되었다.
//     (NFPC 609 부칙 제3조①1) 창고시설은 NFPC 609가 단독 규율한다.
//   ※ 아파트 등 공동주택은 NFPC/NFTC 608 소관이므로 이 표에 없다.
// ─────────────────────────────────────────────────────────────

export interface PlaceCategoryDef {
  id: string;
  group: string;
  detail: string;
  count: number;
}

export const STANDARD_HEAD_COUNT: PlaceCategoryDef[] = [
  {
    id: 'factory_special',
    group: '지하층을 제외한 층수가 10층 이하인 특정소방대상물',
    detail: '공장 — 특수가연물을 저장·취급하는 것',
    count: 30,
  },
  {
    id: 'factory_other',
    group: '지하층을 제외한 층수가 10층 이하인 특정소방대상물',
    detail: '공장 — 그 밖의 것',
    count: 20,
  },
  {
    id: 'retail_complex',
    group: '지하층을 제외한 층수가 10층 이하인 특정소방대상물',
    detail:
      '근린생활시설·판매시설·운수시설 또는 복합건축물 — 판매시설 또는 복합건축물(판매시설이 설치되는 복합건축물)',
    count: 30,
  },
  {
    id: 'retail_other',
    group: '지하층을 제외한 층수가 10층 이하인 특정소방대상물',
    detail: '근린생활시설·판매시설·운수시설 또는 복합건축물 — 그 밖의 것',
    count: 20,
  },
  {
    id: 'other_h8_over',
    group: '지하층을 제외한 층수가 10층 이하인 특정소방대상물',
    detail: '그 밖의 것 — 헤드의 부착 높이가 8 m 이상인 것',
    count: 20,
  },
  {
    id: 'other_h8_under',
    group: '지하층을 제외한 층수가 10층 이하인 특정소방대상물',
    detail: '그 밖의 것 — 헤드의 부착 높이가 8 m 미만인 것',
    count: 10,
  },
  {
    id: 'over11',
    group: '지하층을 제외한 층수가 11층 이상인 특정소방대상물, 지하가 또는 지하역사',
    detail: '—',
    count: 30,
  },
];

export const STANDARD_HEAD_COUNT_LAW = 'NFTC 103 표 2.1.1.1 <개정 2024.1.1.>';

/** 표 2.1.1.1 [비고] — 2 이상의 란에 해당하면 기준개수가 많은 것을 기준으로 한다. */
export const STANDARD_HEAD_COUNT_NOTE =
  '하나의 소방대상물이 2 이상의 "스프링클러헤드의 기준개수"란에 해당하는 때에는 기준개수가 많은 것을 기준으로 한다. ' +
  '다만, 각 기준개수에 해당하는 수원을 별도로 설치하는 경우에는 그렇지 않다.';

/** 창고시설(NFPC 609 제7조②1) — 라지드롭형 헤드 기준개수 30개 */
export const WAREHOUSE_STANDARD_HEAD_COUNT = 30;

// ─────────────────────────────────────────────────────────────
// 수원 · 방수성능
// ─────────────────────────────────────────────────────────────

export interface WaterSupplySpec {
  /** 기준개수에 곱하는 수원 계수 (㎥) */
  coefficient: number;
  /** 헤드 1개당 방수량 (L/min) */
  flowPerHead: number;
  headType: string;
  waterLaw: string;
  flowLaw: string;
}

export const WATER_SUPPLY: Record<StandardCode, WaterSupplySpec> = {
  nftc103: {
    coefficient: 1.6,
    flowPerHead: 80,
    headType: '표준형 폐쇄형 스프링클러헤드',
    waterLaw: 'NFTC 103 2.1.1.1',
    flowLaw: 'NFTC 103 2.2.1.11 / 2.2.1.12',
  },
  nfpc609: {
    coefficient: 3.2,
    flowPerHead: 160,
    headType: '라지드롭형 스프링클러헤드',
    waterLaw: 'NFPC 609 제7조②1',
    flowLaw: 'NFPC 609 제7조③1',
  },
  nfpc609_rack: {
    coefficient: 9.6,
    flowPerHead: 160,
    headType: '라지드롭형 스프링클러헤드 (랙 높이 3 m 이하마다 추가)',
    waterLaw: 'NFPC 609 제7조②1',
    flowLaw: 'NFPC 609 제7조③1',
  },
};

/** 2.1.2 옥상수조 — 유효수량의 3분의 1 이상 */
export const ROOF_TANK = {
  ratio: 1 / 3,
  law: 'NFTC 103 2.1.2',
  exemptions: [
    '지하층만 있는 건축물',
    '고가수조를 가압송수장치로 설치한 경우',
    '수원이 건축물의 최상층에 설치된 헤드보다 높은 위치에 설치된 경우',
    '건축물의 높이가 지표면으로부터 10 m 이하인 경우',
    '주펌프와 동등 이상의 성능이 있는 별도의 펌프로서 내연기관의 기동과 연동하여 작동되거나 비상전원을 연결하여 설치한 경우',
    '가압수조를 가압송수장치로 설치한 경우',
  ],
} as const;

/** 2.1.1 단서 — 수리계산에 의하는 경우 1분당 송수량 × 20 */
export const WATER_SUPPLY_MINUTES = 20;

/** 2.13.1 겸용 시 저수량 — 원칙 합산, 방화벽·방화문 구획 시 최대값 */
export const COMBINED_SUPPLY = {
  rule: '각 소화설비에 필요한 저수량을 합한 양 이상',
  exception:
    '고정식 소화설비가 2 이상 설치되어 있고 그 부분이 방화벽과 방화문으로 구획된 경우에는 각 고정식 소화설비에 필요한 저수량 중 최대의 것 이상',
  law: 'NFTC 103 2.13.1 / 2.13.2',
} as const;

// ─────────────────────────────────────────────────────────────
// 2.2 가압송수장치
// ─────────────────────────────────────────────────────────────

/** 2.2.1.10 헤드 선단 방수압력 */
export const HEAD_PRESSURE = {
  min: 0.1,
  max: 1.2,
  law: 'NFTC 103 2.2.1.10',
} as const;

/** 2.2.1.5 펌프 성능 / 2.5.6.2 유량측정장치 */
export const PUMP_PERFORMANCE = {
  churnMaxRatio: 1.4,
  peakFlowRatio: 1.5,
  peakPressureRatio: 0.65,
  flowMeterRatio: 1.75,
  performanceLaw: 'NFTC 103 2.2.1.5',
  flowMeterLaw: 'NFTC 103 2.5.6.2',
} as const;

/** 축동력 P = 0.163 × Q[㎥/min] × H[m] ÷ η × K */
export const SHAFT_POWER_CONST = 0.163;

/** 전달계수 K — 법정 규정이 아니라 기계설비 관행값 */
export const TRANSMISSION_COEF = { direct: 1.1, vbelt: 1.2 } as const;

/** 표준 전동기 용량 (kW) */
export const MOTOR_SIZES = [
  0.75, 1.5, 2.2, 3.7, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200,
];

export const PUMP_ACCESSORY = {
  pressureChamberLiters: 100, // 2.2.1.8
  pressureChamberLaw: 'NFTC 103 2.2.1.8',
  primingTankLiters: 100, // 2.2.1.9.2
  primingSupplyMM: 15, // 2.2.1.9.2
  primingLaw: 'NFTC 103 2.2.1.9',
  jockeyExtraMPa: 0.2, // 2.2.1.14.1
  jockeyLaw: 'NFTC 103 2.2.1.14.1',
  circulationMM: 20, // 2.5.7
  circulationLaw: 'NFTC 103 2.5.7',
  emergencyPowerMin: 20, // 2.9.3.2
  emergencyPowerLaw: 'NFTC 103 2.9.3.2',
} as const;

/** 창고시설 비상전원 — NFPC 609 제6조③ / 제7조⑦ */
export const WAREHOUSE_EMERGENCY_POWER = {
  sprinkler: 20,
  sprinklerRack: 60,
  hydrant: 40,
  law: 'NFPC 609 제7조⑦ / 제6조③',
} as const;

// ─────────────────────────────────────────────────────────────
// 2.3 / 2.4 방호구역 · 방수구역
// ─────────────────────────────────────────────────────────────

/** 2.3.1.1 · 2.3.1.3 — 폐쇄형(습식·건식·준비작동식·부압식 공통) */
export const ZONE_LIMIT = {
  areaMax: 3000,
  areaMaxGridPipe: 3700,
  gridPipeNote:
    '격자형배관방식(2 이상의 수평주행배관 사이를 가지배관으로 연결하는 방식)을 채택하는 때에는 3,700 ㎡ 범위 내에서 수리학적 계산으로 방수압·방수량 충족을 입증할 것',
  maxFloors: 2,
  maxFloorsException: '1개 층에 설치되는 헤드의 수가 10개 이하인 경우와 복층형구조의 공동주택은 3개 층 이내',
  law: 'NFTC 103 2.3.1.1 / 2.3.1.3',
  valveHeightMin: 0.8,
  valveHeightMax: 1.5,
  doorW: 0.5,
  doorH: 1.0,
  installLaw: 'NFTC 103 2.3.1.4',
} as const;

/** 2.4.1 — 개방형(일제살수식) 방수구역 */
export const DELUGE_ZONE_LIMIT = {
  maxHeads: 50,
  minHeadsWhenSplit: 25,
  maxFloors: 2,
  law: 'NFTC 103 2.4.1.1 / 2.4.1.3',
} as const;

/** 표 2.5.3.3 [비고] 1 — 1개 층에 하나의 급수배관(또는 밸브 등)이 담당하는 구역의 최대면적 */
export const VALVE_AREA_NOTE = {
  areaMax: 3000,
  law: 'NFTC 103 표 2.5.3.3 [비고] 1',
} as const;

// ─────────────────────────────────────────────────────────────
// 2.5 배관
// ─────────────────────────────────────────────────────────────

/**
 * 표 2.5.3.3 스프링클러헤드 수별 급수관의 구경 (단위: ㎜)
 *  가 : 폐쇄형 헤드 (원칙)                                    [비고] 2
 *  나 : 폐쇄형 헤드 + 반자 아래·반자 속 헤드를 동일 급수관 가지관상 병설   [비고] 3
 *  다 : 2.7.3.1의 경우(무대부·특수가연물) 폐쇄형 헤드 / 개방형 30개 이하  [비고] 4·5
 */
export type PipeColumn = '가' | '나' | '다';

export const PIPE_SIZES_2533 = [25, 32, 40, 50, 65, 80, 90, 100, 125, 150] as const;

export const PIPE_TABLE_2533: Record<PipeColumn, number[]> = {
  // 150 ㎜ 란은 원문상 "161 이상" / "91 이상" — 상한 없음으로 처리
  가: [2, 3, 5, 10, 30, 60, 80, 100, 160, Number.POSITIVE_INFINITY],
  나: [2, 4, 7, 15, 30, 60, 65, 100, 160, Number.POSITIVE_INFINITY],
  다: [1, 2, 5, 8, 15, 27, 40, 55, 90, Number.POSITIVE_INFINITY],
};

export const PIPE_TABLE_LAW = 'NFTC 103 표 2.5.3.3';

export const PIPE_TABLE_NOTES = [
  '1. 폐쇄형스프링클러헤드를 사용하는 설비의 경우로서 1개 층에 하나의 급수배관(또는 밸브 등)이 담당하는 구역의 최대면적은 3,000 ㎡를 초과하지 않을 것',
  '2. 폐쇄형스프링클러헤드를 설치하는 경우에는 "가"란의 헤드 수에 따를 것. 다만 100개 이상의 헤드를 담당하는 급수배관(또는 밸브)의 구경을 100 ㎜로 할 경우에는 수리계산을 통하여 2.5.3.3의 단서에서 규정한 배관의 유속에 적합하도록 할 것',
  '3. 폐쇄형스프링클러헤드를 설치하고 반자 아래의 헤드와 반자 속의 헤드를 동일 급수관의 가지관상에 병설하는 경우에는 "나"란의 헤드수에 따를 것',
  '4. 2.7.3.1의 경우로서 폐쇄형스프링클러헤드를 설치하는 설비의 배관구경은 "다"란에 따를 것',
  '5. 개방형스프링클러헤드를 설치하는 경우 하나의 방수구역이 담당하는 헤드의 개수가 30개 이하일 때는 "다"란의 헤드수에 의하고, 30개를 초과할 때는 수리계산 방법에 따를 것',
];

/** 2.5.3.3 단서 — 수리계산에 따르는 경우의 유속 상한 (㎧) */
export const VELOCITY_LIMIT = {
  branch: 6,
  other: 10,
  law: 'NFTC 103 2.5.3.3 단서',
} as const;

/** 2.5.9 가지배관의 배열 */
export const BRANCH_HEAD_LIMIT: Record<StandardCode, { max: number; law: string }> = {
  nftc103: { max: 8, law: 'NFTC 103 2.5.9.2' },
  nfpc609: { max: 4, law: 'NFPC 609 제7조④' },
  nfpc609_rack: { max: 4, law: 'NFPC 609 제7조④' },
};

export const BRANCH_LIMIT_EXCEPTIONS = [
  '기존의 방호구역 안에서 칸막이 등으로 구획하여 1개의 헤드를 증설하는 경우 (2.5.9.2.1)',
  '습식 또는 부압식에 격자형 배관방식을 채택하는 때에는 펌프의 용량·배관의 구경 등을 수리학적으로 계산한 결과 헤드의 방수압 및 방수량이 소화목적을 달성하는 데 충분하다고 인정되는 경우 (2.5.9.2.2)',
];

export const TOURNAMENT_BAN_LAW = 'NFTC 103 2.5.9.1 — 토너먼트(tournament) 배관방식이 아닐 것';

/** 최소 구경 (㎜) */
export const MIN_PIPE_SIZE = {
  crossMain: { mm: 40, law: 'NFTC 103 2.5.10.1' },
  flushingConnection: { mm: 40, law: 'NFTC 103 2.5.10.2' },
  drainRiser: { mm: 50, law: 'NFTC 103 2.5.14' },
  testConnection: { mm: 25, law: 'NFTC 103 2.5.12.2' },
  circulation: { mm: 20, law: 'NFTC 103 2.5.7' },
  primingSupply: { mm: 15, law: 'NFTC 103 2.2.1.9.2' },
  hoseConnectionMain: { mm: 100, law: 'NFTC 103 2.5.5 (연결송수관 겸용 주배관)' },
} as const;

/** 2.5.12.1 후단 — 건식설비 2차측 내용적 상한 */
export const DRY_SYSTEM_VOLUME = {
  liters: 2840,
  deliverySeconds: 60,
  law: 'NFTC 103 2.5.12.1',
  requirement:
    '유수검지장치 2차 측 설비의 내용적이 2,840 L를 초과하는 건식스프링클러설비는 시험장치 개폐밸브를 완전 개방 후 1분 이내에 물이 방사되어야 한다',
} as const;

/** 2.5.17 배관의 배수를 위한 기울기 */
export const PIPE_SLOPE = {
  wetHorizontal: '습식·부압식의 배관은 수평으로 할 것 (소화수가 남는 곳에는 배수밸브 설치)',
  feedMain: 1 / 500,
  branch: 1 / 250,
  law: 'NFTC 103 2.5.17',
} as const;

/** 2.5.13 행거 */
export const HANGER = {
  branchMaxSpacing: 3.5,
  crossMainMaxSpacing: 4.5,
  feedMainMaxSpacing: 4.5,
  upwardHeadClearance: 0.08,
  law: 'NFTC 103 2.5.13',
} as const;

/** 2.5.15 주차장 */
export const PARKING_RULE = {
  rule: '주차장의 스프링클러설비는 습식 외의 방식으로 해야 한다',
  exceptions: [
    '동절기에 상시 난방이 되는 곳이거나 그 밖에 동결의 우려가 없는 곳 (2.5.15.1)',
    '스프링클러설비의 동결을 방지할 수 있는 구조 또는 장치가 된 것 (2.5.15.2)',
  ],
  law: 'NFTC 103 2.5.15',
} as const;

/** 2.5.16 급수개폐밸브 작동표시 스위치(탬퍼스위치) */
export const TAMPER_SWITCH_LAW = 'NFTC 103 2.5.16';

/** 2.5.1 배관 재질 */
export const PIPE_MATERIAL = {
  under12MPa: [
    '배관용 탄소 강관 (KS D 3507)',
    '이음매 없는 구리 및 구리합금관 (KS D 5301) — 습식의 배관에 한함',
    '배관용 스테인리스 강관 (KS D 3576) 또는 일반배관용 스테인리스 강관 (KS D 3595)',
    '덕타일 주철관 (KS D 4311)',
  ],
  over12MPa: ['압력 배관용 탄소 강관 (KS D 3562)', '배관용 아크용접 탄소강 강관 (KS D 3583)'],
  law: 'NFTC 103 2.5.1',
} as const;

// ─────────────────────────────────────────────────────────────
// 2.7 헤드
// ─────────────────────────────────────────────────────────────

export type HazardClass = 'special' | 'general';

/**
 * 2.7.3 수평거리 <개정 2024. 1. 1.>
 *  2.7.3.1 무대부 · 특수가연물을 저장 또는 취급하는 장소 : 1.7 m 이하
 *  2.7.3.2 <삭제 2024. 1. 1.>  (구 랙식 창고 2.5 m)
 *  2.7.3.3 <삭제 2024. 1. 1.>  (구 아파트 등 3.2 m)
 *  2.7.3.4 그 밖의 특정소방대상물 : 2.1 m 이하 (내화구조 2.3 m 이하)
 */
export function horizontalDistance(hazard: HazardClass, fireproof: boolean): number {
  if (hazard === 'special') return 1.7;
  return fireproof ? 2.3 : 2.1;
}

export const HORIZONTAL_DISTANCE_LAW = 'NFTC 103 2.7.3';
export const WAREHOUSE_HORIZONTAL_DISTANCE_LAW = 'NFPC 609 제7조⑤1';

export const HAZARD_LABEL: Record<HazardClass, string> = {
  special: '무대부 · 특수가연물 저장·취급 장소',
  general: '그 밖의 특정소방대상물',
};

/** 2.7.7 헤드 설치방법 */
export const HEAD_INSTALL = {
  clearanceRadius: 0.6, // 2.7.7.1
  wallClearance: 0.1, // 2.7.7.1 단서
  deflectorToCeiling: 0.3, // 2.7.7.2
  obstructionWidthFactor: 3, // 2.7.7.3 단서
  sidewallSpacing: 3.6, // 2.7.7.8
  openingHeadSpacing: 2.5, // 2.7.7.6
  openingHeadDistance: 0.15, // 2.7.7.6
  law: 'NFTC 103 2.7.7',
} as const;

/** 표 2.7.8 보의 수평거리에 따른 스프링클러헤드의 수직거리 */
export const BEAM_TABLE = [
  { under: 0.75, requirement: '보의 하단보다 낮을 것' },
  { under: 1.0, requirement: '0.1 m 미만일 것' },
  { under: 1.5, requirement: '0.15 m 미만일 것' },
  { under: Number.POSITIVE_INFINITY, requirement: '0.3 m 미만일 것' },
];
export const BEAM_TABLE_LAW = 'NFTC 103 표 2.7.8';

/** 표 2.7.6 설치장소의 평상시 최고 주위온도에 따른 폐쇄형헤드의 표시온도 */
export const TEMPERATURE_TABLE = [
  { ambientUnder: 39, rating: '79 ℃ 미만' },
  { ambientUnder: 64, rating: '79 ℃ 이상 121 ℃ 미만' },
  { ambientUnder: 106, rating: '121 ℃ 이상 162 ℃ 미만' },
  { ambientUnder: Number.POSITIVE_INFINITY, rating: '162 ℃ 이상' },
];
export const TEMPERATURE_TABLE_LAW = 'NFTC 103 표 2.7.6';
export const TEMPERATURE_FACTORY_NOTE =
  '높이가 4 m 이상인 공장에 설치하는 스프링클러헤드는 설치장소의 평상시 최고 주위온도에 관계없이 표시온도 121 ℃ 이상의 것으로 할 수 있다 <개정 2024.1.1>';

/** 2.7.5 조기반응형 헤드 설치장소 / 2.3.1.7 연계 */
export const QUICK_RESPONSE = {
  places: ['공동주택·노유자시설의 거실', '오피스텔·숙박시설의 침실, 병원의 입원실'],
  law: 'NFTC 103 2.7.5',
  linkedRule: '조기반응형 헤드를 설치하는 경우에는 습식유수검지장치 또는 부압식스프링클러설비를 설치할 것',
  linkedLaw: 'NFTC 103 2.3.1.7',
} as const;

/** 2.7.7.7 상향식 헤드 원칙 */
export const UPRIGHT_HEAD_RULE = {
  rule: '습식스프링클러설비 및 부압식스프링클러설비 외의 설비에는 상향식스프링클러헤드를 설치할 것',
  exceptions: [
    '드라이펜던트스프링클러헤드를 사용하는 경우',
    '스프링클러헤드의 설치장소가 동파의 우려가 없는 곳인 경우',
    '개방형스프링클러헤드를 사용하는 경우',
  ],
  law: 'NFTC 103 2.7.7.7',
} as const;

// ─────────────────────────────────────────────────────────────
// 2.8 송수구
// ─────────────────────────────────────────────────────────────

export const FDC = {
  sizeMM: 65,
  type: '쌍구형',
  heightMin: 0.5,
  heightMax: 1.0,
  areaPerUnit: 3000,
  maxUnits: 5,
  law: 'NFTC 103 2.8.1',
} as const;

// ─────────────────────────────────────────────────────────────
// 수리계산
// ─────────────────────────────────────────────────────────────

/** 배관 내경 (㎜) — 배관용 탄소강관(KS D 3507) 기준 참고값 */
export const PIPE_INNER_DIAMETER: Record<number, number> = {
  25: 27.6,
  32: 36.0,
  40: 41.6,
  50: 53.0,
  65: 68.8,
  80: 80.7,
  90: 92.0,
  100: 105.3,
  125: 130.8,
  150: 155.2,
  200: 204.7,
  250: 254.2,
  300: 304.7,
};

/** 조도계수 C */
export const HAZEN_WILLIAMS_C = {
  steel: 120,
  copper: 150,
  stainless: 150,
} as const;

/**
 * 관부속 상당길이 (m) — NFPA 13 기준의 참고값.
 * 국내 화재안전기준에는 상당길이 표가 없으므로 법적 근거가 아니라 설계 관행값이다.
 */
export const FITTING_EQUIV = {
  elbow90: { 25: 0.9, 32: 1.2, 40: 1.5, 50: 2.1, 65: 2.7, 80: 3.4, 90: 3.9, 100: 4.3, 125: 5.2, 150: 6.4 },
  teeDiv: { 25: 1.8, 32: 2.4, 40: 3.0, 50: 4.0, 65: 5.2, 80: 6.4, 90: 7.2, 100: 8.0, 125: 10.0, 150: 12.0 },
  osy: { 25: 0.2, 32: 0.3, 40: 0.4, 50: 0.6, 65: 0.8, 80: 1.0, 90: 1.1, 100: 1.2, 125: 1.5, 150: 1.8 },
  alarm: { 25: 2.1, 32: 2.7, 40: 3.5, 50: 4.6, 65: 5.8, 80: 7.2, 90: 8.1, 100: 9.0, 125: 11.0, 150: 13.0 },
  check: { 25: 2.4, 32: 3.2, 40: 3.8, 50: 5.2, 65: 6.7, 80: 8.2, 90: 9.4, 100: 10.6, 125: 13.0, 150: 15.0 },
} as const;

export const FITTING_EQUIV_NOTE =
  '관부속 상당길이는 NFPA 13 계열의 참고값이며 국내 화재안전기준에 규정된 표가 아닙니다. 실시설계에서는 제조사 자료 또는 프로젝트 시방서 값을 사용하십시오.';

/** 1 m 수두 → MPa (물, 상온) */
export const MPA_PER_METER = 0.0098;

/**
 * Hazen-Williams 압력손실 상수
 *   ΔP = HAZEN_WILLIAMS_CONST × Q^1.85 / (C^1.85 × d^4.87) × L
 *   Q: L/min, d: mm, L: m, ΔP: MPa
 *
 * SI 원식 hf(m) = 10.67·L·Q[㎥/s]^1.852 / (C^1.852 · D[m]^4.87) 을
 * Q[L/min]·d[mm] 로 치환하면 상수는 6.15×10⁶ (단위 m),
 * 이를 kgf/㎠ 로 바꾸면 6.05×10⁵, MPa 로 바꾸면 6.05×10⁴ 이다.
 *
 * ※ 국내 교재에서 흔히 보이는 6.053×10⁵ 은 kgf/㎠ 기준 상수다.
 *   MPa 로 표기하면서 10⁵ 을 쓰면 마찰손실이 10배로 계산된다.
 */
export const HAZEN_WILLIAMS_CONST = 6.053e4;
export const HAZEN_WILLIAMS_NOTE =
  'ΔP[MPa] = 6.053×10⁴ × Q^1.85 / (C^1.85 × d^4.87) × L  (Q: L/min, d: ㎜, L: m). ' +
  '교재에서 자주 보이는 6.053×10⁵ 은 kgf/㎠ 기준 상수이므로 MPa 로 쓸 때 그대로 넣으면 10배 과대계산됩니다.';

/** 개방형(일제살수식) 간이식 적용 한계 — 2.1.1.2 / 2.2.1.13 / 표 2.5.3.3 [비고] 5 */
export const DELUGE_SIMPLE_METHOD_LIMIT = {
  heads: 30,
  laws: ['NFTC 103 2.1.1.2 (수원)', 'NFTC 103 2.2.1.13 (송수량)', 'NFTC 103 표 2.5.3.3 [비고] 5 (배관구경)'],
} as const;

// ─────────────────────────────────────────────────────────────
// 시행령 별표 4 제1호라목 — 스프링클러설비 설치대상 (창고·공장 중심 발췌)
// ─────────────────────────────────────────────────────────────

export const INSTALL_TARGETS = [
  { no: '1)', target: '층수가 6층 이상인 특정소방대상물', requirement: '모든 층 (리모델링·용도변경 일부 제외)' },
  { no: '2)', target: '기숙사 또는 복합건축물', requirement: '연면적 5천 ㎡ 이상 → 모든 층' },
  {
    no: '4)',
    target: '판매시설·운수시설 및 창고시설(물류터미널로 한정)',
    requirement: '바닥면적 합계 5천 ㎡ 이상 또는 수용인원 500명 이상 → 모든 층',
  },
  { no: '6)', target: '창고시설(물류터미널 제외)', requirement: '바닥면적 합계 5천 ㎡ 이상 → 모든 층' },
  {
    no: '7)',
    target: '지하층·무창층 또는 층수가 4층 이상인 층',
    requirement: '바닥면적 1천 ㎡ 이상인 층 → 해당 층',
  },
  {
    no: '8)',
    target: '랙식 창고(rack warehouse)',
    requirement: '천장 또는 반자의 높이가 10 m를 초과하고, 랙이 설치된 층의 바닥면적 합계가 1천5백 ㎡ 이상 → 모든 층',
  },
  {
    no: '9)가)',
    target: '공장 또는 창고시설',
    requirement: '특수가연물을 지정수량의 1천 배 이상 저장·취급하는 시설',
  },
  {
    no: '10)',
    target: '지붕 또는 외벽이 불연재료가 아니거나 내화구조가 아닌 공장·창고시설',
    requirement:
      '가) 물류터미널 2천5백 ㎡ 또는 250명 / 나) 창고 2천5백 ㎡ / 다) 지하·무창·4층 이상 중 500 ㎡ / 라) 랙식 창고 750 ㎡ / 마) 특수가연물 500배 이상',
  },
  { no: '12)', target: '지하가(터널 제외)', requirement: '연면적 1천 ㎡ 이상' },
  { no: '13)', target: '발전시설 중 전기저장시설', requirement: '해당 시설' },
];

export const INSTALL_TARGETS_LAW = '「소방시설 설치 및 관리에 관한 법률 시행령」 별표 4 제1호라목';

// ─────────────────────────────────────────────────────────────
// 참고 — 법정기준이 아닌 임의기준
// ─────────────────────────────────────────────────────────────

export const KFS_1013_NOTE =
  'KFS 1013(한국화재보험협회 스프링클러설비기준)의 「상급·중급·경급 위험용도」 분류는 보험·특수건물 평가용 임의기준이며 ' +
  '인허가 근거가 아닙니다. 국내 법정기준(NFPC/NFTC)에는 위험등급 개념이 없고, 기준개수는 표 2.1.1.1의 용도·층수·헤드 부착높이로 정합니다.';

// ─────────────────────────────────────────────────────────────
// 화재조기진압용 스프링클러설비 (ESFR) — NFPC/NFTC 103B
//   NFPC 609 제7조①4: 천장 높이가 13.7 m 이하인 랙식 창고에는 ESFR을 설치할 수 있다.
// ─────────────────────────────────────────────────────────────

export const ESFR = {
  /** 설치장소의 구조 — 해당 층의 높이 13.7 m 이하 */
  maxCeilingHeight: 13.7,
  /** 수원 — 가장 먼 가지배관 3개 × 각 4개 헤드 동시 개방 = 12개 */
  simultaneousBranches: 3,
  headsPerBranch: 4,
  simultaneousHeads: 12,
  /** 방수시간 60분 */
  durationMinutes: 60,
  /** 헤드 하나의 방호면적 6.0 ㎡ 이상 9.3 ㎡ 이하 */
  headAreaMin: 6.0,
  headAreaMax: 9.3,
  /** 천장 높이 9.1 m 미만일 때 헤드 사이 거리 2.4 ~ 3.7 m */
  headSpacingMin: 2.4,
  headSpacingMax: 3.7,
  /** 저장물품 상호간 간격 152 ㎜ 이상 */
  storageClearanceMM: 152,
  law: 'NFPC 103B / NFTC 103B',
  warehouseLaw: 'NFPC 609 제7조①4',
  /**
   * 수원 Q = 12 × K√(10P) × 60 (L).
   * K계수와 최소방수압력 P는 천장높이·저장높이 조합별 표(NFTC 103B 별표)에 따르므로
   * 이 앱은 값을 하드코딩하지 않고 사용자 입력을 받는다. ⚠ 원문 표 대조 필수.
   */
  note:
    'ESFR의 K계수와 최소방수압력은 천장높이·저장높이 조합별 표(NFTC 103B 별표)에 따릅니다. ' +
    '이 앱은 해당 표를 내장하지 않으므로 원문에서 확인한 값을 직접 입력하십시오.',
} as const;

/** ESFR 계산: Q[L/min] = 헤드수 × K × √(10P) */
export function esfrFlow(kFactor: number, pressureMPa: number, heads = ESFR.simultaneousHeads): number {
  if (kFactor <= 0 || pressureMPa <= 0) return 0;
  return heads * kFactor * Math.sqrt(10 * pressureMPa);
}

// ─────────────────────────────────────────────────────────────
// 특수가연물 — 「화재의 예방 및 안전관리에 관한 법률 시행령」 별표 2
//   NFTC 103 2.7.3.1 및 표 2.5.3.3 [비고] 4의 「특수가연물」 판단 근거
// ─────────────────────────────────────────────────────────────

export const SPECIAL_COMBUSTIBLES = [
  { name: '면화류', qty: '200 kg 이상' },
  { name: '나무껍질 및 대팻밥', qty: '400 kg 이상' },
  { name: '넝마 및 종이부스러기', qty: '1,000 kg 이상' },
  { name: '사류(絲類)', qty: '1,000 kg 이상' },
  { name: '볏짚류', qty: '1,000 kg 이상' },
  { name: '가연성고체류', qty: '3,000 kg 이상' },
  { name: '석탄·목탄류', qty: '10,000 kg 이상' },
  { name: '가연성액체류', qty: '2 ㎥ 이상' },
  { name: '목재가공품 및 나무부스러기', qty: '10 ㎥ 이상' },
  { name: '고무류·플라스틱류 — 발포시킨 것', qty: '20 ㎥ 이상' },
  { name: '고무류·플라스틱류 — 그 밖의 것', qty: '3,000 kg 이상' },
];

export const SPECIAL_COMBUSTIBLES_LAW = '「화재의 예방 및 안전관리에 관한 법률 시행령」 별표 2 (제19조제1항 관련)';

/** 시행령 별표 4 제1호라목 9)가) — 지정수량 1천 배 이상이면 스프링클러 대상 */
export const SPECIAL_COMBUSTIBLE_MULTIPLIER = { sprinklerTarget: 1000, nonFireproof: 500 };

// ─────────────────────────────────────────────────────────────
// 그 밖에 함께 확인해야 하는 기준
// ─────────────────────────────────────────────────────────────

export const RELATED_STANDARDS = [
  { code: '시행령 별표 4', title: '소방시설 설치 및 관리에 관한 법률 시행령 — 스프링클러설비 설치대상', why: '설치 대상 판단의 유일한 근거' },
  { code: 'NFPC/NFTC 103', title: '스프링클러설비', why: '본 설비의 기본 기준' },
  { code: 'NFPC/NFTC 103A', title: '간이스프링클러설비', why: '간이 대상 여부 확인' },
  { code: 'NFPC/NFTC 103B', title: '화재조기진압용 스프링클러설비(ESFR)', why: '천장 13.7 m 이하 랙식 창고의 대안 (NFPC 609 제7조①4)' },
  { code: 'NFPC/NFTC 608', title: '공동주택의 화재안전기준', why: '아파트 등은 NFTC 103 표 2.1.1.1에서 제외됨' },
  { code: 'NFPC/NFTC 609', title: '창고시설의 화재안전기준', why: '창고는 2024.1.1부터 이 기준이 단독 규율' },
  { code: 'NFTC 102', title: '옥내소화전설비', why: '수원·펌프 겸용 시 합산 (2.13.1), 내화·내열배선 표 준용 (2.11.2)' },
  { code: 'NFTC 104', title: '물분무소화설비', why: '차고·주차장 배수설비 기준은 이쪽 소관' },
  { code: 'NFTC 105', title: '포소화설비', why: '차고·주차장 바닥면적 산정 (2.9.2 단서)' },
  { code: 'NFTC 203', title: '자동화재탐지설비 및 시각경보장치', why: '준비작동식·일제살수식 감지기 기준 (2.6.3.4), 교차회로 예외 감지기 (2.6.3.2.2)' },
  { code: 'NFTC 505', title: '무선통신보조설비', why: '감시제어반 전용실 통신 요건 (2.10.3.3.4)' },
  { code: 'NFTC 602', title: '소방시설용 비상전원수전설비', why: '비상전원수전설비로 갈음하는 경우 (2.9.3)' },
  { code: '소방시설의 내진설계 기준', title: '소방청고시', why: '흔들림 방지 버팀대 등 — NFTC 103에는 내진 조항이 없음' },
  { code: '화재예방법 시행령 별표 2', title: '특수가연물', why: '수평거리 1.7 m 및 배관구경 "다"란 적용 판단' },
  { code: '건축법 시행령 제46조', title: '방화구획', why: '방호구역 층 제한·가압수조 설치장소' },
  { code: 'KFS 1013', title: '한국화재보험협회 스프링클러설비기준', why: '보험·특수건물 평가용 임의기준 — 인허가 근거 아님' },
];

// ─────────────────────────────────────────────────────────────
// 기동장치 — 센서와 액추에이터의 구분
// ─────────────────────────────────────────────────────────────

/**
 * 기동용수압개폐장치는 압력을 「만드는」 장치가 아니라 「읽는」 장치다.
 * 압력을 실제로 보충하는 것은 충압펌프다. 둘은 센서와 액추에이터의 관계이며 중복이 아니다.
 *
 * · 1.7.1.9  "기동용수압개폐장치"란 배관 내 압력변동을 검지하여 자동적으로 펌프를 기동 및
 *            정지시키는 것으로서 「압력챔버 또는 기동용압력스위치 등」을 말한다
 * · 2.2.1.7  기동장치로는 기동용수압개폐장치 또는 이와 동등 이상의 성능이 있는 것을 설치할 것
 * · 2.2.1.8  기동용수압개폐장치 「중 압력챔버를 사용할 경우」 그 용적은 100 L 이상
 *            → 기동용압력스위치 방식이면 100 L 규정은 적용되지 않는다
 */
export const START_DEVICE = {
  role: '센서 — 계통 압력을 검지하여 접점 신호를 낼 뿐, 물을 공급하지 않는다',
  chamberLiters: 100,
  chamberLaw: 'NFTC 103 2.2.1.8',
  definitionLaw: 'NFTC 103 1.7.1.9 / 2.2.1.7',
  /** 100 L가 저수량이 될 수 없음을 보여주는 환산 */
  capacityNote:
    '100 L는 헤드 1개(80 L/min) 기준 75초, 기준개수 30개(2,400 L/min) 기준 2.5초분에 불과하다. ' +
    '공급용이 아니라 상부 공기쿠션으로 미세 압력변동을 완충하기 위한 최소 용적이다.',
  /** 인출점 원칙 */
  tapPoint: '모든 펌프의 토출측 체크밸브 이후, 공용 주배관(헤더)에서 인출할 것',
  tapWarning:
    '특정 펌프의 차단밸브 안쪽에서 인출하면, 그 펌프를 정비하려고 밸브를 잠그는 순간 ' +
    '압력스위치가 계통에서 분리되어 전 펌프가 기동 신호를 잃는다 — 단일고장점',
  testLaw: 'NFTC 103 2.10.3.8 (1) — 기동용수압개폐장치의 압력스위치회로 도통시험·작동시험',
} as const;

/** 충압펌프 용량의 상·하한 (2.2.1.14.2의 실무적 해석) */
export const JOCKEY_SIZING = {
  rule: '정상 누설량 < 충압펌프 토출량 < 헤드 1개 방수량',
  tooSmall: '누설을 못 따라가 압력이 계속 떨어지고 주펌프가 수시로 기동',
  tooLarge: '헤드 1개가 열려도 충압펌프가 감당해버려 압력이 안 떨어지고 주펌프가 기동하지 않음',
  law: 'NFTC 103 2.2.1.14',
  exemptions: [
    'NFTC 103 2.2.1.5 단서 — 성능시험배관 불요',
    'NFTC 103 2.2.1.6 단서 — 순환배관 불요',
    'NFTC 103 2.2.1.17 단서 — 자동정지 허용(주펌프는 자동정지 금지)',
  ],
} as const;

// ─────────────────────────────────────────────────────────────
// 감압 — 존 높이의 물리적 한계
// ─────────────────────────────────────────────────────────────

/**
 * 하나의 압력존은 최상단이 최소압을, 최하단이 최대압을 동시에 만족해야 한다.
 * 그 스팬을 수두로 환산한 값이 「이론상 최대 존 높이」다.
 * 마찰손실·안전여유를 빼면 실무 존 높이는 그 60~70 % 수준이다. ⚠
 */
export const PRESSURE_ZONE = [
  { system: '스프링클러설비', min: 0.1, max: 1.2, law: 'NFTC 103 2.2.1.10', verified: true },
  { system: '옥내소화전설비', min: 0.17, max: 0.7, law: 'NFTC 102 ⚠ 원문 확인 요망', verified: false },
  { system: '옥외소화전설비', min: 0.25, max: 0.7, law: 'NFTC 109 ⚠ 원문 확인 요망', verified: false },
];

/** 압력 스팬(MPa) → 이론 최대 존 높이(m) */
export function maxZoneHeight(minMPa: number, maxMPa: number): number {
  return (maxMPa - minMPa) / MPA_PER_METER;
}

export const PRESSURE_REDUCING_METHODS = [
  {
    method: '계통 분리 (존 분할)',
    where: '중간층 기계실 — 고층부·저층부를 별도 펌프·입상관으로',
    pros: '가장 확실. 과압 자체를 만들지 않으므로 고장 요소가 없음',
    cons: '기계실 공간과 초기 투자가 큼',
  },
  {
    method: '감압밸브 (Pressure Reducing Valve)',
    where: '입상관에서 해당 존으로 분기하는 지점 / 유수검지장치 1차측',
    pros: '유량이 변해도 2차측 압력을 일정하게 유지',
    cons: '고장이 양방향으로 위험 — 닫힌 채 고장이면 방수 불가, 열린 채 고장이면 과압. 바이패스·스트레이너·전후 압력계 필수',
  },
  {
    method: '감압 오리피스 / 감압형 앵글밸브',
    where: '방수구(호스접결구) 인입 측 / 가지배관',
    pros: '단순하고 고장 요소가 없음',
    cons: '고정 저항이므로 유량이 바뀌면 감압량도 함께 변함',
  },
];

export const PRV_NAMING_WARNING =
  '릴리프밸브(Pressure Relief Valve)와 감압밸브(Pressure Reducing Valve)는 영문 약어가 모두 PRV여서 혼동이 잦다. ' +
  '릴리프밸브는 설정압 초과분을 「버려」 펌프를 보호하고, 감압밸브는 2차측 압력을 「낮춰 유지」하여 말단을 보호한다. ' +
  '도서에는 한글로 구분해 표기할 것.';

// ─────────────────────────────────────────────────────────────
// 흡입 방식 — 정압수조 / 부압수조
// ─────────────────────────────────────────────────────────────

/**
 * 판단 기준은 「수조 최저수위(L.W.L)와 펌프 임펠러 중심의 표고 관계」 하나뿐이다.
 * 계통도(P&ID)의 그림상 높낮이는 축척이 아니므로 판단 근거가 되지 못한다.
 */
export const SUCTION_TYPE = {
  flooded: {
    label: '정압수조 (Flooded suction)',
    criterion: 'L.W.L 표고 > 펌프 임펠러 중심 표고',
    required: [] as string[],
    notRequired: [
      '후드밸브 — 정압이라 마중물이 저절로 유지됨',
      '물올림장치 — 2.2.1.9는 "수원의 수위가 펌프보다 낮은 위치"인 경우에만 요구',
      '연성계·진공계 — 2.2.1.4 단서로 생략 가능(설치해도 무방)',
    ],
  },
  lift: {
    label: '부압수조 (Suction lift)',
    criterion: 'L.W.L 표고 < 펌프 임펠러 중심 표고',
    required: [
      '후드밸브 — 마중물 유지 (체크 + 여과망 일체)',
      '물올림장치 — 전용수조 100 L 이상, 급수배관 15 ㎜ 이상 (2.2.1.9)',
      '연성계 또는 진공계 — 흡입측이 부압이므로 일반 압력계로는 읽을 수 없음 (2.2.1.4 본문)',
      '펌프마다 수조로부터 별도의 흡입배관 (2.5.4.2)',
    ],
    notRequired: [] as string[],
  },
} as const;

/** 도면만으로 흡입방식을 확정할 수 없을 때 확인해야 하는 자료 */
export const SUCTION_TYPE_EVIDENCE = [
  { item: '수조 L.W.L 표고와 펌프 임펠러 중심 표고', strength: '확정', note: '이것만이 유일한 판단 근거' },
  { item: '기계실 단면도 / 배치도의 EL. 표기', strength: '확정', note: '표고가 직접 표기됨' },
  { item: '펌프 벤더 데이터시트의 NPSH 계산', strength: '확정', note: 'NPSHa 산출에 흡입양정 부호가 나타남' },
  { item: '레벨 계기(LT·LSL)의 설정 표고', strength: '강함', note: 'L.W.L을 역산할 수 있음' },
  { item: '후드밸브·물올림탱크의 유무', strength: '중간', note: '별도 상세도(DETAIL)에 있을 수 있어 단정 불가' },
  { item: '흡입측 계기가 PG인지 연성계인지', strength: '중간', note: 'P&ID 태그만으로는 구분 안 됨 — 계기 사양서 확인' },
  { item: '계통도의 그림상 높낮이', strength: '약함', note: '계통도는 축척이 아니다 — 판단 근거로 쓸 수 없음' },
];
