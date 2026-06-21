import type { DesignCondition, SystemResult, SystemType, BuildingUsage, Room, RiskLevel } from '../../types';
import { selectSystem } from '../../lib/systemSelector';
import { calcWarehouseZones } from '../../lib/zoneCalc';
import ZonePreview from '../ZonePreview';
import Badge from '../ui/Badge';

interface SelectTabProps {
  condition: DesignCondition;
  setCondition: React.Dispatch<React.SetStateAction<DesignCondition>>;
  result: SystemResult | null;
  setResult: React.Dispatch<React.SetStateAction<SystemResult | null>>;
  rooms: Room[];
}

const WAREHOUSE_USAGES: BuildingUsage[] = [
  'warehouse_general', 'warehouse_rack', 'warehouse_high', 'cold_storage',
];

const USAGE_OPTIONS: { value: BuildingUsage; label: string; group: string }[] = [
  { value: 'office',           label: '사무소',         group: '업무·숙박·주거' },
  { value: 'hotel',            label: '호텔',           group: '업무·숙박·주거' },
  { value: 'apartment',        label: '아파트',         group: '업무·숙박·주거' },
  { value: 'hospital',         label: '병원',           group: '의료·문화' },
  { value: 'museum',           label: '박물관·미술관',  group: '의료·문화' },
  { value: 'retail',           label: '판매시설',       group: '상업·공연' },
  { value: 'stage',            label: '무대부',         group: '상업·공연' },
  { value: 'parking_indoor',   label: '옥내 주차장',    group: '주차장' },
  { value: 'parking_outdoor',  label: '옥외 주차장',    group: '주차장' },
  { value: 'factory_normal',   label: '공장 (무위험)',  group: '공장' },
  { value: 'factory_hazard',   label: '공장 (위험)',    group: '공장' },
  { value: 'data_center',      label: '데이터센터',     group: '특수' },
  { value: 'warehouse_general',label: '창고 (일반)',    group: '창고' },
  { value: 'warehouse_rack',   label: '창고 (랙식)',    group: '창고' },
  { value: 'warehouse_high',   label: '창고 (고천장)',  group: '창고' },
  { value: 'cold_storage',     label: '냉동·냉장창고',  group: '창고' },
];

const SYSTEM_COLOR: Record<SystemType, 'blue' | 'yellow' | 'purple' | 'red'> = {
  wet:       'blue',
  dry:       'yellow',
  preaction: 'purple',
  deluge:    'red',
};

const SYSTEM_LABEL: Record<SystemType, string> = {
  wet:       '습식',
  dry:       '건식',
  preaction: '준비작동식',
  deluge:    '일제살수식',
};

export default function SelectTab({ condition, setCondition, result, setResult, rooms }: SelectTabProps) {
  const isWarehouse = WAREHOUSE_USAGES.includes(condition.usage);

  const handleCalc = () => {
    const res = selectSystem(condition);

    if (isWarehouse && (condition.warehouseSystemOverride === 'wet' || condition.warehouseSystemOverride === 'dry' || !condition.warehouseSystemOverride)) {
      const whSystem = condition.warehouseSystemOverride ?? (res.system === 'wet' || res.system === 'dry' ? res.system : 'wet');
      if (whSystem === 'wet' || whSystem === 'dry') {
        const calcRooms = rooms.length > 0 ? rooms : estimateRoomsFromArea(condition.totalArea, condition.usage);
        const check = calcWarehouseZones(calcRooms, whSystem);
        res.warehouseCheck = check;
      }
    }

    setResult(res);
  };

  const update = <K extends keyof DesignCondition>(key: K, val: DesignCondition[K]) =>
    setCondition(c => ({ ...c, [key]: val }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 입력 패널 */}
      <div className="space-y-5">
        <h2 className="text-base font-bold text-white">설계 조건 입력</h2>

        <Field label="건물 용도">
          <select
            className="input-base"
            value={condition.usage}
            onChange={e => update('usage', e.target.value as BuildingUsage)}
          >
            {Array.from(new Set(USAGE_OPTIONS.map(o => o.group))).map(g => (
              <optgroup key={g} label={g}>
                {USAGE_OPTIONS.filter(o => o.group === g).map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label="천장 온도 환경">
          <Radio name="temp" value={condition.temp} onChange={v => update('temp', v as DesignCondition['temp'])}
            options={[
              { value: 'normal', label: '일반 (4°C 이상)' },
              { value: 'cold',   label: '저온 (동결 가능)' },
              { value: 'freeze', label: '동결 (-10°C 이하)' },
            ]}
          />
        </Field>

        <Field label="천장고 (m)">
          <input
            type="number" min={2} max={30} step={0.5}
            className="input-base w-32"
            value={condition.ceiling}
            onChange={e => update('ceiling', parseFloat(e.target.value) || 3)}
          />
        </Field>

        <Field label="수손 피해 민감도">
          <Radio name="damage" value={condition.damage} onChange={v => update('damage', v as DesignCondition['damage'])}
            options={[
              { value: 'normal',    label: '일반' },
              { value: 'sensitive', label: '민감 (전산장비 등)' },
              { value: 'critical',  label: '치명 (데이터센터급)' },
            ]}
          />
        </Field>

        <Field label="화재 특성">
          <Radio name="fire" value={condition.fire} onChange={v => update('fire', v as DesignCondition['fire'])}
            options={[
              { value: 'slow', label: '일반·완만' },
              { value: 'fast', label: '급속 (가연물 다량)' },
            ]}
          />
        </Field>

        <Field
          label="총 방호면적 (㎡)"
          hint="SP가 설치되는 모든 바닥면적 합산. 복도·계단·화장실 등 SP 미설치 공간 제외. 창고의 경우 이 값으로 밸브 개수를 사전 추정합니다. 정확한 계산은 탭3에서 자동 산정됩니다."
        >
          <input
            type="number" min={1} step={10}
            className="input-base w-40"
            value={condition.totalArea}
            onChange={e => update('totalArea', parseFloat(e.target.value) || 0)}
          />
          <span className="text-gray-500 text-xs ml-2">㎡</span>
        </Field>

        {isWarehouse && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-300">창고 시스템 직접 선택</div>
            <div className="text-xs text-gray-500 mb-2">선택하지 않으면 조건에 따라 자동 권장됩니다.</div>
            <div className="space-y-2">
              <RadioRow
                name="whSystem"
                value=""
                checked={!condition.warehouseSystemOverride}
                onChange={() => update('warehouseSystemOverride', undefined)}
                label="자동 선정 (권장)"
              />
              <RadioRow
                name="whSystem"
                value="wet"
                checked={condition.warehouseSystemOverride === 'wet'}
                onChange={() => update('warehouseSystemOverride', 'wet')}
                label="습식 선택"
                hint="밸브당 3,000㎡ / 200헤드"
              />
              <RadioRow
                name="whSystem"
                value="dry"
                checked={condition.warehouseSystemOverride === 'dry'}
                onChange={() => update('warehouseSystemOverride', 'dry')}
                label="건식 선택"
                hint="밸브당 1,850㎡ / 500헤드 / 60초 충수"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleCalc}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          시스템 선정 계산
        </button>
      </div>

      {/* 결과 패널 */}
      <div>
        {result ? (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">선정 결과</h2>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Badge color={SYSTEM_COLOR[result.system]}>
                  {SYSTEM_LABEL[result.system]}식 스프링클러
                </Badge>
                {result.isManualOverride && (
                  <Badge color="yellow">사용자 선택</Badge>
                )}
              </div>

              {result.reasons.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-400 mb-1">선정 이유</div>
                  {result.reasons.map((r, i) => (
                    <div key={i} className="text-sm text-gray-300">• {r}</div>
                  ))}
                </div>
              )}

              {result.laws.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-400 mb-1">적용 법규</div>
                  {result.laws.map((l, i) => (
                    <div key={i} className="text-xs text-gray-500">• {l}</div>
                  ))}
                </div>
              )}

              {result.valves.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-2">필요 밸브류</div>
                  <div className="space-y-1">
                    {result.valves.map((v, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span>{v.icon}</span>
                        <span className="font-medium">{v.name}</span>
                        <span className="text-gray-500">({v.size})</span>
                        <span className="text-gray-500">— {v.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {result.warehouseCheck && (
              <ZonePreview check={result.warehouseCheck} />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-800 rounded-xl border border-gray-700 text-gray-500 text-sm">
            설계 조건 입력 후 계산 버튼을 누르세요.
          </div>
        )}
      </div>
    </div>
  );
}

// 실이 없을 때 totalArea로 가상 실 생성 (사전 추정용)
function estimateRoomsFromArea(totalArea: number, usage: BuildingUsage): Room[] {
  const riskMap: Record<string, RiskLevel> = {
    warehouse_general: 'ordinary2',
    warehouse_rack:    'extra',
    warehouse_high:    'extra',
    cold_storage:      'ordinary2',
  };
  const risk: RiskLevel = (riskMap[usage] as RiskLevel) ?? 'ordinary2';
  return [{ id: 1, name: '창고 전체', w: Math.sqrt(totalArea), d: Math.sqrt(totalArea), risk }];
}

// 공통 폼 컴포넌트들
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}

function Radio({
  name, value, onChange, options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="accent-blue-500"
          />
          <span className="text-sm text-gray-300">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function RadioRow({
  name, value, checked, onChange, label, hint,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-blue-500"
      />
      <span className="text-sm text-gray-300">{label}</span>
      {hint && <span className="text-xs text-gray-500">({hint})</span>}
    </label>
  );
}
