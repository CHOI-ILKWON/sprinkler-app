import type { LawCheck } from '../../types';

export default function CheckTable({ checks, title }: { checks: LawCheck[]; title?: string }) {
  if (!checks.length) return null;
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold text-gray-300">{title}</h3>}
      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">항목</th>
              <th className="text-left px-3 py-2 font-semibold">산출값</th>
              <th className="text-left px-3 py-2 font-semibold">기준</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">근거</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">판정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {checks.map((c, i) => (
              <tr key={i} className="align-top hover:bg-gray-800/40">
                <td className="px-3 py-2 text-gray-200 font-medium whitespace-nowrap">{c.label}</td>
                <td className="px-3 py-2 text-gray-300 font-mono">{c.actual}</td>
                <td className="px-3 py-2 text-gray-400 leading-relaxed">{c.standard}</td>
                <td className="px-3 py-2 text-blue-300 font-mono text-[11px] whitespace-nowrap">{c.law}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {c.isWarning ? (
                    <span className="text-yellow-400">확인</span>
                  ) : c.isPassing ? (
                    <span className="text-green-400">적합</span>
                  ) : (
                    <span className="text-red-400">부적합</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LawList({ laws, title = '적용 법령' }: { laws: string[]; title?: string }) {
  if (!laws.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
      <div className="text-xs font-semibold text-gray-300 mb-2">{title}</div>
      <ul className="space-y-1">
        {laws.map((l, i) => (
          <li key={i} className="text-[11px] text-gray-400 font-mono leading-relaxed">
            · {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
