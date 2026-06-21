import { useState } from 'react';
import type { Room, RoomPlacement, SystemType, RiskLevel, WarehouseZone, PipeCalcResult, WorstHead } from '../../types';
import { placeHeads, getBranchWarning } from '../../lib/headPlacer';
import RoomCanvas from '../canvas/RoomCanvas';
import Badge from '../ui/Badge';
import Table from '../ui/Table';

interface RoomTabProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  placements: RoomPlacement[];
  setPlacements: React.Dispatch<React.SetStateAction<RoomPlacement[]>>;
  system: SystemType;
  zones?: WarehouseZone[];
  pipeResult: PipeCalcResult | null;
  worstHead: WorstHead | null;
  onWorstHeadChange: (w: WorstHead) => void;
}

const RISK_OPTIONS: { value: RiskLevel; label: string; desc: string }[] = [
  { value: 'light',     label: '경급',    desc: '사무실·호텔·아파트·병원' },
  { value: 'ordinary1', label: '중급 I',  desc: '주차장·일반공장·창고(적층 낮음)' },
  { value: 'ordinary2', label: '중급 II', desc: '목공소·도료창고·적층창고' },
  { value: 'extra',     label: '상급',    desc: '인화성액체·위험물저장소' },
];

const RISK_COLOR: Record<RiskLevel, 'green' | 'blue' | 'yellow' | 'red'> = {
  light:     'green',
  ordinary1: 'blue',
  ordinary2: 'yellow',
  extra:     'red',
};

export default function RoomTab({ rooms, setRooms, placements, setPlacements, system, zones, pipeResult, worstHead, onWorstHeadChange }: RoomTabProps) {
  const [nextId, setNextId] = useState(1);
  const [editRoom, setEditRoom] = useState<Room>({ id: 0, name: '', w: 10, d: 8, risk: 'ordinary2' });

  const addRoom = () => {
    const room: Room = { ...editRoom, id: nextId, name: editRoom.name || `실 ${nextId}` };
    const newRooms = [...rooms, room];
    setRooms(newRooms);
    setPlacements(newRooms.map(r => placeHeads(r, system)));
    setNextId(n => n + 1);
    setEditRoom(r => ({ ...r, name: '' }));
  };

  const removeRoom = (id: number) => {
    const newRooms = rooms.filter(r => r.id !== id);
    setRooms(newRooms);
    setPlacements(newRooms.map(r => placeHeads(r, system)));
  };

  const totalHeads = placements.reduce((s, p) => s + p.heads, 0);
  const totalArea  = rooms.reduce((s, r) => s + r.w * r.d, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 입력 폼 */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">실(Room) 추가</h2>

          <div className="space-y-3">
            <div>
              <label className="label-base">실 이름</label>
              <input
                type="text" placeholder="예: 창고 A동"
                className="input-base"
                value={editRoom.name}
                onChange={e => setEditRoom(r => ({ ...r, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-base">가로 W (m)</label>
                <input type="number" min={1} step={0.5} className="input-base"
                  value={editRoom.w}
                  onChange={e => setEditRoom(r => ({ ...r, w: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="label-base">세로 D (m)</label>
                <input type="number" min={1} step={0.5} className="input-base"
                  value={editRoom.d}
                  onChange={e => setEditRoom(r => ({ ...r, d: parseFloat(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div>
              <label className="label-base">
                위험등급 <span className="text-gray-500 font-normal text-xs">§ NFPC 103 별표2</span>
              </label>
              <select className="input-base"
                value={editRoom.risk}
                onChange={e => setEditRoom(r => ({ ...r, risk: e.target.value as RiskLevel }))}
              >
                {RISK_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {RISK_OPTIONS.find(o => o.value === editRoom.risk)?.desc}
              </p>
            </div>
          </div>

          <button onClick={addRoom}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            + 실 추가
          </button>

          {rooms.length > 0 && (
            <div className="mt-4 bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-1">
              <div className="text-xs font-semibold text-gray-300 mb-2">입력된 실 목록</div>
              {rooms.map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <div className="text-gray-300 flex items-center gap-2">
                    <Badge color={RISK_COLOR[r.risk]}>{r.risk}</Badge>
                    <span>{r.name}</span>
                    <span className="text-gray-500">{r.w}×{r.d}m</span>
                  </div>
                  <button onClick={() => removeRoom(r.id)}
                    className="text-red-400 hover:text-red-300 px-1"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 요약 + 캔버스 */}
        <div className="lg:col-span-2 space-y-4">
          {placements.length > 0 && (
            <div className="flex gap-4 flex-wrap">
              <Stat label="총 헤드" value={`${totalHeads}개`} />
              <Stat label="총 방호면적" value={`${Math.round(totalArea).toLocaleString()}㎡`} />
              <Stat label="실 수" value={`${rooms.length}개`} />
            </div>
          )}

          <RoomCanvas
            placements={placements}
            zones={zones}
            pipeResult={pipeResult}
            worstHead={worstHead}
            onWorstHeadChange={onWorstHeadChange}
          />

          {placements.length > 0 && (
            <Table
              headers={['실 이름', '가로×세로', '등급', '헤드(열×행)', '간격X', '간격Y', '방수량', '기준']}
              rows={placements.map(p => {
                const warn = getBranchWarning(p.hxCount);
                return [
                  p.room.name,
                  `${p.room.w}×${p.room.d}m`,
                  <Badge color={RISK_COLOR[p.room.risk]}>{p.room.risk}</Badge>,
                  `${p.hxCount}×${p.hyCount}=${p.heads}`,
                  `${p.actualSpacingX.toFixed(2)}m`,
                  `${p.actualSpacingY.toFixed(2)}m`,
                  `${p.roomFlow}LPM`,
                  warn
                    ? <span className="text-yellow-400 text-xs">{warn}</span>
                    : <span className="text-green-400 text-xs">✓ 충족</span>,
                ];
              })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
