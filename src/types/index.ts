import type { HazardClass, PipeColumn, StandardCode } from '../constants/nfpc';

export type { HazardClass, PipeColumn, StandardCode };

export type SystemType = 'wet' | 'dry' | 'deluge' | 'preaction' | 'esfr';

export const SYSTEM_LABELS: Record<SystemType, string> = {
  wet: '습식',
  dry: '건식',
  preaction: '준비작동식',
  deluge: '일제살수식',
  esfr: '화재조기진압용(ESFR)',
};

/** 시행령 별표 4 판단과 기준 선택을 위한 용도 */
export type BuildingUsage =
  | 'factory_special'
  | 'factory_other'
  | 'retail'
  | 'retail_other'
  | 'general_h8_over'
  | 'general_h8_under'
  | 'over11_underground'
  | 'warehouse_general'
  | 'warehouse_rack'
  | 'parking'
  | 'stage'
  | 'apartment';

/** 흡입 방식 — 수조 최저수위(L.W.L)와 펌프 임펠러 중심의 표고 관계 */
export type SuctionType = 'flooded' | 'lift';

export interface DesignCondition {
  /** 적용 기준 — NFTC 103 / NFPC 609 / NFPC 609(랙식) */
  standard: StandardCode;
  /** 정압수조(flooded) / 부압수조(lift) — 흡입측 부속 구성을 가른다 */
  suctionType: SuctionType;
  /** 표 2.1.1.1의 설치장소 id (창고는 사용하지 않음) */
  placeCategoryId: string;
  usage: BuildingUsage;
  /** 내화구조 여부 — 수평거리 2.1 m / 2.3 m 분기 (2.7.3.4) */
  fireproof: boolean;
  /** 동결 우려 */
  temp: 'normal' | 'cold' | 'freeze';
  /** 냉동창고 또는 영하 냉장창고 (NFPC 609 제7조①1 가목) */
  coldStorage: boolean;
  /** 상시 근무자가 없어 난방을 하지 않는 창고 (NFPC 609 제7조①1 나목) */
  unheatedWarehouse: boolean;
  /** 천장(반자) 높이 — ESFR 13.7 m 판정 및 부착높이 8 m 판정 */
  ceiling: number;
  /** 수손 민감도 — 준비작동식 채택 사유 (법정 강제 아님) */
  damage: 'normal' | 'sensitive' | 'critical';
  /** 격자형(그리드) 배관방식 채택 — 방호구역 3,700 ㎡ 및 가지배관 예외 */
  gridPipe: boolean;
  totalArea: number;
  /** 사용자가 방식을 직접 지정한 경우 */
  systemOverride?: SystemType;
}

export interface LawCheck {
  label: string;
  actual: string;
  standard: string;
  isPassing: boolean;
  isWarning?: boolean;
  law: string;
}

export interface SystemResult {
  system: SystemType;
  /** 법이 강제한 결과인지 */
  isMandated: boolean;
  isManualOverride: boolean;
  reasons: string[];
  laws: string[];
  valves: ValveItem[];
  checks: LawCheck[];
  zoneCheck?: ZoneCheck;
}

export interface ZoneCheck {
  system: SystemType;
  standard: StandardCode;
  totalArea: number;
  maxAreaPerValve: number;
  gridPipe: boolean;
  valveCount: number;
  zones: Zone[];
  warnings: string[];
  laws: string[];
}

export interface Zone {
  zoneId: number;
  area: number;
  headCount: number;
  rooms: string[];
  valveSize: string;
  crossMainPipe: string;
  mainPipe: string;
}

export interface ValveItem {
  icon: string;
  name: string;
  size: string;
  desc: string;
  law: string;
}

export interface Room {
  id: number;
  name: string;
  w: number;
  d: number;
  /** 2.7.3 수평거리 구분 — 무대부·특수가연물(1.7 m) / 그 밖(2.1·2.3 m) */
  hazard: HazardClass;
  /** 반자 아래와 반자 속 헤드를 동일 가지관에 병설 → 표 2.5.3.3 "나"란 */
  ceilingVoidHeads?: boolean;
}

export interface HeadSpec {
  type: string;
  responseType: string;
  orifice: string;
  temp: string;
  flowPerHead: number;
  law: string;
}

export interface PipeSize {
  size: string;
  mm: number;
}

export interface RoomPlacement {
  room: Room;
  /** 적용 수평거리 R (m) */
  horizontalDistance: number;
  /** 정방형 배치 간격 S = 1.414 R */
  maxSpacing: number;
  hxCount: number;
  hyCount: number;
  heads: number;
  actualSpacingX: number;
  actualSpacingY: number;
  spacingOk: boolean;
  wallDistX: number;
  wallDistY: number;
  wallDistOk: boolean;
  flowPerHead: number;
  roomFlow: number;
  headType: HeadSpec;
  /** 교차배관 기준 한쪽 가지배관의 헤드 수 */
  headsPerBranchSide: number;
  branchLimit: number;
  branchOk: boolean;
  /** 적용 급수관 구경표 란 */
  pipeColumn: PipeColumn;
  branchPipe: PipeSize;
  crossPipe: PipeSize;
  /** 필요한 교차배관 개수 (가지배관 헤드 제한을 만족시키기 위한) */
  crossMainCount: number;
}

export interface PipeCalcResult {
  system: SystemType;
  standard: StandardCode;
  totalHeads: number;
  totalFlow: number;
  designFlow: number;
  riserPipe: PipeSize;
  mainPipe: PipeSize;
  valveSize: string;
  roomDetails: RoomPipeDetail[];
  valves: ValveItem[];
  zones?: Zone[];
  checks: LawCheck[];
}

export interface RoomPipeDetail extends RoomPlacement {
  cumulativeFlow: number;
  cumulativePipe: PipeSize;
  zoneId?: number;
}

// ── 수원 · 가압송수장치 ─────────────────────────────

export interface WaterSupplyInput {
  standard: StandardCode;
  /** 표 2.1.1.1 또는 NFPC 609의 기준개수 */
  standardHeadCount: number;
  /** 헤드 설치개수가 가장 많은 층(방호구역)의 실제 헤드 수 */
  installedHeads: number;
  /** 실양정 h₁ (m) */
  h1: number;
  /** 마찰손실 h₂ (m) */
  h2: number;
  /** 펌프 효율 η */
  efficiency: number;
  /** 전달계수 K */
  transmission: number;
  /** 주배관 설계유속 (㎧) */
  velocity: number;
  /** 옥상수조 면제 사유 적용 */
  roofTankExempt: boolean;
  /** 겸용 설비 저수량 합계 (㎥) — 2.13.1 합산 */
  combinedOtherVolume?: number;
}

export interface WaterSupplyResult {
  appliedHeadCount: number;
  usedInstalledCount: boolean;
  coefficient: number;
  flowPerHead: number;
  waterVolume: number;
  roofTankVolume: number;
  roofTankExempt: boolean;
  combinedTotal?: number;
  designFlowLPM: number;
  designFlowM3min: number;
  totalHead: number;
  totalHeadMPa: number;
  shaftPowerKW: number;
  motorKW: number;
  churnMaxHead: number;
  peakFlowLPM: number;
  peakMinHead: number;
  flowMeterMinLPM: number;
  mainPipe: PipeSize;
  minMainPipe: PipeSize;
  checks: LawCheck[];
  laws: string[];
}

// ── 건식 2차측 내용적 (NFTC 103 2.5.12.1) ──────────

export interface DryPipeSegment {
  id: number;
  mm: number;
  length: number;
}

export interface DryVolumeResult {
  segments: (DryPipeSegment & { litersPerM: number; liters: number })[];
  totalLiters: number;
  limitLiters: number;
  exceeds: boolean;
  /** 참고 — 방호면적으로 환산한 배관 체적밀도 (L/㎡) */
  volumePerArea?: number;
  equivalentArea?: number;
  requirement: string;
  law: string;
}

// ── 수리계산 ────────────────────────────────────────

export interface PipeSectionInput {
  name: string;
  pipeSize: string;
  flowLPM: number;
  straightLength: number;
  fittings: {
    elbow90: number;
    teeDiv: number;
    osy: number;
    alarm: number;
    check: number;
  };
}

export interface PipeSectionResult extends PipeSectionInput {
  innerDiameter: number;
  equivalentLength: number;
  totalLength: number;
  pressureLoss: number;
  velocity: number;
  velocityLimit: number;
  velocityOk: boolean;
}

export interface HydraulicInput {
  C: number;
  elevation: number;
  sections: PipeSectionInput[];
}

export interface HydraulicResult {
  sections: PipeSectionResult[];
  totalFrictionLoss: number;
  elevationLoss: number;
  terminalPressure: number;
  requiredSupplyPressure: number;
  isPassing: boolean;
  isOverPressure: boolean;
  checks: LawCheck[];
  law: string;
}

// ── 계산서 ──────────────────────────────────────────

export interface ReportData {
  projectName: string;
  designerName: string;
  date: string;
  condition: DesignCondition | null;
  systemResult: SystemResult | null;
  waterSupply: WaterSupplyResult | null;
  rooms: Room[];
  pipeResult: PipeCalcResult | null;
  hydraulicResult: HydraulicResult | null;
  dryVolume: DryVolumeResult | null;
}

export interface WorstHead {
  roomName: string;
  roomW: number;
  roomD: number;
  hxIndex: number;
  hyIndex: number;
  hxCount: number;
  hyCount: number;
  hxInGroup: number;
  branchPipeSize: string;
  crossPipeSize: string;
  riserPipeSize: string;
  flowPerHead: number;
  designFlow: number;
}
