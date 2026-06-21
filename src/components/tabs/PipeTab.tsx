import type { Room, PipeCalcResult, SystemType, WarehouseZone } from '../../types';
import { calcPipes } from '../../lib/pipeCalc';
import PipeCanvas from '../canvas/PipeCanvas';
import Table from '../ui/Table';
import Badge from '../ui/Badge';

interface PipeTabProps {
  rooms: Room[];
  system: SystemType;
  result: PipeCalcResult | null;
  setResult: React.Dispatch<React.SetStateAction<PipeCalcResult | null>>;
  zones?: WarehouseZone[];
}

export default function PipeTab({ rooms, system, result, setResult, zones }: PipeTabProps) {
  const handleCalc = () => {
    if (rooms.length === 0) return;
    setResult(calcPipes(rooms, system, zones));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-bold text-white">배관경 계산</h2>
        <button
          onClick={handleCalc}
          disabled={rooms.length === 0}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
        >
          배관 계산
        </button>
        {rooms.length === 0 && (
          <span className="text-yellow-400 text-sm">탭3에서 실을 먼저 입력하세요.</span>
        )}
      </div>

      {result && (
        <div className="space-y-6">
          {/* 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="시스템" value={SYSTEM_LABEL[result.system]} />
            <Stat label="총 헤드" value={`${result.totalHeads}개`} />
            <Stat label="총 유량" value={`${result.totalFlow} LPM`} />
            <Stat label="입상관" value={result.riserPipe.size} highlight />
          </div>

          {/* 밸브 목록 */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-300 mb-3">
              필요 밸브류 <Badge color="blue">{result.valveSize}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.valves.map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                  <span>{v.icon}</span>
                  <span className="font-medium">{v.name}</span>
                  <span className="text-gray-500">({v.size})</span>
                </div>
              ))}
            </div>
          </div>

          {/* 계통도 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">배관 계통도</h3>
            <PipeCanvas result={result} />
          </div>

          {/* 창고 존 정보 */}
          {result.zones && result.zones.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-300 mb-3">
                창고 존 배정 현황 (총 {result.zones.length}존)
              </div>
              <Table
                headers={['존', '포함 실', '면적(㎡)', '헤드', '밸브', '교차관', '주관']}
                rows={result.zones.map(z => [
                  `ZONE ${z.zoneId}`,
                  z.rooms.join(', '),
                  Math.round(z.area).toLocaleString(),
                  `${z.headCount}개`,
                  z.valveSize,
                  z.crossMainPipe,
                  z.mainPipe,
                ])}
              />
            </div>
          )}

          {/* 실별 상세 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">실별 배관 상세</h3>
            <Table
              headers={['실', '헤드', '유량', '가지관', '교차관', '누적유량', '주관(누적)', '존']}
              rows={result.roomDetails.map(rd => [
                rd.room.name,
                `${rd.heads}개`,
                `${rd.roomFlow} LPM`,
                rd.branchPipe.size,
                rd.crossPipe.size,
                `${rd.cumulativeFlow} LPM`,
                rd.cumulativePipe.size,
                rd.zoneId ? `Z${rd.zoneId}` : '-',
              ])}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-base font-bold ${highlight ? 'text-blue-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}

const SYSTEM_LABEL: Record<string, string> = {
  wet:       '습식',
  dry:       '건식',
  preaction: '준비작동식',
  deluge:    '일제살수식',
};
