import { useMemo, useState } from 'react';
import type { SystemType } from '../../types';
import {
  planDelugeZones,
  suggestZoneCount,
  calcDelugeHydraulic,
  type DelugeHydraulicResult,
} from '../../lib/deluge';
import {
  HEAD_PRESSURE,
  VELOCITY_LIMIT,
  PIPE_SIZES_2533,
  HAZEN_WILLIAMS_NOTE,
  WATER_SUPPLY_MINUTES,
  HAZEN_WILLIAMS_C,
} from '../../constants/nfpc';

interface Props {
  system: SystemType;
}

export default function DelugeTab({ system }: Props) {
  const [totalHeads, setTotalHeads] = useState(60);
  const [zoneCount, setZoneCount] = useState(2);

  const [headsPerBranch, setHeadsPerBranch] = useState(6);
  const [branchCount, setBranchCount] = useState(5);
  const [headSpacing, setHeadSpacing] = useState(2.4);
  const [branchSpacing, setBranchSpacing] = useState(2.4);
  const [branchPipeMM, setBranchPipeMM] = useState(40);
  const [crossPipeMM, setCrossPipeMM] = useState(80);
  const [K, setK] = useState(80);
  const [C, setC] = useState<number>(HAZEN_WILLIAMS_C.steel);
  const [result, setResult] = useState<DelugeHydraulicResult | null>(null);

  const plan = useMemo(() => planDelugeZones(totalHeads, zoneCount), [totalHeads, zoneCount]);
  const suggestion = useMemo(() => suggestZoneCount(totalHeads), [totalHeads]);

  const run = () =>
    setResult(
      calcDelugeHydraulic({
        headsPerBranch,
        branchCount,
        headSpacing,
        branchSpacing,
        branchPipeMM,
        crossPipeMM,
        K,
        C,
        terminalPressure: HEAD_PRESSURE.min,
      }),
    );

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
        <h2 className="text-base font-bold text-white">개방형(일제살수식) 방수구역</h2>
        <p className="text-xs text-gray-300 leading-relaxed">
          개방형은 감열체가 없어 <b>밸브가 열리면 그 방수구역의 헤드 전부가 동시에</b> 터집니다. 그래서 기준개수라는
          가정이 없고 <b>설치헤드수를 그대로</b> 씁니다. 단위는 <b>층이 아니라 방수구역(zone)</b>이며, 방수구역마다
          일제개방밸브가 하나씩 붙습니다.
        </p>
        <div className="text-[11px] text-gray-400 font-mono space-y-0.5 pt-1">
          <p>· NFTC 103 2.1.1.2 — 최대 방수구역 30개 이하 → 설치헤드수 × 1.6 ㎥ / 초과 → 수리계산</p>
          <p>· NFTC 103 2.2.1.13 — 송수량도 동일하게 30개 경계</p>
          <p>· NFTC 103 표 2.5.3.3 [비고] 5 — 배관구경도 동일하게 30개 경계</p>
          <p>· NFTC 103 2.4.1.1 — 하나의 방수구역은 2개 층에 미치지 않을 것</p>
          <p>· NFTC 103 2.4.1.3 — 하나의 방수구역 50개 이하 / 2구역 이상 분할 시 각 25개 이상</p>
        </div>
        {system !== 'deluge' && (
          <p className="text-[11px] text-gray-500">
            현재 선택된 방식은 일제살수식이 아닙니다. 이 탭은 개방형 헤드를 쓰는 경우에만 적용됩니다.
          </p>
        )}
      </div>

      {/* ── 1. 방수구역 분할 계획 ───────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">1. 방수구역 분할 계획</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Num label="방수구역 전체 헤드 수" value={totalHeads} onChange={setTotalHeads} />
          <Num label="방수구역 수" value={zoneCount} onChange={setZoneCount} min={1} />
          <div className="flex items-end">
            <button
              onClick={() => suggestion.zoneCount && setZoneCount(suggestion.zoneCount)}
              disabled={!suggestion.zoneCount}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-semibold py-2.5 rounded-lg"
            >
              권장 구역 수 적용{suggestion.zoneCount ? ` (${suggestion.zoneCount}개)` : ''}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed bg-gray-900 border border-gray-700 rounded p-2">
          {suggestion.note}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="구역별 헤드" value={plan.headsPerZone.join(' / ')} />
          <Stat label="최대 방수구역" value={`${plan.maxZoneHeads}개`} highlight />
          <Stat
            label="수원 (간이식)"
            value={plan.simpleMethodOk ? `${(plan.maxZoneHeads * 1.6).toFixed(1)} ㎥` : '수리계산'}
            highlight={plan.simpleMethodOk}
            warn={!plan.simpleMethodOk}
          />
          <Stat label="일제개방밸브" value={`${plan.zoneCount}세트`} />
        </div>

        <div className="space-y-1.5">
          {plan.messages.map((m, i) => (
            <div
              key={i}
              className={
                'text-[11px] leading-relaxed rounded p-2 border ' +
                (m.level === 'error'
                  ? 'bg-red-950/40 border-red-700 text-red-200'
                  : m.level === 'warn'
                    ? 'bg-yellow-950/30 border-yellow-700 text-yellow-200'
                    : 'bg-green-950/30 border-green-700 text-green-200')
              }
            >
              {m.level === 'error' ? '✗ ' : m.level === 'warn' ? '△ ' : '✓ '}
              {m.text}
              <span className="block text-gray-500 font-mono mt-0.5">{m.law}</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto border border-gray-700 rounded-lg">
          <table className="w-full text-[11px]">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="text-left px-3 py-2">최대 방수구역 헤드 수</th>
                <th className="text-left px-3 py-2">수원·송수량·배관구경</th>
                <th className="text-left px-3 py-2">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className={plan.maxZoneHeads <= 30 ? 'bg-green-950/20' : ''}>
                <td className="px-3 py-2 text-gray-200 font-mono">~ 30개</td>
                <td className="px-3 py-2 text-gray-300">설치헤드수 × 1.6 ㎥ / × 80 L / 표 2.5.3.3 "다"란</td>
                <td className="px-3 py-2 text-gray-500">간이식 가능</td>
              </tr>
              <tr className={plan.maxZoneHeads > 30 && plan.maxZoneHeads <= 50 ? 'bg-yellow-950/20' : ''}>
                <td className="px-3 py-2 text-gray-200 font-mono">31 ~ 50개</td>
                <td className="px-3 py-2 text-gray-300">전부 수리계산</td>
                <td className="px-3 py-2 text-gray-500">방수구역 자체는 적법</td>
              </tr>
              <tr className={plan.maxZoneHeads > 50 ? 'bg-red-950/20' : ''}>
                <td className="px-3 py-2 text-gray-200 font-mono">50개 초과</td>
                <td className="px-3 py-2 text-gray-300">—</td>
                <td className="px-3 py-2 text-gray-500">방수구역 분할 의무 (각 25개 이상)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 2. 수리계산 ─────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">
          2. 수리계산 — 말단 헤드부터 밸브까지 한 개씩
        </h3>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          말단 헤드에 {HEAD_PRESSURE.min} MPa를 주고, 배관 손실만큼 압력이 올라간 다음 헤드의 유량을{' '}
          <code className="text-blue-300">Q = K√(10P)</code> 로 다시 구하는 과정을 반복합니다. 말단이{' '}
          {HEAD_PRESSURE.min} MPa면 <b>나머지 헤드는 전부 그보다 많이 나오므로</b>, 실제 총유량은 항상 간이식(N × 80)보다
          큽니다.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Num label="한 가지배관 헤드 수" value={headsPerBranch} onChange={setHeadsPerBranch} min={1} />
          <Num label="가지배관 수" value={branchCount} onChange={setBranchCount} min={1} />
          <Num label="헤드 간격 (m)" value={headSpacing} onChange={setHeadSpacing} step={0.1} />
          <Num label="가지배관 간격 (m)" value={branchSpacing} onChange={setBranchSpacing} step={0.1} />
          <Sel label="가지배관 구경" value={branchPipeMM} onChange={setBranchPipeMM} />
          <Sel label="교차배관 구경" value={crossPipeMM} onChange={setCrossPipeMM} />
          <Num label="헤드 방수상수 K" value={K} onChange={setK} />
          <div>
            <label className="label-base">조도계수 C</label>
            <select className="input-base" value={C} onChange={e => setC(parseInt(e.target.value, 10))}>
              <option value={HAZEN_WILLIAMS_C.steel}>탄소강관 {HAZEN_WILLIAMS_C.steel}</option>
              <option value={HAZEN_WILLIAMS_C.stainless}>스테인리스 {HAZEN_WILLIAMS_C.stainless}</option>
            </select>
          </div>
        </div>

        <button onClick={run} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg">
          수리계산 실행 ({headsPerBranch * branchCount}개 헤드)
        </button>

        {result && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="간이식 (N × K)" value={`${result.simpleFlow.toFixed(0)} L/min`} />
              <Stat label="수리계산 총유량" value={`${result.totalFlow.toFixed(0)} L/min`} highlight />
              <Stat
                label="차이"
                value={`+${result.differencePct.toFixed(1)} %`}
                warn={result.differencePct > 5}
              />
              <Stat
                label="밸브 필요압력"
                value={`${result.valvePressure.toFixed(3)} MPa`}
                warn={result.overPressure}
              />
              <Stat label="수원 (간이식)" value={`${result.simpleWaterVolume.toFixed(1)} ㎥`} />
              <Stat label="수원 (수리계산)" value={`${result.waterVolume.toFixed(1)} ㎥`} highlight />
              <Stat
                label="가지배관 최대유속"
                value={`${result.maxBranchVelocity.toFixed(2)} ㎧`}
                warn={result.maxBranchVelocity > VELOCITY_LIMIT.branch}
              />
              <Stat
                label="교차배관 최대유속"
                value={`${result.maxCrossVelocity.toFixed(2)} ㎧`}
                warn={result.maxCrossVelocity > VELOCITY_LIMIT.other}
              />
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              수원 = 총유량 × {WATER_SUPPLY_MINUTES}분 (NFTC 103 2.1.1 단서). 유속 한도는 가지배관{' '}
              {VELOCITY_LIMIT.branch} ㎧ / 그 밖의 배관 {VELOCITY_LIMIT.other} ㎧ ({VELOCITY_LIMIT.law}).
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-300 mb-1">최원거리 가지배관 — 헤드별</h4>
                <div className="overflow-x-auto border border-gray-700 rounded-lg">
                  <table className="w-full text-[11px]">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left px-2 py-1.5">헤드</th>
                        <th className="text-left px-2 py-1.5">압력 MPa</th>
                        <th className="text-left px-2 py-1.5">방수량 L/min</th>
                        <th className="text-left px-2 py-1.5">누적 L/min</th>
                        <th className="text-left px-2 py-1.5">다음까지 손실</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {result.heads.map(h => (
                        <tr key={h.no}>
                          <td className="px-2 py-1 text-gray-200">{h.no === 1 ? '① 말단' : `${h.no}`}</td>
                          <td className="px-2 py-1 font-mono text-gray-300">{h.pressure.toFixed(4)}</td>
                          <td className="px-2 py-1 font-mono text-gray-100">{h.flow.toFixed(1)}</td>
                          <td className="px-2 py-1 font-mono text-gray-400">{h.cumulative.toFixed(1)}</td>
                          <td className="px-2 py-1 font-mono text-gray-500">
                            {h.lossToNext ? h.lossToNext.toFixed(4) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  가지배관 유량 {result.branchFlow.toFixed(1)} L/min · 기점 압력{' '}
                  {result.branchInletPressure.toFixed(4)} MPa · 환산 K<sub>b</sub> = {result.branchK.toFixed(1)}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-300 mb-1">교차배관 — 가지배관별</h4>
                <div className="overflow-x-auto border border-gray-700 rounded-lg">
                  <table className="w-full text-[11px]">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left px-2 py-1.5">가지배관</th>
                        <th className="text-left px-2 py-1.5">기점압력 MPa</th>
                        <th className="text-left px-2 py-1.5">유량 L/min</th>
                        <th className="text-left px-2 py-1.5">누적 L/min</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {result.branches.map(b => (
                        <tr key={b.no}>
                          <td className="px-2 py-1 text-gray-200">{b.no === 1 ? '① 최원거리' : `${b.no}`}</td>
                          <td className="px-2 py-1 font-mono text-gray-300">{b.inletPressure.toFixed(4)}</td>
                          <td className="px-2 py-1 font-mono text-gray-100">{b.flow.toFixed(1)}</td>
                          <td className="px-2 py-1 font-mono text-gray-400">{b.cumulative.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  환산 K<sub>b</sub> 로 각 가지배관의 유량을 구합니다 — 밸브에 가까울수록 압력이 높아 유량이 큽니다.
                </p>
              </div>
            </div>

            {result.overPressure && (
              <div className="bg-yellow-950/30 border border-yellow-700 rounded-lg p-3 text-[11px] text-yellow-200 leading-relaxed">
                일제개방밸브 지점 필요압력이 {HEAD_PRESSURE.max} MPa를 초과합니다. 배관 구경을 키우거나 방수구역을
                나누십시오 — <span className="font-mono">NFTC 103 2.2.1.10</span>
              </div>
            )}

            <p className="text-[11px] text-gray-500 leading-relaxed">{HAZEN_WILLIAMS_NOTE}</p>
          </>
        )}
      </section>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div>
      <label className="label-base">{label}</label>
      <input
        type="number"
        min={min}
        step={step}
        className="input-base"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || min)}
      />
    </div>
  );
}

function Sel({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label-base">{label}</label>
      <select className="input-base" value={value} onChange={e => onChange(parseInt(e.target.value, 10))}>
        {PIPE_SIZES_2533.map(mm => (
          <option key={mm} value={mm}>
            {mm}A
          </option>
        ))}
      </select>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={
        'rounded-lg px-3 py-2 border ' +
        (warn
          ? 'bg-yellow-950/40 border-yellow-700'
          : highlight
            ? 'bg-blue-950/40 border-blue-700'
            : 'bg-gray-800 border-gray-700')
      }
    >
      <div className="text-[11px] text-gray-400">{label}</div>
      <div
        className={
          'font-bold font-mono text-sm ' +
          (warn ? 'text-yellow-200' : highlight ? 'text-blue-200' : 'text-white')
        }
      >
        {value}
      </div>
    </div>
  );
}
