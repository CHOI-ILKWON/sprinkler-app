import { useState, useEffect } from 'react';
import type { PipeCalcResult, SystemResult, Room, HydraulicResult, PipeSectionInput, WorstHead } from '../../types';
import { calcHydraulic, buildDefaultSections } from '../../lib/hydraulicCalc';
import { SIMULTANEOUS_HEADS, SIMULTANEOUS_HEADS_LAW, HAZEN_WILLIAMS_C, HEAD_PRESSURE, RISK_TABLE } from '../../constants/nfpc';

interface HydraulicTabProps {
  pipeResult: PipeCalcResult | null;
  systemResult: SystemResult | null;
  rooms: Room[];
  worstHead: WorstHead | null;
  onResult: (result: HydraulicResult) => void;
}

function estimateFromWorstHead(w: WorstHead) {
  const headSpacingX = w.roomW / w.hxCount;
  const headSpacingY = w.roomD / w.hyCount;
  return {
    headBranch: parseFloat(headSpacingX.toFixed(1)),
    branch: parseFloat((headSpacingX * Math.max(w.hxInGroup, 1)).toFixed(1)),
    cross: parseFloat((headSpacingY * Math.max(w.hyIndex, 1)).toFixed(1)),
  };
}

function buildSectionsFromWorstHead(w: WorstHead, pipeResult: PipeCalcResult | null): PipeSectionInput[] {
  const est = estimateFromWorstHead(w);
  const riserSize = pipeResult?.riserPipe.size ?? w.riserPipeSize;
  const branchFlow = Math.min(w.hxInGroup + 1, 8) * w.flowPerHead;
  return [
    { name: '헤드 배관', pipeSize: '25A', flowLPM: w.flowPerHead,
      straightLength: est.headBranch, fittings: { elbow90: 2, teeDiv: 0, osy: 0, alarm: 0, check: 0 } },
    { name: '가지관', pipeSize: w.branchPipeSize, flowLPM: branchFlow,
      straightLength: est.branch, fittings: { elbow90: 2, teeDiv: 2, osy: 0, alarm: 0, check: 0 } },
    { name: '교차관', pipeSize: w.crossPipeSize, flowLPM: w.designFlow,
      straightLength: est.cross, fittings: { elbow90: 2, teeDiv: 1, osy: 0, alarm: 0, check: 0 } },
    { name: '주배관', pipeSize: riserSize, flowLPM: w.designFlow,
      straightLength: 15.0, fittings: { elbow90: 1, teeDiv: 1, osy: 1, alarm: 1, check: 1 } },
    { name: '입상관', pipeSize: riserSize, flowLPM: w.designFlow,
      straightLength: 10.0, fittings: { elbow90: 1, teeDiv: 0, osy: 1, alarm: 0, check: 0 } },
  ];
}

type PipeMaterial = 'steel' | 'copper' | 'stainless';

export default function HydraulicTab({ pipeResult, rooms, worstHead, onResult }: HydraulicTabProps) {
  const [material, setMaterial] = useState<PipeMaterial>('steel');
  const [elevation, setElevation] = useState(3.5);
  const [riserLength, setRiserLength] = useState(10);
  const [sections, setSections] = useState<PipeSectionInput[]>([]);
  const [result, setResult] = useState<HydraulicResult | null>(null);

  // worstHead 연동: 탭3 클릭 → 구간 자동 설정 (우선), 없으면 pipeResult 기반
  useEffect(() => {
    if (worstHead) {
      setSections(buildSectionsFromWorstHead(worstHead, pipeResult));
    } else if (pipeResult && pipeResult.roomDetails.length > 0) {
      const rd = pipeResult.roomDetails[pipeResult.roomDetails.length - 1];
      const dominantRisk = (['extra', 'ordinary2', 'ordinary1', 'light'] as const)
        .find(r => rooms.some(rm => rm.risk === r)) ?? 'ordinary1';
      const flowPerHead = RISK_TABLE[dominantRisk].flow;
      const simHeads = SIMULTANEOUS_HEADS[dominantRisk] ?? 20;
      setSections(buildDefaultSections(
        simHeads * flowPerHead, flowPerHead,
        rd.branchPipe.size, rd.crossPipe.size,
        pipeResult.riserPipe.size, rd.hxCount,
      ));
    }
  }, [worstHead, pipeResult, rooms]);

  const dominantRisk = (['extra', 'ordinary2', 'ordinary1', 'light'] as const)
    .find(r => rooms.some(rm => rm.risk === r)) ?? 'ordinary1';
  const simHeads = SIMULTANEOUS_HEADS[dominantRisk] ?? 20;
  const flowPerHead = pipeResult ? RISK_TABLE[dominantRisk].flow : 0;
  const designFlow = simHeads * flowPerHead;

  const handleCalc = () => {
    if (!pipeResult) return;
    const res = calcHydraulic({
      C: HAZEN_WILLIAMS_C[material],
      riserLength,
      elevation,
      sections,
    });
    setResult(res);
    onResult(res);
  };

  const updateSection = (i: number, field: keyof PipeSectionInput, val: number | string) => {
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const updateFitting = (i: number, key: keyof PipeSectionInput['fittings'], val: number) => {
    setSections(prev => prev.map((s, idx) =>
      idx === i ? { ...s, fittings: { ...s.fittings, [key]: val } } : s
    ));
  };

  if (!pipeResult) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-xl border border-gray-700 text-gray-400 text-sm">
        탭④ 배관 계산을 먼저 실행한 후 수리계산을 진행하세요.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* 좌측 입력 패널 */}
      <div className="space-y-5">
        <h2 className="text-base font-bold text-white">수리계산 입력</h2>

        {/* 최불리 헤드 정보 */}
        {worstHead ? (
          <div className="bg-red-950/40 border border-red-700 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-400 font-bold text-sm">★ 최불리 헤드 (탭③ 연동)</span>
              <span className="text-xs text-red-600">탭③ 캔버스에서 클릭으로 변경 가능</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <ReadRow label="위치 (실)"     value={worstHead.roomName} />
              <ReadRow label="열×행"          value={`${worstHead.hxIndex + 1}열 / ${worstHead.hyIndex + 1}행 (총 ${worstHead.hxCount}×${worstHead.hyCount})`} />
              <ReadRow label="가지관"          value={worstHead.branchPipeSize} />
              <ReadRow label="교차관"          value={worstHead.crossPipeSize} />
              <ReadRow label="입상관"          value={worstHead.riserPipeSize} />
              <ReadRow label="설계유량"        value={`${worstHead.designFlow} LPM`} />
              <ReadRow label="헤드 1개 방수량" value={`${worstHead.flowPerHead} LPM`} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 border-dashed rounded-lg p-3 text-xs text-gray-500 text-center">
            탭③ 헤드배치 캔버스에서 헤드를 클릭하면 최불리 헤드가 자동 연동됩니다.
          </div>
        )}

        {/* 기본 정보 (읽기 전용) */}
        <Section title="기본 정보 (자동 계산값)">
          <ReadRow label="시스템"       value={SYSTEM_LABEL[pipeResult.system]} />
          <ReadRow label="위험등급"     value={RISK_TABLE[dominantRisk].label} />
          <ReadRow label="동시개방 기준" value={`${simHeads}개`} hint={SIMULTANEOUS_HEADS_LAW} />
          <ReadRow label="설계유량"     value={`${designFlow} LPM (${simHeads}개 × ${flowPerHead} LPM/개)`} />
        </Section>

        {/* 배관 조건 */}
        <Section title="배관 조건">
          <div className="space-y-1 mb-3">
            <label className="label-base">관 재질</label>
            <div className="flex flex-wrap gap-4">
              {(Object.entries(HAZEN_WILLIAMS_C) as [PipeMaterial, number][]).map(([k, c]) => (
                <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="material" value={k}
                    checked={material === k} onChange={() => setMaterial(k)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-gray-300">
                    {k === 'steel' ? '강관' : k === 'copper' ? '동관' : '스테인리스'}
                    <span className="text-gray-500 ml-1">(C={c})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="실양정/층고 (m)" value={elevation} onChange={setElevation} step={0.5} />
            <NumberInput label="입상관 길이 (m)" value={riserLength} onChange={setRiserLength} step={1} />
          </div>
        </Section>

        {/* 구간별 입력 */}
        <Section title="구간별 직관 길이 및 부속류">
          {sections.length === 0 ? (
            <p className="text-gray-500 text-sm">탭④ 결과 기반으로 자동 설정됩니다.</p>
          ) : (
            <div className="space-y-4">
              {sections.map((sec, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-400 w-20">{sec.name}</span>
                    <span className="text-xs text-gray-500">{sec.pipeSize}</span>
                    <span className="text-xs text-gray-500">{sec.flowLPM} LPM</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">
                        직관 길이 (m)
                        {worstHead && (
                          <span className="text-gray-600 ml-1">— 실측값으로 수정</span>
                        )}
                      </label>
                      <input type="number" min={0} step={0.5}
                        className="input-base text-xs py-1"
                        value={sec.straightLength}
                        onChange={e => updateSection(i, 'straightLength', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {([
                        ['elbow90', '엘보'],
                        ['teeDiv',  '티'],
                        ['osy',     'OS&Y'],
                        ['alarm',   '알람'],
                        ['check',   '체크'],
                      ] as const).map(([key, lbl]) => (
                        <div key={key}>
                          <label className="text-xs text-gray-400">{lbl}</label>
                          <input type="number" min={0}
                            className="input-base text-xs py-1 px-1"
                            value={sec.fittings[key]}
                            onChange={e => updateFitting(i, key, parseInt(e.target.value) || 0)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <button onClick={handleCalc}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          수리계산 실행 <span className="text-blue-200 text-xs ml-1">§ NFPC 103 제10조④</span>
        </button>
      </div>

      {/* 우측 결과 패널 */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">계산 결과</h2>

        {!result ? (
          <div className="flex items-center justify-center h-48 bg-gray-800 rounded-xl border border-gray-700 text-gray-500 text-sm">
            왼쪽 조건 입력 후 계산 실행
          </div>
        ) : (
          <>
            {/* 판정 결과 */}
            <Verdict result={result} />

            {/* 구간별 압력손실 표 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    {['구간', '관경', '내경', '유량', '직관', '상당', '합계', '손실(MPa)'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left text-gray-300 border border-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.sections.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                      <td className="px-2 py-1 border border-gray-700 text-gray-300 whitespace-nowrap">{s.name}</td>
                      <td className="px-2 py-1 border border-gray-700 text-gray-400">{s.pipeSize}</td>
                      <td className="px-2 py-1 border border-gray-700 text-gray-400">{s.innerDiameter}mm</td>
                      <td className="px-2 py-1 border border-gray-700 text-gray-400">{s.flowLPM}</td>
                      <td className="px-2 py-1 border border-gray-700 text-gray-400">{s.straightLength.toFixed(1)}</td>
                      <td className="px-2 py-1 border border-gray-700 text-gray-400">{s.equivalentLength.toFixed(2)}</td>
                      <td className="px-2 py-1 border border-gray-700 text-gray-400">{s.totalLength.toFixed(2)}</td>
                      <td className="px-2 py-1 border border-gray-700 text-blue-300 font-mono">{s.pressureLoss.toFixed(4)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-700 font-semibold">
                    <td colSpan={7} className="px-2 py-1 border border-gray-600 text-gray-300">마찰손실 합계</td>
                    <td className="px-2 py-1 border border-gray-600 text-yellow-300 font-mono">{result.totalFrictionLoss.toFixed(4)}</td>
                  </tr>
                  <tr className="bg-gray-700">
                    <td colSpan={7} className="px-2 py-1 border border-gray-600 text-gray-400">실양정 손실</td>
                    <td className="px-2 py-1 border border-gray-600 text-yellow-300 font-mono">{result.elevationLoss.toFixed(4)}</td>
                  </tr>
                  <tr className="bg-blue-900/40 font-bold">
                    <td colSpan={7} className="px-2 py-1 border border-blue-700 text-blue-200">필요 공급압력</td>
                    <td className="px-2 py-1 border border-blue-700 text-blue-200 font-mono">{result.requiredSupplyPressure.toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 압력 흐름도 SVG */}
            <PressureFlowChart result={result} />
          </>
        )}
      </div>
    </div>
  );
}

function Verdict({ result }: { result: HydraulicResult }) {
  if (result.isOverPressure) {
    return (
      <div className="bg-yellow-900/40 border border-yellow-600 rounded-lg p-4">
        <div className="text-yellow-400 font-bold">⚠ 과압 주의</div>
        <div className="text-yellow-300 text-sm mt-1">
          필요 공급압력 {result.requiredSupplyPressure.toFixed(3)} MPa — {HEAD_PRESSURE.max} MPa 초과 시 감압밸브 설치 검토
        </div>
        <div className="text-yellow-600 text-xs mt-1">§ {result.law}</div>
      </div>
    );
  }
  return (
    <div className="bg-green-900/40 border border-green-600 rounded-lg p-4">
      <div className="text-green-400 font-bold">✅ 기준 충족</div>
      <div className="text-green-300 text-sm mt-1">
        말단 {HEAD_PRESSURE.min} MPa 확보. 필요 공급압력: <span className="font-bold">{result.requiredSupplyPressure.toFixed(3)} MPa</span>
      </div>
      <div className="text-green-600 text-xs mt-1">§ {result.law}</div>
    </div>
  );
}

function PressureFlowChart({ result }: { result: HydraulicResult }) {
  const stages = ['펌프', '입상관', '교차관', '가지관', '★ 최불리\n헤드'];
  const totalLoss = result.requiredSupplyPressure;
  const losses = [0, result.sections[4]?.pressureLoss ?? 0, result.sections[2]?.pressureLoss ?? 0, result.sections[1]?.pressureLoss ?? 0, result.sections[0]?.pressureLoss ?? 0];
  let cumLoss = 0;
  const pressures = losses.map(l => { cumLoss += l; return totalLoss - cumLoss; });

  const W = 360;
  const H = 100;
  const stageW = W / stages.length;

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-400 mb-2 font-semibold">압력 흐름도 (최불리 경로)</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {stages.map((label, i) => {
          const x = i * stageW + stageW / 2;
          const pVal = pressures[i];
          const ratio = Math.min(pVal / totalLoss, 1);
          const r = Math.floor(59 + (239 - 59) * (1 - ratio));
          const g = Math.floor(130 + (68 - 130) * (1 - ratio));
          const b = Math.floor(246 + (68 - 246) * (1 - ratio));
          const color = `rgb(${r},${g},${b})`;

          return (
            <g key={i}>
              {i > 0 && (
                <line x1={(i - 1) * stageW + stageW / 2} y1={50} x2={x} y2={50}
                  stroke="#374151" strokeWidth={2} />
              )}
              <circle cx={x} cy={50} r={20} fill={color} opacity={0.85} />
              <text x={x} y={47} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
                {pVal.toFixed(3)}
              </text>
              <text x={x} y={57} textAnchor="middle" fontSize={7} fill="white">MPa</text>
              {label.includes('\n') ? (
                <>
                  <text x={x} y={83} textAnchor="middle" fontSize={8} fill="#9ca3af">★ 최불리</text>
                  <text x={x} y={93} textAnchor="middle" fontSize={8} fill="#9ca3af">헤드</text>
                </>
              ) : (
                <text x={x} y={85} textAnchor="middle" fontSize={8} fill="#9ca3af">{label}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 작은 헬퍼 컴포넌트들
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function ReadRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-200 text-right">
        {value}
        {hint && <span className="block text-gray-600 text-xs mt-0.5">{hint}</span>}
      </span>
    </div>
  );
}

function NumberInput({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <label className="label-base">{label}</label>
      <input type="number" step={step ?? 0.5} className="input-base"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

const SYSTEM_LABEL: Record<string, string> = {
  wet:       '습식',
  dry:       '건식',
  deluge:    '일제살수식',
  preaction: '준비작동식',
};
