import type { WarehouseCheck } from '../types';

interface ZonePreviewProps {
  check: WarehouseCheck;
}

const ZONE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function ZonePreview({ check }: ZonePreviewProps) {
  const { zones, warnings, laws, maxAreaPerValve, maxHeadsPerValve, totalArea, valveCount } = check;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-white">존 분할 결과</h3>
        <span className="bg-blue-800 text-blue-200 px-2 py-0.5 rounded text-xs font-bold">
          총 {valveCount}개 밸브 필요
        </span>
        <span className="text-gray-400 text-xs">총 방호면적: {Math.round(totalArea).toLocaleString()}㎡</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {zones.map((zone, i) => {
          const color = ZONE_COLORS[i % ZONE_COLORS.length];
          const areaPct = Math.round((zone.area / maxAreaPerValve) * 100);
          const headPct = Math.round((zone.headCount / maxHeadsPerValve) * 100);
          const areaWarning = areaPct >= 95;
          const headWarning = headPct >= 95;

          return (
            <div
              key={zone.zoneId}
              className="rounded-lg border p-4 min-w-[200px] flex-1 bg-gray-800"
              style={{ borderColor: color }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-bold text-white text-sm">ZONE {zone.zoneId}</span>
                <span className="text-gray-400 text-xs">
                  {check.system === 'wet' ? '습식밸브' : '건식밸브'} #{zone.zoneId}
                </span>
              </div>

              <div className="space-y-1 text-xs text-gray-300 mb-3">
                <div>포함 실: {zone.rooms.join(', ')}</div>
                <div>면적: <span className={areaWarning ? 'text-yellow-400 font-semibold' : 'text-white'}>{Math.round(zone.area).toLocaleString()}㎡</span></div>
                <div>헤드: <span className={headWarning ? 'text-yellow-400 font-semibold' : 'text-white'}>{zone.headCount}개</span></div>
                <div className="pt-1 border-t border-gray-700 space-y-0.5">
                  <div>밸브: <span className="text-blue-300">{zone.valveSize}</span></div>
                  <div>교차관: <span className="text-blue-300">{zone.crossMainPipe}</span></div>
                  <div>주관: <span className="text-blue-300">{zone.mainPipe}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <ProgressBar
                  label="면적"
                  pct={areaPct}
                  color={color}
                  warning={areaWarning}
                  limit={`${maxAreaPerValve}㎡`}
                />
                <ProgressBar
                  label="헤드"
                  pct={headPct}
                  color={color}
                  warning={headWarning}
                  limit={`${maxHeadsPerValve}개`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {warnings.length > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 space-y-1">
          <div className="text-yellow-400 font-semibold text-xs mb-1">⚠ 경고</div>
          {warnings.map((w, i) => (
            <div key={i} className="text-yellow-300 text-xs">{w}</div>
          ))}
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
        <div className="text-gray-400 font-semibold text-xs mb-1">적용 법규</div>
        {laws.map((l, i) => (
          <div key={i} className="text-gray-400 text-xs">• {l}</div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  pct,
  color,
  warning,
  limit,
}: {
  label: string;
  pct: number;
  color: string;
  warning: boolean;
  limit: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-0.5">
        <span>{label}</span>
        <span className={warning ? 'text-yellow-400 font-semibold' : ''}>
          {pct}% (한도 {limit})
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: warning ? '#f59e0b' : color,
          }}
        />
      </div>
    </div>
  );
}
