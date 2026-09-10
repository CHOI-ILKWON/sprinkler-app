import { useState } from 'react';
import type {
  Room,
  RoomPlacement,
  SystemType,
  DesignCondition,
  ZoneCheck,
  PipeCalcResult,
  WorstHead,
  HazardClass,
} from '../../types';
import { getBranchWarning } from '../../lib/headPlacer';
import {
  HAZARD_LABEL,
  HORIZONTAL_DISTANCE_LAW,
  WAREHOUSE_HORIZONTAL_DISTANCE_LAW,
  HEAD_INSTALL,
  BEAM_TABLE,
  BEAM_TABLE_LAW,
  BRANCH_HEAD_LIMIT,
  SPECIAL_COMBUSTIBLES,
  SPECIAL_COMBUSTIBLES_LAW,
} from '../../constants/nfpc';
import { LawList } from '../ui/CheckTable';

interface Props {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  placements: RoomPlacement[];
  condition: DesignCondition;
  system: SystemType;
  zoneCheck: ZoneCheck | null;
  pipeResult: PipeCalcResult | null;
  worstHead: WorstHead | null;
  onWorstHeadChange: (w: WorstHead) => void;
}

export default function RoomTab({ rooms, setRooms, placements, condition, zoneCheck }: Props) {
  const [nextId, setNextId] = useState(1);
  const [draft, setDraft] = useState<Room>({ id: 0, name: '', w: 40, d: 30, hazard: 'general' });

  const addRoom = () => {
    setRooms(rs => [...rs, { ...draft, id: nextId, name: draft.name || `실 ${nextId}` }]);
    setNextId(n => n + 1);
    setDraft(d => ({ ...d, name: '' }));
  };
  const removeRoom = (id: number) => setRooms(rs => rs.filter(r => r.id !== id));

  const totalHeads = placements.reduce((s, p) => s + p.heads, 0);
  const totalArea = rooms.reduce((s, r) => s + r.w * r.d, 0);
  const branchLaw = BRANCH_HEAD_LIMIT[condition.standard];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">실(Room) 추가</h2>

          <div>
            <label className="label-base">실 이름</label>
            <input
              type="text"
              placeholder="예: 창고 A동"
              className="input-base"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-base">가로 W (m)</label>
              <input
                type="number"
                min={1}
                step={0.5}
                className="input-base"
                value={draft.w}
                onChange={e => setDraft(d => ({ ...d, w: parseFloat(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="label-base">세로 D (m)</label>
              <input
                type="number"
                min={1}
                step={0.5}
                className="input-base"
                value={draft.d}
                onChange={e => setDraft(d => ({ ...d, d: parseFloat(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div>
            <label className="label-base">
              수평거리 구분{' '}
              <span className="text-gray-500 font-normal text-[11px]">
                {condition.standard === 'nftc103' ? HORIZONTAL_DISTANCE_LAW : WAREHOUSE_HORIZONTAL_DISTANCE_LAW}
              </span>
            </label>
            <select
              className="input-base"
              value={draft.hazard}
              onChange={e => setDraft(d => ({ ...d, hazard: e.target.value as HazardClass }))}
            >
              <option value="general">
                {HAZARD_LABEL.general} — R = {condition.fireproof ? '2.3' : '2.1'} m
              </option>
              <option value="special">{HAZARD_LABEL.special} — R = 1.7 m</option>
            </select>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              2024.1.1 개정으로 랙식 창고 2.5 m(2.7.3.2)와 아파트 3.2 m(2.7.3.3)는 삭제되었습니다.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!draft.ceilingVoidHeads}
              onChange={e => setDraft(d => ({ ...d, ceilingVoidHeads: e.target.checked }))}
              className="mt-0.5 accent-blue-500"
            />
            <span>
              <span className="text-xs text-gray-200">반자 아래·반자 속 헤드를 동일 가지관에 병설</span>
              <span className="block text-[11px] text-gray-500 font-mono">표 2.5.3.3 [비고] 3 — "나"란 적용</span>
            </span>
          </label>

          <button
            onClick={addRoom}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            + 실 추가
          </button>

          {rooms.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-1">
              <div className="text-xs font-semibold text-gray-300 mb-2">입력된 실</div>
              {rooms.map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    {r.name} <span className="text-gray-500">{r.w}×{r.d}m</span>
                    {r.hazard === 'special' && <span className="text-yellow-400 ml-1">특수</span>}
                  </span>
                  <button onClick={() => removeRoom(r.id)} className="text-red-400 hover:text-red-300 px-1">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <details className="border border-gray-700 rounded-lg">
            <summary className="px-3 py-2 text-[11px] font-semibold text-gray-300 cursor-pointer">
              특수가연물 품명·수량 — {SPECIAL_COMBUSTIBLES_LAW}
            </summary>
            <table className="w-full text-[11px] border-t border-gray-700">
              <tbody className="divide-y divide-gray-800">
                {SPECIAL_COMBUSTIBLES.map(s => (
                  <tr key={s.name}>
                    <td className="px-3 py-1 text-gray-300">{s.name}</td>
                    <td className="px-3 py-1 text-gray-400 font-mono text-right">{s.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {placements.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              <Stat label="총 헤드" value={`${totalHeads}개`} />
              <Stat label="총 방호면적" value={`${Math.round(totalArea).toLocaleString()}㎡`} />
              <Stat label="유수검지장치" value={`${zoneCheck?.valveCount ?? 0}개`} />
              <Stat label="가지배관 상한" value={`한쪽 ${branchLaw.max}개`} />
            </div>
          )}

          {placements.map(p => (
            <RoomPreview key={p.room.id} p={p} standard={condition.standard} />
          ))}

          {zoneCheck && zoneCheck.warnings.length > 0 && (
            <div className="bg-yellow-950/30 border border-yellow-700 rounded-lg p-3 space-y-1">
              <div className="text-xs font-semibold text-yellow-300">검토 의견</div>
              {zoneCheck.warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-yellow-200 leading-relaxed">· {w}</p>
              ))}
            </div>
          )}

          {zoneCheck && <LawList laws={zoneCheck.laws} title="적용 법령 — 방호구역·배치" />}

          <details className="border border-gray-700 rounded-lg">
            <summary className="px-3 py-2 text-xs font-semibold text-gray-300 cursor-pointer">
              헤드 설치 세부기준 (NFTC 103 2.7.7 / 표 2.7.8)
            </summary>
            <div className="p-3 space-y-2 border-t border-gray-700 text-[11px] text-gray-400 leading-relaxed">
              <p>· 살수 공간: 헤드로부터 반경 {HEAD_INSTALL.clearanceRadius * 100} ㎝ 이상 (벽과는 {HEAD_INSTALL.wallClearance * 100} ㎝ 이상) — 2.7.7.1</p>
              <p>· 반사판과 부착면의 거리: {HEAD_INSTALL.deflectorToCeiling * 100} ㎝ 이하 — 2.7.7.2</p>
              <p>· 배관·행거·조명기구 등 장애물: 그 아래에 설치. 다만 이격거리를 장애물 폭의 {HEAD_INSTALL.obstructionWidthFactor}배 이상 확보 시 예외 — 2.7.7.3</p>
              <p>· 측벽형 헤드: 긴 변의 한쪽 벽에 일렬로 {HEAD_INSTALL.sidewallSpacing} m 이내마다 — 2.7.7.8</p>
              <table className="w-full mt-2">
                <thead className="text-gray-300">
                  <tr>
                    <th className="text-left py-1">헤드 반사판 중심과 보의 수평거리</th>
                    <th className="text-left py-1">반사판 높이와 보 하단의 수직거리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {BEAM_TABLE.map((b, i) => (
                    <tr key={i}>
                      <td className="py-1">
                        {i === 0
                          ? `${b.under} m 미만`
                          : b.under === Infinity
                            ? `${BEAM_TABLE[i - 1].under} m 이상`
                            : `${BEAM_TABLE[i - 1].under} m 이상 ${b.under} m 미만`}
                      </td>
                      <td className="py-1 text-gray-300">{b.requirement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-blue-300 font-mono">{BEAM_TABLE_LAW}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function RoomPreview({ p, standard }: { p: RoomPlacement; standard: DesignCondition['standard'] }) {
  const warn = getBranchWarning(p, standard);
  const scale = Math.min(560 / p.room.w, 260 / p.room.d);
  const W = p.room.w * scale;
  const H = p.room.d * scale;

  const heads: { x: number; y: number }[] = [];
  for (let i = 0; i < p.hxCount; i++) {
    for (let j = 0; j < p.hyCount; j++) {
      heads.push({
        x: (p.actualSpacingX / 2 + i * p.actualSpacingX) * scale,
        y: (p.actualSpacingY / 2 + j * p.actualSpacingY) * scale,
      });
    }
  }
  const rowsPerCross = Math.ceil(p.hyCount / p.crossMainCount);
  const crossYs = Array.from({ length: p.crossMainCount }, (_, k) => {
    const centerRow = Math.min(p.hyCount - 1, k * rowsPerCross + Math.floor(rowsPerCross / 2));
    return (p.actualSpacingY / 2 + centerRow * p.actualSpacingY) * scale;
  });

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-900 p-3 space-y-2">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold text-white">{p.room.name}</span>
        <span className="text-[11px] text-gray-400 font-mono">
          R={p.horizontalDistance} m · S≤{p.maxSpacing.toFixed(2)} m · {p.hxCount}×{p.hyCount}={p.heads}개 · "{p.pipeColumn}"란
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg width={W + 20} height={H + 20} className="block">
          <rect x={10} y={10} width={W} height={H} fill="#0f172a" stroke="#475569" />
          {crossYs.map((y, i) => (
            <line key={i} x1={10} y1={10 + y} x2={10 + W} y2={10 + y} stroke="#dc2626" strokeWidth={2.5} opacity={0.8} />
          ))}
          {heads.map((h, i) => (
            <circle key={i} cx={10 + h.x} cy={10 + h.y} r={2.5} fill="#f87171" />
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <Cell k="간격 X" v={`${p.actualSpacingX.toFixed(2)} m`} ok={p.spacingOk} />
        <Cell k="간격 Y" v={`${p.actualSpacingY.toFixed(2)} m`} ok={p.spacingOk} />
        <Cell k="벽~첫 헤드" v={`${p.wallDistX.toFixed(2)} / ${p.wallDistY.toFixed(2)} m`} ok={p.wallDistOk} />
        <Cell k="한쪽 가지배관" v={`${p.headsPerBranchSide}개 / ${p.branchLimit}개`} ok={p.branchOk} />
        <Cell k="교차배관" v={`${p.crossMainCount}개 · ${p.crossPipe.size}`} ok />
        <Cell k="가지배관" v={p.branchPipe.size} ok />
        <Cell k="방수량/개" v={`${p.flowPerHead} L/min`} ok />
        <Cell k="실 합산유량" v={`${p.roomFlow.toLocaleString()} L/min`} ok />
      </div>

      {warn && <p className="text-[11px] text-yellow-300 leading-relaxed">⚠ {warn}</p>}
    </div>
  );
}

function Cell({ k, v, ok }: { k: string; v: string; ok: boolean }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1">
      <div className="text-gray-500">{k}</div>
      <div className={'font-mono ' + (ok ? 'text-gray-100' : 'text-red-400')}>{v}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-white font-mono">{value}</div>
    </div>
  );
}
