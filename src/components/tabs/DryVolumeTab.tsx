import { useState } from 'react';
import type { DryPipeSegment, DryVolumeResult, SystemType } from '../../types';
import { calcDryVolume, litersPerMeter, volumeReferenceTable } from '../../lib/dryVolume';
import { DRY_SYSTEM_VOLUME, PIPE_SIZES_2533 } from '../../constants/nfpc';

interface Props {
  system: SystemType;
  protectedArea: number;
  result: DryVolumeResult | null;
  setResult: (r: DryVolumeResult) => void;
}

const DEFAULT_SEGMENTS: DryPipeSegment[] = [
  { id: 1, mm: 25, length: 0 },
  { id: 2, mm: 32, length: 0 },
  { id: 3, mm: 40, length: 120 },
  { id: 4, mm: 50, length: 80 },
  { id: 5, mm: 65, length: 40 },
  { id: 6, mm: 100, length: 30 },
];

export default function DryVolumeTab({ system, protectedArea, result, setResult }: Props) {
  const [segments, setSegments] = useState<DryPipeSegment[]>(DEFAULT_SEGMENTS);
  const [area, setArea] = useState(protectedArea || 0);

  const update = (id: number, patch: Partial<DryPipeSegment>) =>
    setSegments(s => s.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const addRow = () => setSegments(s => [...s, { id: Math.max(0, ...s.map(x => x.id)) + 1, mm: 50, length: 0 }]);
  const removeRow = (id: number) => setSegments(s => s.filter(x => x.id !== id));

  const run = () => setResult(calcDryVolume(segments, area));
  const refTable = volumeReferenceTable();

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h2 className="text-base font-bold text-white mb-2">건식 2차측 내용적 검증</h2>
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="font-mono text-blue-300">{DRY_SYSTEM_VOLUME.law}</span> — “{DRY_SYSTEM_VOLUME.requirement}”
        </p>
        <p className="text-xs text-yellow-300 leading-relaxed mt-2">
          이 규정은 <b>면적(㎡)이 아니라 내용적(L)</b>입니다. 면적으로 환산하려면 배관 체적밀도(L/㎡)를 알아야 하는데,
          그 값은 구경 구성과 헤드 간격에 따라 대략 0.7 ~ 2.5 L/㎡ 사이에서 크게 변합니다. 그래서
          「건식 = ○○㎡ 이하」로 고정하면 <b>소면적 + 대구경</b>에서는 통과시켜 버리고, <b>대면적 + 소구경</b>에서는
          불필요하게 걸러냅니다. 아래에서 실제 내용적을 집계하고, 참고로 이 프로젝트의 체적밀도와 그에 대응하는
          환산면적을 함께 보여줍니다.
        </p>
        {system !== 'dry' && (
          <p className="text-xs text-gray-500 mt-2">
            현재 선택된 방식은 건식이 아닙니다. 이 검증은 건식스프링클러설비에만 적용됩니다.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">2차측 배관 구경별 연장</h3>
          <div className="overflow-x-auto border border-gray-700 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="text-left px-3 py-2">호칭경</th>
                  <th className="text-left px-3 py-2">연장 (m)</th>
                  <th className="text-left px-3 py-2">L/m</th>
                  <th className="text-left px-3 py-2">내용적 (L)</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {segments.map(s => {
                  const lpm = litersPerMeter(s.mm);
                  return (
                    <tr key={s.id}>
                      <td className="px-3 py-1.5">
                        <select
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                          value={s.mm}
                          onChange={e => update(s.id, { mm: parseInt(e.target.value, 10) })}
                        >
                          {PIPE_SIZES_2533.map(mm => (
                            <option key={mm} value={mm}>
                              {mm}A
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs w-24"
                          value={s.length}
                          onChange={e => update(s.id, { length: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-gray-400 font-mono">{lpm.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-gray-200 font-mono">{(lpm * s.length).toFixed(1)}</td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeRow(s.id)} className="text-red-400 hover:text-red-300">
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={addRow} className="text-xs text-blue-400 hover:text-blue-300">
            + 구간 추가
          </button>

          <div>
            <label className="label-base">해당 방호구역 면적 (㎡) — 참고 환산용</label>
            <input
              type="number"
              min={0}
              className="input-base"
              value={area}
              onChange={e => setArea(parseFloat(e.target.value) || 0)}
            />
          </div>

          <button onClick={run} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg">
            내용적 검증
          </button>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div
                className={
                  'rounded-lg p-4 border ' +
                  (result.exceeds ? 'bg-yellow-950/40 border-yellow-600' : 'bg-green-950/30 border-green-700')
                }
              >
                <div className="text-xs text-gray-400">2차측 총 내용적</div>
                <div className="text-3xl font-bold font-mono text-white">
                  {result.totalLiters.toFixed(0)} <span className="text-lg">L</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  기준 {result.limitLiters.toLocaleString()} L —{' '}
                  {result.exceeds ? (
                    <span className="text-yellow-300 font-semibold">초과: 1분 이내 방수 입증 필요</span>
                  ) : (
                    <span className="text-green-300 font-semibold">이내: 별도 입증 불요</span>
                  )}
                </div>
                {result.exceeds && (
                  <p className="text-[11px] text-yellow-200 mt-2 leading-relaxed">
                    시험장치 개폐밸브를 완전 개방한 후 1분 이내에 물이 방사됨을 시험으로 입증해야 합니다.
                    방호구역을 나누어 밸브를 늘리거나 액셀러레이터를 적용해 내용적·지연을 줄이는 것이 실무 정석입니다.
                  </p>
                )}
              </div>

              {result.volumePerArea !== undefined && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-1 text-xs">
                  <div className="text-gray-300 font-semibold mb-1">참고 — 면적 환산</div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">이 프로젝트의 배관 체적밀도</span>
                    <span className="font-mono text-gray-100">{result.volumePerArea.toFixed(2)} L/㎡</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">2,840 L에 대응하는 환산면적</span>
                    <span className="font-mono text-gray-100">{result.equivalentArea?.toFixed(0)} ㎡</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
                    이 환산면적은 <b>이 배관 구성에서만</b> 성립합니다. 구경 구성이 바뀌면 같은 2,840 L가 전혀 다른
                    면적에 대응합니다 — 그래서 법이 면적이 아니라 내용적으로 규정한 것입니다. 도서에는 반드시
                    <b> 내용적(L)</b>으로 기재하십시오.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-sm text-gray-500">
              구경별 연장을 입력하고 「내용적 검증」을 누르십시오.
            </div>
          )}

          <details className="border border-gray-700 rounded-lg">
            <summary className="px-3 py-2 text-xs font-semibold text-gray-300 cursor-pointer">
              참고표 — 단일 구경일 때 2,840 L에 해당하는 연장
            </summary>
            <div className="overflow-x-auto border-t border-gray-700">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-800/60 text-gray-400">
                  <tr>
                    <th className="text-left px-3 py-1.5">호칭경</th>
                    <th className="text-left px-3 py-1.5">1 m당 내용적</th>
                    <th className="text-left px-3 py-1.5">2,840 L 해당 연장</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {refTable.map(r => (
                    <tr key={r.mm}>
                      <td className="px-3 py-1.5 text-gray-200 font-mono">{r.mm}A</td>
                      <td className="px-3 py-1.5 text-gray-400 font-mono">{r.litersPerM.toFixed(2)} L/m</td>
                      <td className="px-3 py-1.5 text-gray-300 font-mono">약 {Math.round(r.lengthAtLimit).toLocaleString()} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-800">
              내경은 배관용 탄소강관(KS D 3507) 기준 참고값이며 관 규격·스케줄에 따라 달라집니다. 실제 집계에는
              밸브·부속의 체적도 포함하십시오.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
