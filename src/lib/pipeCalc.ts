import type { Room, RoomPipeDetail, PipeCalcResult, PipeSize, SystemType, WarehouseZone } from '../types';
import { RISK_TABLE, PIPE_BY_HEADS, PIPE_BY_FLOW } from '../constants/nfpc';
import { selectHead } from './headSpec';
import { getValveList } from './systemSelector';

export function calcPipes(
  rooms: Room[],
  system: SystemType,
  zones?: WarehouseZone[]
): PipeCalcResult {
  let cumFlow = 0;

  const roomDetails: RoomPipeDetail[] = rooms.map(room => {
    const risk = RISK_TABLE[room.risk];
    const hx = Math.ceil(room.w / risk.spacing);
    const hy = Math.ceil(room.d / risk.spacing);
    const heads = hx * hy;
    const flowPerHead = risk.flow;
    const roomFlow = heads * flowPerHead;
    cumFlow += roomFlow;

    const headType = selectHead(room.risk, system);
    const branchPipe = getPipeSizeByHeads(hx);
    const crossPipe  = getPipeSizeByHeads(heads);
    const cumPipe    = getPipeSizeByFlow(cumFlow);

    const zoneId = zones
      ? (zones.findIndex(z => z.rooms.includes(room.name)) + 1) || undefined
      : undefined;

    return {
      room,
      hxCount: hx,
      hyCount: hy,
      heads,
      actualSpacingX: room.w / hx,
      actualSpacingY: room.d / hy,
      spacingOk: (room.w / hx) <= risk.spacing && (room.d / hy) <= risk.spacing,
      wallDistX: (room.w / hx) / 2,
      wallDistY: (room.d / hy) / 2,
      flowPerHead,
      roomFlow,
      headType,
      branchPipe,
      crossPipe,
      cumulativeFlow: cumFlow,
      cumulativePipe: cumPipe,
      zoneId,
    };
  });

  const riserPipe = getPipeSizeByFlow(cumFlow);
  const valveSize = getValveSizeByFlow(cumFlow);

  return {
    system,
    totalHeads: roomDetails.reduce((s, r) => s + r.heads, 0),
    totalFlow: cumFlow,
    riserPipe,
    mainPipe: riserPipe,
    valveSize,
    roomDetails,
    valves: getValveList(system, valveSize),
    zones,
  };
}

function getPipeSizeByHeads(heads: number): PipeSize {
  const entry = PIPE_BY_HEADS.find(p => heads <= p.maxHeads)!;
  return { size: entry.size, mm: entry.mm };
}

function getPipeSizeByFlow(lpm: number): PipeSize {
  const entry = PIPE_BY_FLOW.find(p => lpm <= p.maxLPM)!;
  return { size: entry.size, mm: entry.mm };
}

export function getValveSizeByFlow(lpm: number): string {
  if (lpm <= 454)  return '40A';
  if (lpm <= 757)  return '50A';
  if (lpm <= 1514) return '65A';
  if (lpm <= 3028) return '80A';
  if (lpm <= 6057) return '100A';
  return '125A';
}
