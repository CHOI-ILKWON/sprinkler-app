import type { DesignCondition, SystemResult, SystemType, StandardCode } from '../../types';
import { SYSTEM_LABELS } from '../../types';
import { selectSystem } from '../../lib/systemSelector';
import {
  STANDARD_HEAD_COUNT,
  STANDARD_HEAD_COUNT_LAW,
  STANDARD_HEAD_COUNT_NOTE,
  STANDARD_LABEL,
  WAREHOUSE_STANDARD_HEAD_COUNT,
  INSTALL_TARGETS,
  INSTALL_TARGETS_LAW,
  ESFR,
  KFS_1013_NOTE,
} from '../../constants/nfpc';
import CheckTable, { LawList } from '../ui/CheckTable';

interface Props {
  condition: DesignCondition;
  setCondition: React.Dispatch<React.SetStateAction<DesignCondition>>;
  result: SystemResult | null;
  setResult: (r: SystemResult) => void;
}

export default function SelectTab({ condition, setCondition, result, setResult }: Props) {
  const set = <K extends keyof DesignCondition>(k: K, v: DesignCondition[K]) =>
    setCondition(c => ({ ...c, [k]: v }));

  const isWarehouse = condition.standard !== 'nftc103';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">설계 조건</h2>

        <Field label="적용 기준" hint="창고시설은 2024.1.1부터 NFPC 609가 단독 규율 (NFPC 609 부칙 제3조①)">
          <select
            className="input-base"
            value={condition.standard}
            onChange={e => set('standard', e.target.value as StandardCode)}
          >
            {(Object.keys(STANDARD_LABEL) as StandardCode[]).map(k => (
              <option key={k} value={k}>
                {STANDARD_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>

        {!isWarehouse && (
          <Field label="설치장소 (기준개수)" hint={`${STANDARD_HEAD_COUNT_LAW} — ${STANDARD_HEAD_COUNT_NOTE}`}>
            <select
              className="input-base"
              value={condition.placeCategoryId}
              onChange={e => set('placeCategoryId', e.target.value)}
            >
              {STANDARD_HEAD_COUNT.map(p => (
                <option key={p.id} value={p.id}>
                  {p.detail} → {p.count}개
                </option>
              ))}
            </select>
          </Field>
        )}

        {isWarehouse && (
          <div className="bg-blue-950/40 border border-blue-800 rounded-lg p-3 text-xs text-blue-200 leading-relaxed">
            창고시설의 기준개수는 <b>{WAREHOUSE_STANDARD_HEAD_COUNT}개</b> (라지드롭형 헤드 설치개수가 가장 많은
            방호구역의 개수, 30개 이상이면 30개) — <span className="font-mono">NFPC 609 제7조②1</span>
          </div>
        )}

        <Field label="용도" hint="법정 강제 방식 판단에 사용됩니다">
          <select
            className="input-base"
            value={condition.usage}
            onChange={e => set('usage', e.target.value as DesignCondition['usage'])}
          >
            <option value="general_h8_under">일반 (사무실·판매·의료 등)</option>
            <option value="factory_other">공장</option>
            <option value="parking">주차장</option>
            <option value="stage">무대부</option>
            <option value="warehouse_general">창고</option>
          </select>
        </Field>

        <Field
          label="구조"
          hint="수평거리 2.1 m / 내화구조 2.3 m — NFTC 103 2.7.3.4"
        >
          <select
            className="input-base"
            value={condition.fireproof ? 'y' : 'n'}
            onChange={e => set('fireproof', e.target.value === 'y')}
          >
            <option value="y">내화구조 (R = 2.3 m)</option>
            <option value="n">비내화구조 (R = 2.1 m)</option>
          </select>
        </Field>

        <Field label="동결 우려" hint="NFTC 103 2.5.15 (주차장) / NFPC 609 제7조①1 (창고)">
          <select
            className="input-base"
            value={condition.temp}
            onChange={e => set('temp', e.target.value as DesignCondition['temp'])}
          >
            <option value="normal">없음 (상시 난방 또는 동결 우려 없음)</option>
            <option value="cold">저온 (동결 가능성 있음)</option>
            <option value="freeze">영하 환경</option>
          </select>
        </Field>

        {isWarehouse && (
          <div className="space-y-2">
            <Check
              checked={condition.coldStorage}
              onChange={v => set('coldStorage', v)}
              label="냉동창고 또는 영하의 온도로 저장하는 냉장창고"
              law="NFPC 609 제7조①1 가목 — 건식 허용"
            />
            <Check
              checked={condition.unheatedWarehouse}
              onChange={v => set('unheatedWarehouse', v)}
              label="상시 근무자가 없어 난방을 하지 않는 창고시설"
              law="NFPC 609 제7조①1 나목 — 건식 허용"
            />
          </div>
        )}

        <Field label="천장(반자) 높이 (m)" hint={`랙식 창고는 ${ESFR.maxCeilingHeight} m 이하이면 ESFR 선택 가능 (NFPC 609 제7조①4)`}>
          <input
            type="number"
            min={2}
            step={0.1}
            className="input-base"
            value={condition.ceiling}
            onChange={e => set('ceiling', parseFloat(e.target.value) || 0)}
          />
        </Field>

        <Field label="수손 민감도" hint="법정 강제가 아니라 설계 판단입니다">
          <select
            className="input-base"
            value={condition.damage}
            onChange={e => set('damage', e.target.value as DesignCondition['damage'])}
          >
            <option value="normal">일반</option>
            <option value="sensitive">민감 (수손 시 손실 큼)</option>
            <option value="critical">치명적 (전산실·수장고 등)</option>
          </select>
        </Field>

        <Check
          checked={condition.gridPipe}
          onChange={v => set('gridPipe', v)}
          label="격자형(그리드) 배관방식 채택"
          law="NFTC 103 2.3.1.1 단서 — 방호구역 3,700 ㎡ / 2.5.9.2.2 — 가지배관 8개 예외"
        />

        <Field label="방식 직접 지정 (선택)" hint="법정 기준과 다르면 경고가 표시됩니다">
          <select
            className="input-base"
            value={condition.systemOverride ?? ''}
            onChange={e =>
              set('systemOverride', (e.target.value || undefined) as SystemType | undefined)
            }
          >
            <option value="">자동 판정</option>
            {(Object.keys(SYSTEM_LABELS) as SystemType[]).map(s => (
              <option key={s} value={s}>
                {SYSTEM_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <button
          onClick={() => setResult(selectSystem(condition))}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          방식 판정
        </button>

        <p className="text-[11px] text-gray-500 leading-relaxed border-t border-gray-800 pt-3">{KFS_1013_NOTE}</p>
      </div>

      <div className="space-y-4">
        {result ? (
          <>
            <div
              className={
                'rounded-lg p-4 border ' +
                (result.isMandated
                  ? 'bg-blue-950/40 border-blue-700'
                  : result.isManualOverride
                    ? 'bg-yellow-950/30 border-yellow-700'
                    : 'bg-gray-800 border-gray-700')
              }
            >
              <div className="text-xs text-gray-400 mb-1">
                {result.isMandated ? '법정 강제' : result.isManualOverride ? '사용자 지정' : '설계 판단'}
              </div>
              <div className="text-2xl font-bold text-white">{SYSTEM_LABELS[result.system]}</div>
              <ul className="mt-3 space-y-1.5">
                {result.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-gray-300 leading-relaxed">
                    · {r}
                  </li>
                ))}
              </ul>
            </div>

            <CheckTable checks={result.checks} title="법령 적합성 검토" />
            <LawList laws={result.laws} />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">필요 밸브 · 부속</h3>
              <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left px-3 py-2">부속</th>
                      <th className="text-left px-3 py-2">규격</th>
                      <th className="text-left px-3 py-2">내용</th>
                      <th className="text-left px-3 py-2">근거</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {result.valves.map((v, i) => (
                      <tr key={i} className="align-top hover:bg-gray-800/40">
                        <td className="px-3 py-2 text-gray-200 whitespace-nowrap">
                          {v.icon} {v.name}
                        </td>
                        <td className="px-3 py-2 text-gray-400 font-mono whitespace-nowrap">{v.size}</td>
                        <td className="px-3 py-2 text-gray-400 leading-relaxed">{v.desc}</td>
                        <td className="px-3 py-2 text-blue-300 font-mono text-[11px] whitespace-nowrap">{v.law}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-sm text-gray-500">
            조건을 입력하고 「방식 판정」을 누르십시오.
          </div>
        )}

        <details className="border border-gray-700 rounded-lg">
          <summary className="px-3 py-2 text-xs font-semibold text-gray-300 cursor-pointer">
            설치대상 확인 — {INSTALL_TARGETS_LAW}
          </summary>
          <div className="overflow-x-auto border-t border-gray-700">
            <table className="w-full text-[11px]">
              <tbody className="divide-y divide-gray-800">
                {INSTALL_TARGETS.map(t => (
                  <tr key={t.no} className="align-top">
                    <td className="px-3 py-2 text-gray-500 font-mono whitespace-nowrap">{t.no}</td>
                    <td className="px-3 py-2 text-gray-200">{t.target}</td>
                    <td className="px-3 py-2 text-gray-400 leading-relaxed">{t.requirement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-base">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
  law,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  law: string;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 accent-blue-500"
      />
      <span>
        <span className="text-xs text-gray-200">{label}</span>
        <span className="block text-[11px] text-gray-500 font-mono">{law}</span>
      </span>
    </label>
  );
}
