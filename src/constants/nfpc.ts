export const RISK_TABLE = {
  light:     { area: 20.9, spacing: 4.6, flow: 80,  label: '경급',    law: 'NFPC 103 제10조' },
  ordinary1: { area: 12.1, spacing: 4.0, flow: 114, label: '중급 I',  law: 'NFPC 103 제10조' },
  ordinary2: { area: 9.3,  spacing: 3.7, flow: 114, label: '중급 II', law: 'NFPC 103 제10조' },
  extra:     { area: 9.3,  spacing: 3.1, flow: 189, label: '상급',    law: 'NFPC 103 제10조' },
} as const;

export const PIPE_BY_HEADS = [
  { maxHeads: 1,        size: '25A (1")',    mm: 25 },
  { maxHeads: 2,        size: '32A (1¼")',   mm: 32 },
  { maxHeads: 5,        size: '40A (1½")',   mm: 40 },
  { maxHeads: 10,       size: '50A (2")',    mm: 50 },
  { maxHeads: 30,       size: '65A (2½")',   mm: 65 },
  { maxHeads: 60,       size: '80A (3")',    mm: 80 },
  { maxHeads: 100,      size: '100A (4")',   mm: 100 },
  { maxHeads: 160,      size: '125A (5")',   mm: 125 },
  { maxHeads: Infinity, size: '150A (6")',   mm: 150 },
] as const;

export const PIPE_BY_FLOW = [
  { maxLPM: 114,        size: '25A (1")',    mm: 25 },
  { maxLPM: 227,        size: '32A (1¼")',   mm: 32 },
  { maxLPM: 454,        size: '40A (1½")',   mm: 40 },
  { maxLPM: 757,        size: '50A (2")',    mm: 50 },
  { maxLPM: 1514,       size: '65A (2½")',   mm: 65 },
  { maxLPM: 3028,       size: '80A (3")',    mm: 80 },
  { maxLPM: 6057,       size: '100A (4")',   mm: 100 },
  { maxLPM: 9085,       size: '125A (5")',   mm: 125 },
  { maxLPM: Infinity,   size: '150A (6")',   mm: 150 },
] as const;

export const WAREHOUSE_LIMITS = {
  wet: {
    maxAreaPerValve: 3000,
    maxHeadsPerValve: 200,
    law: 'NFPC 103 제7조 ② (습식 유수검지장치 방호구역)',
  },
  dry: {
    maxAreaPerValve: 1850,
    maxHeadsPerValve: 500,
    chargeTime: 60,
    law: 'NFPC 103 제8조 ③④ (건식 방호구역 및 충수시간)',
  },
} as const;

export const MAX_HEADS_PER_BRANCH = 8;

export const HEAD_INSTALL = {
  wallClearanceRatio: 0.5,
  obstacleMin: 0.6,
  ceilingGapMin: 0.030,
  ceilingGapMax: 0.060,
} as const;

// ── 부속류 상당길이 (NFPA 13 기준, 단위: m) ─────────
export const FITTING_EQUIV = {
  elbow90: { 25: 0.9,  32: 1.2,  40: 1.5,  50: 2.1,  65: 2.7,  80: 3.4,  100: 4.3  },
  teeDiv:  { 25: 1.8,  32: 2.4,  40: 3.0,  50: 4.0,  65: 5.2,  80: 6.4,  100: 8.0  },
  osy:     { 25: 0.2,  32: 0.3,  40: 0.4,  50: 0.6,  65: 0.8,  80: 1.0,  100: 1.2  },
  alarm:   { 25: 2.1,  32: 2.7,  40: 3.5,  50: 4.6,  65: 5.8,  80: 7.2,  100: 9.0  },
  check:   { 25: 2.4,  32: 3.2,  40: 3.8,  50: 5.2,  65: 6.7,  80: 8.2,  100: 10.6 },
} as const;

// 배관 내경 (mm) — KS D 3507 배관용 탄소강강관
export const PIPE_INNER_DIAMETER: Record<number, number> = {
  25:  27.6,
  32:  36.0,
  40:  41.6,
  50:  53.0,
  65:  68.8,
  80:  80.7,
  100: 105.3,
  125: 130.8,
  150: 155.2,
};

// 동시개방 기준개수 (NFPC 103 제7조①)
export const SIMULTANEOUS_HEADS: Record<string, number> = {
  light:     10,
  ordinary1: 20,
  ordinary2: 20,
  extra:     30,
  esfr:      12,
  deluge:    -1,
};

export const SIMULTANEOUS_HEADS_LAW = 'NFPC 103 제7조① (기준개수에 의한 설계유량)';

// 헤드 압력 기준 (NFPC 103 제10조④)
export const HEAD_PRESSURE = {
  min: 0.1,
  max: 1.2,
  law: 'NFPC 103 제10조④',
} as const;

// 조도계수
export const HAZEN_WILLIAMS_C = {
  steel:      120,
  copper:     150,
  stainless:  150,
} as const;
