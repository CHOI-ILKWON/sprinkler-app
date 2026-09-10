import { useState } from 'react';
import type {
  Room,
  RoomPlacement,
  DesignCondition,
  SystemType,
  WaterSupplyResult,
  ZoneCheck,
  PipeCalcResult,
} from '../../types';
import { calcPipes } from '../../lib/pipeCalc';
import {
  PIPE_SIZES_2533,
  PIPE_TABLE_2533,
  PIPE_TABLE_LAW,
  PIPE_TABLE_NOTES,
  MIN_PIPE_SIZE,
  VELOCITY_LIMIT,
  PIPE_SLOPE,
  HANGER,
  TOURNAMENT_BAN_LAW,
  BRANCH_LIMIT_EXCEPTIONS,
  PIPE_MATERIAL,
} from '../../constants/nfpc';
import CheckTable from '../ui/CheckTable';

interface Props {
  rooms: Room[];
  placements: RoomPlacement[];
  condition: DesignCondition;
  system: SystemType;
  waterSupply: WaterSupplyResult | null;
  zoneCheck: ZoneCheck | null;
  result: PipeCalcResult | null;
  setResult: (r: PipeCalcResult) => void;
}

export default function PipeTab({
  rooms,
  placements,
  condition,
  system,
  waterSupply,
  zoneCheck,
  result,
  setResult,
}: Props) {
  const [velocity, setVelocity] = useState(6);
  const [standpipe, setStandpipe] = useState(false);

  const canRun = rooms.length > 0 && !!waterSupply;

  const run = () => {
    if (!waterSupply) return;
    setResult(
      calcPipes({
        rooms,
        placements,
        system,
        standard: condition.standard,
        designFlowLPM: waterSupply.designFlowLPM,
        velocity,
        zones: zoneCheck?.zones,
        combinedWithStandpipe: standpipe,
      }),
    );
  };

  return (
    <div className="space-y-6">
      {!waterSupply && (
        <div className="bg-yellow-950/30 border border-yellow-700 rounded-lg p-3 text-xs text-yellow-200">
          「수원·펌프」 탭에서 먼저 설계유량을 산정하십시오. 배관 구경은 설계유량(기준개수 × 방수량)을 기준으로 정합니다.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">배관 산정</h2>

          <div>
            <label className="label-base">주배관 설계유속 (㎧)</label>
            <input
              type="number"
              min={1}
              max={VELOCITY_LIMIT.other}
              step={0.5}
              className="input-base"
              value={velocity}
              onChange={e => setVelocity(parseFloat(e.target.value) || 6)}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {VELOCITY_LIMIT.law} — 가지배관 {VELOCITY_LIMIT.branch} ㎧, 그 밖의 배관 {VELOCITY_LIMIT.other} ㎧ 초과 불가
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={standpipe} onChange={e => setStandpipe(e.target.checked)} className="mt-0.5 accent-blue-500" />
            <span>
              <span className="text-xs text-gray-200">연결송수관설비 배관과 겸용</span>
              <span className="block text-[11px] text-gray-500 font-mono">
                {MIN_PIPE_SIZE.hoseConnectionMain.law} — 주배관 100 ㎜ 이상
              </span>
            </span>
          </label>

          <button
            onClick={run}
            disabled={!canRun}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-2.5 rounded-lg"
          >
            배관 산정
          </button>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-[11px] text-gray-400 space-y-1.5 leading-relaxed">
            <div className="text-gray-300 font-semibold text-xs">최소 구경</div>
            <p>· 교차배관 {MIN_PIPE_SIZE.crossMain.mm} ㎜ 이상 — {MIN_PIPE_SIZE.crossMain.law}</p>
            <p>· 청소구 {MIN_PIPE_SIZE.flushingConnection.mm} ㎜ 이상 개폐밸브 — {MIN_PIPE_SIZE.flushingConnection.law}</p>
            <p>· 수직배수배관 {MIN_PIPE_SIZE.drainRiser.mm} ㎜ 이상 — {MIN_PIPE_SIZE.drainRiser.law}</p>
            <p>· 시험장치 {MIN_PIPE_SIZE.testConnection.mm} ㎜ 이상 — {MIN_PIPE_SIZE.testConnection.law}</p>
            <p>· 순환배관 {MIN_PIPE_SIZE.circulation.mm} ㎜ 이상 — {MIN_PIPE_SIZE.circulation.law}</p>
            <div className="text-gray-300 font-semibold text-xs pt-1">배관 기울기 — {PIPE_SLOPE.law}</div>
            <p>· 습식·부압식: 수평 (소화수가 남는 곳에는 배수밸브)</p>
            <p>· 그 외: 수평주행배관 1/{1 / PIPE_SLOPE.feedMain}, 가지배관 1/{1 / PIPE_SLOPE.branch} 이상</p>
            <div className="text-gray-300 font-semibold text-xs pt-1">행거 — {HANGER.law}</div>
            <p>· 가지배관 헤드 사이마다, 헤드 간 {HANGER.branchMaxSpacing} m 초과 시 {HANGER.branchMaxSpacing} m 이내마다</p>
            <p>· 교차배관·수평주행배관 {HANGER.crossMainMaxSpacing} m 이내마다</p>
            <p>· 상향식헤드와 행거 사이 {HANGER.upwardHeadClearance * 100} ㎝ 이상</p>
            <p className="pt-1">· {TOURNAMENT_BAN_LAW}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="설계유량" value={`${result.designFlow.toLocaleString()} L/min`} highlight />
                <Stat label="주배관·입상관" value={result.mainPipe.size} highlight />
                <Stat label="총 헤드" value={`${result.totalHeads}개`} />
                <Stat label="전체 합산유량" value={`${result.totalFlow.toLocaleString()} L/min`} />
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                「전체 합산유량」은 표 2.5.3.3 적용을 위한 참고값이며, 펌프·수원 산정의 근거는 <b>설계유량(기준개수 × 방수량)</b>입니다.
              </p>

              {result.zones && result.zones.length > 0 && (
                <div className="overflow-x-auto border border-gray-700 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left px-3 py-2">방호구역</th>
                        <th className="text-left px-3 py-2">면적</th>
                        <th className="text-left px-3 py-2">헤드</th>
                        <th className="text-left px-3 py-2">유수검지장치</th>
                        <th className="text-left px-3 py-2">교차배관</th>
                        <th className="text-left px-3 py-2">주배관</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {result.zones.map(z => (
                        <tr key={z.zoneId}>
                          <td className="px-3 py-2 text-gray-200">#{z.zoneId} <span className="text-gray-500">{z.rooms.join(', ')}</span></td>
                          <td className="px-3 py-2 font-mono text-gray-300">{z.area.toFixed(0)} ㎡</td>
                          <td className="px-3 py-2 font-mono text-gray-300">{z.headCount}개</td>
                          <td className="px-3 py-2 font-mono text-gray-300">{z.valveSize}</td>
                          <td className="px-3 py-2 font-mono text-gray-300">{z.crossMainPipe}</td>
                          <td className="px-3 py-2 font-mono text-gray-300">{z.mainPipe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <CheckTable checks={result.checks} title="법령 적합성 검토" />
            </>
          ) : (
            <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-sm text-gray-500">
              실을 입력하고 수원을 산정한 뒤 「배관 산정」을 누르십시오.
            </div>
          )}

          <details className="border border-gray-700 rounded-lg" open>
            <summary className="px-3 py-2 text-xs font-semibold text-gray-300 cursor-pointer">
              {PIPE_TABLE_LAW} 스프링클러헤드 수별 급수관의 구경 (단위: ㎜)
            </summary>
            <div className="overflow-x-auto border-t border-gray-700">
              <table className="w-full text-[11px] text-center">
                <thead className="bg-gray-800/60 text-gray-300">
                  <tr>
                    <th className="px-2 py-1.5 text-left">구분</th>
                    {PIPE_SIZES_2533.map(s => (
                      <th key={s} className="px-2 py-1.5 font-mono">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(['가', '나', '다'] as const).map(col => (
                    <tr key={col}>
                      <td className="px-2 py-1.5 text-left text-gray-200 font-semibold">{col}</td>
                      {PIPE_TABLE_2533[col].map((v, i) => (
                        <td key={i} className="px-2 py-1.5 font-mono text-gray-300">
                          {v === Infinity ? (col === '다' ? '91 이상' : '161 이상') : v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="p-3 space-y-1 border-t border-gray-800">
              {PIPE_TABLE_NOTES.map((n, i) => (
                <li key={i} className="text-[11px] text-gray-400 leading-relaxed">{n}</li>
              ))}
            </ul>
          </details>

          <details className="border border-gray-700 rounded-lg">
            <summary className="px-3 py-2 text-xs font-semibold text-gray-300 cursor-pointer">
              가지배관 헤드 개수 예외 · 배관 재질
            </summary>
            <div className="p-3 border-t border-gray-700 space-y-2 text-[11px] text-gray-400 leading-relaxed">
              <div className="text-gray-300 font-semibold">2.5.9.2 단서 — 8개 제한의 예외</div>
              {BRANCH_LIMIT_EXCEPTIONS.map((e, i) => (
                <p key={i}>· {e}</p>
              ))}
              <div className="text-gray-300 font-semibold pt-1">{PIPE_MATERIAL.law} — 배관 재질</div>
              <p className="text-gray-300">사용압력 1.2 MPa 미만</p>
              {PIPE_MATERIAL.under12MPa.map((m, i) => (
                <p key={i}>· {m}</p>
              ))}
              <p className="text-gray-300">사용압력 1.2 MPa 이상</p>
              {PIPE_MATERIAL.over12MPa.map((m, i) => (
                <p key={i}>· {m}</p>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={'rounded-lg px-3 py-2 border ' + (highlight ? 'bg-blue-950/40 border-blue-700' : 'bg-gray-800 border-gray-700')}>
      <div className="text-[11px] text-gray-400">{label}</div>
      <div className={'font-bold font-mono ' + (highlight ? 'text-blue-200' : 'text-white')}>{value}</div>
    </div>
  );
}
