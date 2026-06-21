interface NavProps {
  activeTab: number;
  onTabChange: (i: number) => void;
}

const TABS = [
  { label: '① 가이드',     sub: '시스템 안내' },
  { label: '② 시스템 선정', sub: '설계조건 입력' },
  { label: '③ 헤드 배치',  sub: '실별 배치 계산' },
  { label: '④ 배관 계산',  sub: '구경 산정' },
  { label: '⑤ 수리계산',   sub: 'H-W 압력손실' },
  { label: '⑥ 계산서 출력', sub: '인쇄 / PDF' },
];

export default function Nav({ activeTab, onTabChange }: NavProps) {
  return (
    <nav className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <div className="flex-shrink-0 mr-4 py-3">
            <span className="text-blue-400 font-bold text-sm">🔥 SP 설계도구</span>
          </div>
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => onTabChange(i)}
              className={`flex-shrink-0 px-4 py-3 text-sm border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              <div>{tab.label}</div>
              <div className="text-xs text-gray-500">{tab.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
