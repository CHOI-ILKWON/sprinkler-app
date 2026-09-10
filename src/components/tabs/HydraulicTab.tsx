import { useEffect, useState } from 'react';
import type {
  PipeCalcResult,
  WaterSupplyResult,
  RoomPlacement,
  WorstHead,
  HydraulicResult,
  PipeSectionInput,
} from '../../types';
import { calcHydraulic, buildDefaultSections } from '../../lib/hydraulicCalc';
import { HAZEN_WILLIAMS_C, PIPE_SIZES_2533, FITTING_EQUIV_NOTE } from '../../constants/nfpc';
import CheckTable from '../ui/CheckTable';

interface Props {
  pipeResult: PipeCalcResult | null;
  waterSupply: WaterSupplyResult | null;
  placements: RoomPlacement[];
  worstHead: WorstHead | null;
  onResult: (r: HydraulicResult | null) => void;
}

export default function HydraulicTab({ pipeResult, waterSupply, placements, onResult }: Props) {
  const [C, setC] = useState<number>(HAZEN_WILLIAMS_C.steel);
  const [elevation, setElevation] = useState(20);
  const [sections, setSections] = useState<PipeSectionInput[]>([]);
  const [result, setResult] = useState<HydraulicResult | null>(null);

  useEffect(() => {
    if (!pipeResult || !waterSupply || placements.length === 0) return;
    const p = placements[0];
    setSections(
      buildDefaultSections(
        waterSupply.designFlowLPM,
        p.flowPerHead,
        p.branchPipe.size,
        p.crossPipe.size,
        pipeResult.mainPipe.size,
        p.headsPerBranchSide,
      ),
    );
  }, [pipeResult, waterSupply, placements]);

  const run = () => {
    const r = calcHydraulic({ C, elevation, sections });
    setResult(r);
    onResult(r);
  };

  const update = (i: number, patch: Partial<PipeSectionInput>) =>
    setSections(s => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const updateFitting = (i: number, key: keyof PipeSectionInput['fittings'], v: number) =>
    setSections(s => s.map((x, j) => (j === i ? { ...x, fittings: { ...x.fittings, [key]: v } } : x)));

  if (!pipeResult || !waterSupply) {
    return (
      <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-sm text-gray-500">
        「수원·펌프」와 「배관」 탭을 먼저 완료하십시오.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label-base">조도계수 C</label>
          <select className="input-base" value={C} onChange={e => setC(parseInt(e.target.value, 10))}>
            <option value={HAZEN_WILLIAMS_C.steel}>탄소강관 {HAZEN_WILLIAMS_C.steel}</option>
            <option value={HAZEN_WILLIAMS_C.stainless}>스테인리스/동관 {HAZEN_WILLIAMS_C.stainless}</option>
          </select>
        </div>
        <div>
          <label className="label-base">낙차 (m)</label>
          <input
            type="number"
            step={0.1}
            className="input-base"
            value={elevation}
            onChange={e => setElevation(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex items-end">
          <button onClick={run} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg">
            수리계산
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="w-full text-[11px]">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="text-left px-2 py-2">구간</th>
              <th className="text-left px-2 py-2">구경</th>
              <th className="text-left px-2 py-2">유량 L/min</th>
              <th className="text-left px-2 py-2">직관 m</th>
              <th className="px-2 py-2">90°</th>
              <th className="px-2 py-2">T(분류)</th>
              <th className="px-2 py-2">OS&amp;Y</th>
              <th className="px-2 py-2">알람</th>
              <th className="px-2 py-2">체크</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sections.map((s, i) => (
              <tr key={i}>
                <td className="px-2 py-1.5 text-gray-200 whitespace-nowrap">{s.name}</td>
                <td className="px-2 py-1.5">
                  <select
                    className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1"
                    value={parseInt(s.pipeSize, 10)}
                    onChange={e => update(i, { pipeSize: `${e.target.value}A` })}
                  >
                    {PIPE_SIZES_2533.map(mm => (
                      <option key={mm} value={mm}>{mm}A</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <NumIn v={s.flowLPM} on={v => update(i, { flowLPM: v })} w="w-20" />
                </td>
                <td className="px-2 py-1.5">
                  <NumIn v={s.straightLength} on={v => update(i, { straightLength: v })} w="w-16" step={0.5} />
                </td>
                {(['elbow90', 'teeDiv', 'osy', 'alarm', 'check'] as const).map(k => (
                  <td key={k} className="px-2 py-1.5">
                    <NumIn v={s.fittings[k]} on={v => updateFitting(i, k, v)} w="w-12" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">{FITTING_EQUIV_NOTE}</p>

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="배관 마찰손실" value={`${result.totalFrictionLoss.toFixed(3)} MPa`} />
            <Stat label="낙차손실" value={`${result.elevationLoss.toFixed(3)} MPa`} />
            <Stat label="말단 방수압" value={`${result.terminalPressure.toFixed(2)} MPa`} />
            <Stat
              label="필요 송수압력"
              value={`${result.requiredSupplyPressure.toFixed(3)} MPa`}
              warn={result.isOverPressure}
            />
          </div>

          {result.isOverPressure && (
            <div className="bg-yellow-950/30 border border-yellow-700 rounded-lg p-3 text-xs text-yellow-200 leading-relaxed">
              필요 송수압력이 1.2 MPa를 초과합니다. 감압밸브·오리피스 또는 계통 분리(고·저층 존)를 검토하십시오 —
              <span className="font-mono"> NFTC 103 2.2.1.10</span>
            </div>
          )}

          <div className="overflow-x-auto border border-gray-700 rounded-lg">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="text-left px-3 py-2">구간</th>
                  <th className="text-left px-3 py-2">내경</th>
                  <th className="text-left px-3 py-2">상당길이</th>
                  <th className="text-left px-3 py-2">총 길이</th>
                  <th className="text-left px-3 py-2">유속</th>
                  <th className="text-left px-3 py-2">손실</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {result.sections.map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 text-gray-200">{s.name}</td>
                    <td className="px-3 py-1.5 font-mono text-gray-400">{s.innerDiameter} ㎜</td>
                    <td className="px-3 py-1.5 font-mono text-gray-400">{s.equivalentLength.toFixed(1)} m</td>
                    <td className="px-3 py-1.5 font-mono text-gray-400">{s.totalLength.toFixed(1)} m</td>
                    <td className={'px-3 py-1.5 font-mono ' + (s.velocityOk ? 'text-gray-300' : 'text-red-400')}>
                      {s.velocity.toFixed(2)} / {s.velocityLimit} ㎧
                    </td>
                    <td className="px-3 py-1.5 font-mono text-gray-200">{s.pressureLoss.toFixed(4)} MPa</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CheckTable checks={result.checks} title="법령 적합성 검토" />
        </>
      )}
    </div>
  );
}

function NumIn({ v, on, w, step = 1 }: { v: number; on: (n: number) => void; w: string; step?: number }) {
  return (
    <input
      type="number"
      min={0}
      step={step}
      className={`bg-gray-900 border border-gray-700 rounded px-1.5 py-1 ${w}`}
      value={v}
      onChange={e => on(parseFloat(e.target.value) || 0)}
    />
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={'rounded-lg px-3 py-2 border ' + (warn ? 'bg-yellow-950/40 border-yellow-700' : 'bg-gray-800 border-gray-700')}>
      <div className="text-[11px] text-gray-400">{label}</div>
      <div className={'font-bold font-mono ' + (warn ? 'text-yellow-200' : 'text-white')}>{value}</div>
    </div>
  );
}
