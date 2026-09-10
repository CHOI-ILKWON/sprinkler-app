import { useState } from 'react';
import type { DesignCondition, WaterSupplyResult } from '../../types';
import { calcWaterSupply } from '../../lib/waterSupply';
import {
  STANDARD_HEAD_COUNT,
  WAREHOUSE_STANDARD_HEAD_COUNT,
  WATER_SUPPLY,
  ROOF_TANK,
  COMBINED_SUPPLY,
  TRANSMISSION_COEF,
  VELOCITY_LIMIT,
} from '../../constants/nfpc';
import CheckTable, { LawList } from '../ui/CheckTable';

interface Props {
  condition: DesignCondition;
  installedHeads: number;
  result: WaterSupplyResult | null;
  setResult: (r: WaterSupplyResult) => void;
}

export default function WaterTab({ condition, installedHeads, result, setResult }: Props) {
  const isWarehouse = condition.standard !== 'nftc103';
  const standardCount = isWarehouse
    ? WAREHOUSE_STANDARD_HEAD_COUNT
    : (STANDARD_HEAD_COUNT.find(p => p.id === condition.placeCategoryId)?.count ?? 10);

  const [h1, setH1] = useState(20);
  const [h2, setH2] = useState(15);
  const [efficiency, setEfficiency] = useState(0.65);
  const [transmission, setTransmission] = useState<number>(TRANSMISSION_COEF.direct);
  const [velocity, setVelocity] = useState(6);
  const [roofExempt, setRoofExempt] = useState(false);
  const [heads, setHeads] = useState(0);
  const [combined, setCombined] = useState(0);

  const effectiveHeads = heads > 0 ? heads : installedHeads;
  const spec = WATER_SUPPLY[condition.standard];

  const run = () =>
    setResult(
      calcWaterSupply({
        standard: condition.standard,
        standardHeadCount: standardCount,
        installedHeads: effectiveHeads,
        h1,
        h2,
        efficiency,
        transmission,
        velocity,
        roofTankExempt: roofExempt,
        combinedOtherVolume: combined,
      }),
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">수원 · 가압송수장치</h2>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs space-y-1">
          <Row k="적용 기준" v={condition.standard === 'nftc103' ? 'NFTC 103' : 'NFPC 609'} />
          <Row k="기준개수" v={`${standardCount} 개`} law={isWarehouse ? 'NFPC 609 제7조②1' : 'NFTC 103 표 2.1.1.1'} />
          <Row k="수원 계수" v={`${spec.coefficient} ㎥`} law={spec.waterLaw} />
          <Row k="헤드 1개 방수량" v={`${spec.flowPerHead} L/min`} law={spec.flowLaw} />
          <Row k="헤드 종류" v={spec.headType} />
        </div>

        <Num
          label="실제 설치 헤드 수 (최다 층·방호구역)"
          value={effectiveHeads}
          onChange={setHeads}
          hint={`기준개수보다 적으면 이 값을 적용 (NFTC 103 2.1.1.1). 실·헤드 탭에서 산출된 값 ${installedHeads}개가 기본으로 들어갑니다.`}
        />
        <Num label="실양정 h₁ (m)" value={h1} onChange={setH1} hint="수조 최저수위 ~ 최고위·최원거리 헤드" step={0.1} />
        <Num
          label="마찰손실 h₂ (m)"
          value={h2}
          onChange={setH2}
          hint="개략값. 실시설계는 Hazen-Williams 수리계산 결과를 넣으십시오 (수리계산 탭)"
          step={0.1}
        />
        <Num label="펌프 효율 η" value={efficiency} onChange={setEfficiency} step={0.01} hint="법정 규정 아님 — 펌프 선정 자료값" />
        <div>
          <label className="label-base">전달계수 K</label>
          <select className="input-base" value={transmission} onChange={e => setTransmission(parseFloat(e.target.value))}>
            <option value={TRANSMISSION_COEF.direct}>직결 {TRANSMISSION_COEF.direct}</option>
            <option value={TRANSMISSION_COEF.vbelt}>V벨트 {TRANSMISSION_COEF.vbelt}</option>
          </select>
          <p className="text-[11px] text-gray-500 mt-1">법정 규정이 아니라 기계설비 관행값입니다.</p>
        </div>
        <Num
          label="주배관 설계유속 (㎧)"
          value={velocity}
          onChange={setVelocity}
          step={0.5}
          hint={`${VELOCITY_LIMIT.law} — 가지배관 ${VELOCITY_LIMIT.branch} ㎧, 그 밖의 배관 ${VELOCITY_LIMIT.other} ㎧ 초과 불가`}
        />
        <Num
          label="겸용 설비 소요 저수량 합계 (㎥)"
          value={combined}
          onChange={setCombined}
          step={0.1}
          hint={`${COMBINED_SUPPLY.law} — ${COMBINED_SUPPLY.rule}. 0이면 미적용`}
        />

        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={roofExempt} onChange={e => setRoofExempt(e.target.checked)} className="mt-0.5 accent-blue-500" />
          <span>
            <span className="text-xs text-gray-200">옥상수조 면제 사유에 해당</span>
            <span className="block text-[11px] text-gray-500 font-mono">{ROOF_TANK.law} 단서</span>
          </span>
        </label>
        {roofExempt && (
          <ul className="text-[11px] text-gray-500 space-y-0.5 pl-4">
            {ROOF_TANK.exemptions.map((e, i) => (
              <li key={i}>({i + 1}) {e}</li>
            ))}
          </ul>
        )}

        <button onClick={run} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors">
          수원 · 펌프 산정
        </button>
      </div>

      <div className="space-y-4">
        {result ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="수원 (유효수량)" value={`${result.waterVolume.toFixed(1)} ㎥`} highlight />
              <Stat label="옥상수조" value={result.roofTankExempt ? '면제' : `${result.roofTankVolume.toFixed(1)} ㎥`} />
              <Stat label="펌프 토출량" value={`${result.designFlowLPM.toLocaleString()} L/min`} highlight />
              <Stat label="전양정 H" value={`${result.totalHead.toFixed(1)} m`} />
              <Stat label="축동력" value={`${result.shaftPowerKW.toFixed(1)} kW`} />
              <Stat label="전동기" value={`${result.motorKW} kW`} />
              <Stat label="주배관" value={result.mainPipe.size} />
              <Stat label="최소 구경 (10 ㎧)" value={result.minMainPipe.size} />
            </div>

            {result.combinedTotal !== undefined && (
              <div className="bg-yellow-950/30 border border-yellow-700 rounded-lg p-3 text-xs text-yellow-200 leading-relaxed">
                겸용 수조 저수량 <b>{result.combinedTotal.toFixed(1)} ㎥</b> — {COMBINED_SUPPLY.rule}.
                <br />
                예외: {COMBINED_SUPPLY.exception} (<span className="font-mono">{COMBINED_SUPPLY.law}</span>)
              </div>
            )}

            <CheckTable checks={result.checks} title="법령 적합성 검토" />
            <LawList laws={result.laws} />
          </>
        ) : (
          <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-sm text-gray-500">
            입력 후 「수원 · 펌프 산정」을 누르십시오.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, law }: { k: string; v: string; law?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-400">{k}</span>
      <span className="text-right">
        <span className="text-gray-100 font-mono">{v}</span>
        {law && <span className="block text-[10px] text-blue-300 font-mono">{law}</span>}
      </span>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  hint,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="label-base">{label}</label>
      <input
        type="number"
        step={step}
        min={0}
        className="input-base"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
      {hint && <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={'rounded-lg px-3 py-2 border ' + (highlight ? 'bg-blue-950/40 border-blue-700' : 'bg-gray-800 border-gray-700')}>
      <div className="text-[11px] text-gray-400">{label}</div>
      <div className={'font-bold font-mono ' + (highlight ? 'text-blue-200 text-lg' : 'text-white text-base')}>{value}</div>
    </div>
  );
}
