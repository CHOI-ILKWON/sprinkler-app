import { useState } from 'react';
import type { SystemResult, Room, PipeCalcResult, HydraulicResult, WarehouseCheck } from '../../types';
import { buildCheckItems, buildMaterialList, USAGE_LABEL, SYSTEM_LABEL } from '../../lib/reportGenerator';
import { RISK_TABLE, SIMULTANEOUS_HEADS, SIMULTANEOUS_HEADS_LAW, MAX_HEADS_PER_BRANCH } from '../../constants/nfpc';

interface ReportTabProps {
  systemResult: SystemResult | null;
  rooms: Room[];
  pipeResult: PipeCalcResult | null;
  hydraulicResult: HydraulicResult | null;
  warehouseCheck: WarehouseCheck | null;
}

export default function ReportTab({ systemResult, rooms, pipeResult, hydraulicResult, warehouseCheck }: ReportTabProps) {
  const [projectName, setProjectName] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [generated, setGenerated] = useState(false);

  const canGenerate = rooms.length > 0 && pipeResult !== null;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerated(true);
  };

  const dominantRisk = (['extra', 'ordinary2', 'ordinary1', 'light'] as const)
    .find(r => rooms.some(rm => rm.risk === r)) ?? 'ordinary1';
  const risk = RISK_TABLE[dominantRisk];
  const simHeads = SIMULTANEOUS_HEADS[dominantRisk] ?? 20;
  const flowPerHead = risk.flow;
  const designFlow = simHeads * flowPerHead;
  const totalArea = rooms.reduce((s, r) => s + r.w * r.d, 0);

  const checkItems = generated && pipeResult
    ? buildCheckItems({ projectName, designerName, date: '', systemResult, rooms, pipeResult, hydraulicResult, warehouseCheck })
    : [];

  const materialList = generated && pipeResult
    ? buildMaterialList({ projectName, designerName, date: '', systemResult, rooms, pipeResult, hydraulicResult, warehouseCheck })
    : null;

  return (
    <div>
      {/* 컨트롤 바 (인쇄 시 숨김) */}
      <div className="no-print flex flex-wrap gap-3 mb-6 items-center">
        <input
          className="input-base flex-1 min-w-[200px]"
          placeholder="프로젝트명"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
        />
        <input
          className="input-base w-40"
          placeholder="설계자명"
          value={designerName}
          onChange={e => setDesignerName(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
        >
          📋 계산서 생성
        </button>
        <button
          onClick={() => window.print()}
          disabled={!generated}
          className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
        >
          🖨️ 인쇄 / PDF
        </button>
        {!canGenerate && (
          <span className="text-yellow-400 text-sm">탭③ 실 입력 → 탭④ 배관 계산 후 생성 가능</span>
        )}
      </div>

      {!generated ? (
        <div className="flex items-center justify-center h-64 bg-gray-800 rounded-xl border border-gray-700 text-gray-500 text-sm">
          프로젝트명, 설계자명 입력 후 계산서 생성 버튼을 누르세요.
        </div>
      ) : (
        <div id="report-body" className="bg-white text-gray-900 rounded-xl p-8 space-y-8 text-sm">

          {/* 섹션1: 표지 */}
          <div className="report-section text-center border-b-2 border-gray-800 pb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">스프링클러설비 설계 계산서</h1>
            <div className="space-y-2 text-gray-700">
              <p className="text-lg">{projectName || '(프로젝트명 미입력)'}</p>
              <p>설계자: {designerName || '(설계자명 미입력)'}</p>
              <p>작성일: {new Date().toLocaleDateString('ko-KR')}</p>
              <p className="text-xs text-gray-500 mt-4">적용 법규: NFPC 103 (국가화재안전기준, 소방청 고시)</p>
            </div>
          </div>

          {/* 섹션2: 설계 개요 */}
          <ReportSection title="1. 설계 개요">
            <table className="report-table">
              <thead><tr><ReportTh>항목</ReportTh><ReportTh>내용</ReportTh><ReportTh>법규</ReportTh></tr></thead>
              <tbody>
                <ReportRow cells={['건물 용도', USAGE_LABEL[systemResult?.system ?? ''] ?? (systemResult ? '기타' : '미선정'), 'NFPC 103 제4조']} />
                <ReportRow cells={['스프링클러 종류', systemResult ? SYSTEM_LABEL[systemResult.system] : '미선정', 'NFPC 103 제4조']} />
                <ReportRow cells={['위험등급', `${risk.label} (NFPC 103 제10조)`, 'NFPC 103 제10조']} />
                <ReportRow cells={['총 방호면적', `${Math.round(totalArea).toLocaleString()} ㎡`, '-']} />
                <ReportRow cells={['총 헤드 수', `${pipeResult?.totalHeads ?? 0} 개`, '-']} />
              </tbody>
            </table>
          </ReportSection>

          {/* 섹션3: 동시개방 기준개수 */}
          <ReportSection title="2. 동시개방 기준개수 및 설계유량">
            <table className="report-table">
              <thead><tr><ReportTh>항목</ReportTh><ReportTh>수치</ReportTh><ReportTh>근거</ReportTh></tr></thead>
              <tbody>
                <ReportRow cells={['동시개방 기준개수', `${simHeads} 개`, SIMULTANEOUS_HEADS_LAW]} />
                <ReportRow cells={['헤드 1개당 방수량', `${flowPerHead} LPM`, `NFPC 103 제10조 (${risk.label})`]} />
                <ReportRow cells={['설계유량', `${designFlow} LPM`, `${simHeads}개 × ${flowPerHead} LPM`]} />
                <ReportRow cells={['전체 헤드 합산유량', `${pipeResult?.totalFlow ?? 0} LPM`, '※ 배관경 산정 참고값 (설계유량과 상이)']} />
              </tbody>
            </table>
          </ReportSection>

          {/* 섹션4: 헤드 배치 */}
          <ReportSection title="3. 헤드 선정 및 배치 §NFPC 103 제10조①">
            <table className="report-table">
              <thead>
                <tr>
                  <ReportTh>실 명</ReportTh><ReportTh>크기 (m)</ReportTh>
                  <ReportTh>등급</ReportTh><ReportTh>헤드수</ReportTh>
                  <ReportTh>간격 X</ReportTh><ReportTh>간격 Y</ReportTh>
                  <ReportTh>기준충족</ReportTh>
                </tr>
              </thead>
              <tbody>
                {pipeResult?.roomDetails.map((rd, i) => (
                  <tr key={i}>
                    <ReportTd>{rd.room.name}</ReportTd>
                    <ReportTd>{rd.room.w}×{rd.room.d}</ReportTd>
                    <ReportTd>{RISK_TABLE[rd.room.risk].label}</ReportTd>
                    <ReportTd>{rd.heads}</ReportTd>
                    <ReportTd>{rd.actualSpacingX.toFixed(2)}</ReportTd>
                    <ReportTd>{rd.actualSpacingY.toFixed(2)}</ReportTd>
                    <ReportTd>{rd.spacingOk ? <span className="check-ok">✅ 충족</span> : <span className="check-fail">❌ 초과</span>}</ReportTd>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportSection>

          {/* 섹션5: 배관 계획 */}
          <ReportSection title="4. 배관 계획 §NFPC 103 별표1, 제6조②">
            <table className="report-table">
              <thead>
                <tr>
                  <ReportTh>실 명</ReportTh><ReportTh>가지관</ReportTh>
                  <ReportTh>교차관</ReportTh><ReportTh>주관(누적)</ReportTh>
                  <ReportTh>유량(LPM)</ReportTh><ReportTh>가지관헤드</ReportTh>
                </tr>
              </thead>
              <tbody>
                {pipeResult?.roomDetails.map((rd, i) => (
                  <tr key={i}>
                    <ReportTd>{rd.room.name}</ReportTd>
                    <ReportTd>{rd.branchPipe.size}</ReportTd>
                    <ReportTd>{rd.crossPipe.size}</ReportTd>
                    <ReportTd>{rd.cumulativePipe.size}</ReportTd>
                    <ReportTd>{rd.roomFlow}</ReportTd>
                    <ReportTd>
                      {rd.hxCount > MAX_HEADS_PER_BRANCH
                        ? <span className="check-fail">{rd.hxCount}개 (초과!)</span>
                        : <span className="check-ok">{rd.hxCount}개</span>}
                    </ReportTd>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="law-ref mt-1">입상관: {pipeResult?.riserPipe.size} — 누적 총 유량 {pipeResult?.totalFlow} LPM 기준</p>
          </ReportSection>

          {/* 섹션6: 수리계산 */}
          <ReportSection title="5. 수리계산 결과 §NFPC 103 제10조④">
            {hydraulicResult ? (
              <>
                <div className={`p-3 rounded mb-3 ${hydraulicResult.isOverPressure ? 'bg-yellow-50 border border-yellow-400' : 'bg-green-50 border border-green-400'}`}>
                  <span className={hydraulicResult.isOverPressure ? 'check-warn' : 'check-ok'}>
                    {hydraulicResult.isOverPressure ? '⚠ 과압 — 감압밸브 검토' : '✅ 기준 충족'}
                  </span>
                  <span className="ml-2">필요 공급압력: {hydraulicResult.requiredSupplyPressure.toFixed(3)} MPa</span>
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <ReportTh>구간</ReportTh><ReportTh>관경</ReportTh><ReportTh>내경(mm)</ReportTh>
                      <ReportTh>유량(LPM)</ReportTh><ReportTh>합계길이(m)</ReportTh><ReportTh>손실(MPa)</ReportTh>
                    </tr>
                  </thead>
                  <tbody>
                    {hydraulicResult.sections.map((s, i) => (
                      <tr key={i}>
                        <ReportTd>{s.name}</ReportTd>
                        <ReportTd>{s.pipeSize}</ReportTd>
                        <ReportTd>{s.innerDiameter}</ReportTd>
                        <ReportTd>{s.flowLPM}</ReportTd>
                        <ReportTd>{s.totalLength.toFixed(2)}</ReportTd>
                        <ReportTd>{s.pressureLoss.toFixed(4)}</ReportTd>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-gray-100">
                      <td colSpan={5} className="px-2 py-1 border border-gray-300">마찰손실 합계</td>
                      <td className="px-2 py-1 border border-gray-300">{hydraulicResult.totalFrictionLoss.toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-2 py-1 border border-gray-300">실양정 손실</td>
                      <td className="px-2 py-1 border border-gray-300">{hydraulicResult.elevationLoss.toFixed(4)}</td>
                    </tr>
                    <tr className="font-bold bg-blue-50">
                      <td colSpan={5} className="px-2 py-1 border border-gray-300">필요 공급압력</td>
                      <td className="px-2 py-1 border border-gray-300">{hydraulicResult.requiredSupplyPressure.toFixed(4)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-4 text-yellow-800 text-sm">
                ⚠ 탭⑤ 수리계산을 먼저 실행한 후 계산서를 다시 생성하세요.
              </div>
            )}
          </ReportSection>

          {/* 섹션7: 적합성 검토 */}
          <ReportSection title="6. 설계 적합성 검토">
            <table className="report-table">
              <thead>
                <tr><ReportTh>항목</ReportTh><ReportTh>판정</ReportTh><ReportTh>실제값</ReportTh><ReportTh>기준값</ReportTh><ReportTh>법규</ReportTh></tr>
              </thead>
              <tbody>
                {checkItems.map((item, i) => (
                  <tr key={i}>
                    <ReportTd>{item.label}</ReportTd>
                    <ReportTd>
                      {item.isWarning
                        ? <span className="check-warn">⚠</span>
                        : item.isPassing
                          ? <span className="check-ok">✅</span>
                          : <span className="check-fail">❌</span>}
                    </ReportTd>
                    <ReportTd>{item.actual}</ReportTd>
                    <ReportTd>{item.standard}</ReportTd>
                    <ReportTd><span className="law-ref">{item.law}</span></ReportTd>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportSection>

          {/* 섹션8: 자재 수량 */}
          {materialList && (
            <ReportSection title="7. 자재 수량표 (설계 기준, 시공 시 실측 필요)">
              {[
                { title: '헤드류', items: materialList.heads },
                { title: '밸브류', items: materialList.valves },
                { title: '배관류', items: materialList.pipes },
              ].map(g => (
                <div key={g.title} className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">{g.title}</h4>
                  <table className="report-table">
                    <thead><tr><ReportTh>품명</ReportTh><ReportTh>규격</ReportTh><ReportTh>수량</ReportTh><ReportTh>단위</ReportTh></tr></thead>
                    <tbody>
                      {g.items.map((item, i) => (
                        <tr key={i}>
                          <ReportTd>{item.name}</ReportTd>
                          <ReportTd>{item.spec}</ReportTd>
                          <ReportTd>{item.qty}</ReportTd>
                          <ReportTd>{item.unit}</ReportTd>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <p className="law-ref">※ 배관 수량은 평면 치수 기반 추정값. 시공 시 실측 및 Loss율 적용 필요.</p>
            </ReportSection>
          )}

        </div>
      )}
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="report-section">
      <h2 className="text-base font-bold text-gray-800 border-b border-gray-400 pb-1 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function ReportTh({ children }: { children: React.ReactNode }) {
  return <th className="px-2 py-1.5 text-left bg-gray-100 border border-gray-300 text-gray-700 font-semibold text-xs whitespace-nowrap">{children}</th>;
}

function ReportTd({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1 border border-gray-200 text-gray-700 text-xs">{children}</td>;
}

function ReportRow({ cells }: { cells: string[] }) {
  return (
    <tr>
      {cells.map((c, i) => <ReportTd key={i}>{c}</ReportTd>)}
    </tr>
  );
}
