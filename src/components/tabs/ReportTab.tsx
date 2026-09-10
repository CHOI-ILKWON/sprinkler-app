import { useState } from 'react';
import type {
  DesignCondition,
  SystemResult,
  WaterSupplyResult,
  Room,
  PipeCalcResult,
  HydraulicResult,
  DryVolumeResult,
  ZoneCheck,
  LawCheck,
} from '../../types';
import { SYSTEM_LABELS } from '../../types';
import { STANDARD_LABEL, RELATED_STANDARDS } from '../../constants/nfpc';

interface Props {
  condition: DesignCondition;
  systemResult: SystemResult | null;
  waterSupply: WaterSupplyResult | null;
  rooms: Room[];
  pipeResult: PipeCalcResult | null;
  hydraulicResult: HydraulicResult | null;
  dryVolume: DryVolumeResult | null;
  zoneCheck: ZoneCheck | null;
}

export default function ReportTab(p: Props) {
  const [project, setProject] = useState('');
  const [designer, setDesigner] = useState('');
  const date = new Date().toISOString().slice(0, 10);

  const allChecks: LawCheck[] = [
    ...(p.systemResult?.checks ?? []),
    ...(p.waterSupply?.checks ?? []),
    ...(p.pipeResult?.checks ?? []),
    ...(p.hydraulicResult?.checks ?? []),
  ];
  const failed = allChecks.filter(c => !c.isPassing && !c.isWarning);
  const warnings = allChecks.filter(c => c.isWarning);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div>
          <label className="label-base">공사명</label>
          <input className="input-base" value={project} onChange={e => setProject(e.target.value)} />
        </div>
        <div>
          <label className="label-base">작성자</label>
          <input className="input-base" value={designer} onChange={e => setDesigner(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button onClick={() => window.print()} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-lg">
            인쇄 / PDF 저장
          </button>
        </div>
      </div>

      <div className="bg-white text-gray-900 rounded-lg p-6 space-y-5 print:p-0">
        <header className="border-b-2 border-gray-900 pb-3">
          <h1 className="text-xl font-bold">스프링클러설비 설계 검토서</h1>
          <div className="text-xs text-gray-600 mt-1 flex gap-4 flex-wrap">
            <span>공사명: {project || '—'}</span>
            <span>작성자: {designer || '—'}</span>
            <span>작성일: {date}</span>
          </div>
          <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
            근거: 스프링클러설비의 화재안전기술기준(NFTC 103, 2024.1.1 시행) · 창고시설의 화재안전성능기준(NFPC 609,
            2024.1.1 시행) · 소방시설 설치 및 관리에 관한 법률 시행령 별표 4. 본 검토서는 설계 보조자료이며 법적
            효력이 없습니다. 인허가 도서 반영 전 원문 대조와 관할 소방서 협의가 필요합니다.
          </p>
        </header>

        <Section title="1. 설계 조건">
          <KV k="적용 기준" v={STANDARD_LABEL[p.condition.standard]} />
          <KV k="구조" v={p.condition.fireproof ? '내화구조 (R = 2.3 m)' : '비내화구조 (R = 2.1 m)'} />
          <KV k="천장(반자) 높이" v={`${p.condition.ceiling} m`} />
          <KV k="동결 우려" v={{ normal: '없음', cold: '저온', freeze: '영하' }[p.condition.temp]} />
          <KV k="격자형 배관방식" v={p.condition.gridPipe ? '적용 (방호구역 3,700 ㎡)' : '미적용'} />
        </Section>

        {p.systemResult && (
          <Section title="2. 설비방식 선정">
            <KV
              k="선정 방식"
              v={`${SYSTEM_LABELS[p.systemResult.system]} ${p.systemResult.isMandated ? '(법정 강제)' : p.systemResult.isManualOverride ? '(사용자 지정)' : '(설계 판단)'}`}
            />
            <ul className="text-xs mt-1 space-y-0.5">
              {p.systemResult.reasons.map((r, i) => (
                <li key={i}>· {r}</li>
              ))}
            </ul>
          </Section>
        )}

        {p.waterSupply && (
          <Section title="3. 수원 및 가압송수장치">
            <KV k="적용 기준개수 N" v={`${p.waterSupply.appliedHeadCount} 개${p.waterSupply.usedInstalledCount ? ' (실제 설치개수 적용)' : ''}`} />
            <KV k="수원 (유효수량)" v={`${p.waterSupply.waterVolume.toFixed(1)} ㎥ = ${p.waterSupply.appliedHeadCount} × ${p.waterSupply.coefficient} ㎥`} />
            <KV k="옥상수조" v={p.waterSupply.roofTankExempt ? '면제 (NFTC 103 2.1.2 단서)' : `${p.waterSupply.roofTankVolume.toFixed(1)} ㎥ (1/3 이상)`} />
            <KV k="펌프 토출량" v={`${p.waterSupply.designFlowLPM.toLocaleString()} L/min = ${p.waterSupply.appliedHeadCount} × ${p.waterSupply.flowPerHead} L/min`} />
            <KV k="전양정 H" v={`${p.waterSupply.totalHead.toFixed(1)} m (h₁ + h₂ + 10 m)`} />
            <KV k="축동력 / 전동기" v={`${p.waterSupply.shaftPowerKW.toFixed(1)} kW → ${p.waterSupply.motorKW} kW`} />
            <KV k="체절압력 상한 (140 %)" v={`${p.waterSupply.churnMaxHead.toFixed(1)} m 이하`} />
            <KV k="150 % 유량 시 (65 %)" v={`${p.waterSupply.peakMinHead.toFixed(1)} m 이상 @ ${Math.round(p.waterSupply.peakFlowLPM).toLocaleString()} L/min`} />
            <KV k="유량측정장치 (175 %)" v={`${Math.round(p.waterSupply.flowMeterMinLPM).toLocaleString()} L/min 이상`} />
          </Section>
        )}

        {p.rooms.length > 0 && (
          <Section title="4. 방호구역 및 헤드">
            <KV k="총 방호면적" v={`${p.rooms.reduce((s, r) => s + r.w * r.d, 0).toFixed(0)} ㎡`} />
            <KV k="유수검지장치 수" v={`${p.zoneCheck?.valveCount ?? 0} 개 (방호구역 ${p.zoneCheck?.maxAreaPerValve.toLocaleString()} ㎡ 이하)`} />
            <KV k="총 헤드 수" v={`${p.pipeResult?.totalHeads ?? 0} 개`} />
          </Section>
        )}

        {p.pipeResult && (
          <Section title="5. 배관">
            <KV k="설계유량" v={`${p.pipeResult.designFlow.toLocaleString()} L/min (기준개수 × 방수량)`} />
            <KV k="주배관·입상관" v={p.pipeResult.mainPipe.size} />
            <table className="w-full text-[11px] mt-2 border-t border-gray-300">
              <thead>
                <tr className="text-left">
                  <th className="py-1">실</th>
                  <th className="py-1">R</th>
                  <th className="py-1">헤드</th>
                  <th className="py-1">한쪽 가지</th>
                  <th className="py-1">란</th>
                  <th className="py-1">가지배관</th>
                  <th className="py-1">교차배관</th>
                </tr>
              </thead>
              <tbody>
                {p.pipeResult.roomDetails.map(d => (
                  <tr key={d.room.id} className="border-t border-gray-200">
                    <td className="py-1">{d.room.name}</td>
                    <td className="py-1">{d.horizontalDistance} m</td>
                    <td className="py-1">{d.hxCount}×{d.hyCount}={d.heads}</td>
                    <td className={'py-1 ' + (d.branchOk ? '' : 'text-red-600 font-bold')}>
                      {d.headsPerBranchSide} / {d.branchLimit}
                    </td>
                    <td className="py-1">{d.pipeColumn}</td>
                    <td className="py-1">{d.branchPipe.size}</td>
                    <td className="py-1">{d.crossPipe.size} ×{d.crossMainCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {p.dryVolume && (
          <Section title="6. 건식 2차측 내용적">
            <KV k="총 내용적" v={`${p.dryVolume.totalLiters.toFixed(0)} L / 기준 ${p.dryVolume.limitLiters.toLocaleString()} L`} />
            <KV k="판정" v={p.dryVolume.exceeds ? '초과 — 시험장치 개폐밸브 완전 개방 후 1분 이내 방수 입증 필요' : '이내 — 별도 입증 불요'} />
            <p className="text-[11px] text-gray-600 mt-1">근거: {p.dryVolume.law}</p>
          </Section>
        )}

        {p.hydraulicResult && (
          <Section title="7. 수리계산">
            <KV k="배관 마찰손실" v={`${p.hydraulicResult.totalFrictionLoss.toFixed(3)} MPa`} />
            <KV k="낙차손실" v={`${p.hydraulicResult.elevationLoss.toFixed(3)} MPa`} />
            <KV k="필요 송수압력" v={`${p.hydraulicResult.requiredSupplyPressure.toFixed(3)} MPa`} />
          </Section>
        )}

        <Section title="8. 법령 적합성 종합">
          <div className="text-xs space-y-1">
            <p>
              검토 항목 {allChecks.length}건 — 부적합 <b className={failed.length ? 'text-red-600' : ''}>{failed.length}</b>건,
              확인 필요 <b className="text-yellow-700">{warnings.length}</b>건
            </p>
            {failed.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {failed.map((c, i) => (
                  <li key={i} className="text-red-700">
                    ✗ {c.label}: {c.actual} (기준: {c.standard}) — {c.law}
                  </li>
                ))}
              </ul>
            )}
            {warnings.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {warnings.map((c, i) => (
                  <li key={i} className="text-yellow-700">
                    △ {c.label}: {c.standard} — {c.law}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section title="9. 함께 확인해야 하는 기준">
          <table className="w-full text-[11px]">
            <tbody>
              {RELATED_STANDARDS.map(s => (
                <tr key={s.code} className="border-t border-gray-200 align-top">
                  <td className="py-1 pr-2 font-semibold whitespace-nowrap">{s.code}</td>
                  <td className="py-1 pr-2">{s.title}</td>
                  <td className="py-1 text-gray-600">{s.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-300 pt-3">
      <h2 className="text-sm font-bold mb-1.5">{title}</h2>
      {children}
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex text-xs py-0.5">
      <span className="w-48 shrink-0 text-gray-600">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
