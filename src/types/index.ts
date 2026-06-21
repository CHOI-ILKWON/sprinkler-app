export type SystemType = 'wet' | 'dry' | 'deluge' | 'preaction';

export type RiskLevel = 'light' | 'ordinary1' | 'ordinary2' | 'extra';

export type BuildingUsage =
  | 'office' | 'hotel' | 'apartment' | 'retail'
  | 'warehouse_general'
  | 'warehouse_rack'
  | 'warehouse_high'
  | 'parking_indoor' | 'parking_outdoor'
  | 'factory_normal' | 'factory_hazard'
  | 'data_center' | 'museum' | 'stage' | 'cold_storage' | 'hospital';

export interface DesignCondition {
  usage: BuildingUsage;
  temp: 'normal' | 'cold' | 'freeze';
  ceiling: number;
  damage: 'normal' | 'sensitive' | 'critical';
  fire: 'slow' | 'fast';
  totalArea: number;
  warehouseSystemOverride?: SystemType;
}

export interface SystemResult {
  system: SystemType;
  reasons: string[];
  laws: string[];
  valves: ValveItem[];
  warehouseCheck?: WarehouseCheck;
  isManualOverride: boolean;
}

export interface WarehouseCheck {
  system: SystemType;
  totalArea: number;
  maxAreaPerValve: number;
  maxHeadsPerValve: number;
  valveCount: number;
  zones: WarehouseZone[];
  warnings: string[];
  laws: string[];
}

export interface WarehouseZone {
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
}

export interface Room {
  id: number;
  name: string;
  w: number;
  d: number;
  risk: RiskLevel;
}

export interface HeadSpec {
  type: string;
  responseType: string;
  rti: string;
  orifice: string;
  temp: string;
  flowPerHead: number;
}

export interface PipeSize {
  size: string;
  mm: number;
}

export interface RoomPlacement {
  room: Room;
  hxCount: number;
  hyCount: number;
  heads: number;
  actualSpacingX: number;
  actualSpacingY: number;
  spacingOk: boolean;
  wallDistX: number;
  wallDistY: number;
  flowPerHead: number;
  roomFlow: number;
  headType: HeadSpec;
  branchPipe: PipeSize;
  crossPipe: PipeSize;
}

export interface PipeCalcResult {
  system: SystemType;
  totalHeads: number;
  totalFlow: number;
  riserPipe: PipeSize;
  mainPipe: PipeSize;
  valveSize: string;
  roomDetails: RoomPipeDetail[];
  valves: ValveItem[];
  zones?: WarehouseZone[];
}

export interface RoomPipeDetail extends RoomPlacement {
  cumulativeFlow: number;
  cumulativePipe: PipeSize;
  zoneId?: number;
}

// ── 수리계산 관련 ──────────────────────────────────

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
}

export interface HydraulicInput {
  C: number;
  riserLength: number;
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
  law: string;
}

// ── 계산서 출력 관련 ───────────────────────────────

export interface ReportData {
  projectName: string;
  designerName: string;
  date: string;
  systemResult: SystemResult | null;
  rooms: Room[];
  pipeResult: PipeCalcResult | null;
  hydraulicResult: HydraulicResult | null;
  warehouseCheck?: WarehouseCheck | null;
}

export interface CheckItem {
  label: string;
  actual: string;
  standard: string;
  isPassing: boolean;
  isWarning?: boolean;
  law: string;
}

// ── 최불리 헤드 ────────────────────────────────────

export interface WorstHead {
  roomName: string;
  roomW: number;
  roomD: number;
  hxIndex: number;     // 절대 열 인덱스 (0-based) — 렌더링용
  hyIndex: number;     // 절대 행 인덱스 (0-based)
  hxCount: number;
  hyCount: number;
  hxInGroup: number;   // 가지관 그룹 내 열 인덱스 (0-based) — 길이 추정용
  branchPipeSize: string;
  crossPipeSize: string;
  riserPipeSize: string;
  flowPerHead: number;
  designFlow: number;
}
