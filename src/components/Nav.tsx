const TABS = [
  { label: '가이드', hint: '기준 요약' },
  { label: '조건·방식', hint: '법정 강제 판단' },
  { label: '수원·펌프', hint: '2.1 / 2.2' },
  { label: '실·헤드', hint: '2.7.3 수평거리' },
  { label: '배관', hint: '표 2.5.3.3' },
  { label: '개방형 구역', hint: '2.1.1.2 · 30개' },
  { label: '건식 내용적', hint: '2,840 L' },
  { label: '수리계산', hint: 'Hazen-Williams' },
  { label: '계산서', hint: '출력' },
];

interface NavProps {
  activeTab: number;
  onTabChange: (i: number) => void;
}

export default function Nav({ activeTab, onTabChange }: NavProps) {
  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-base font-bold text-white">스프링클러 설계 검토</h1>
            <p className="text-[11px] text-gray-500">
              NFTC 103 (2024.1.1 시행) · NFPC 609 · 시행령 별표 4 원문 기준
            </p>
          </div>
          <span className="hidden sm:inline text-[11px] text-gray-500 border border-gray-700 rounded px-2 py-1">
            인허가 도서 반영 전 원문 대조 필수
          </span>
        </div>

        <nav className="flex gap-1 overflow-x-auto pb-2">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => onTabChange(i)}
              className={
                'shrink-0 px-3 py-1.5 rounded-t-md text-xs font-medium transition-colors border-b-2 ' +
                (activeTab === i
                  ? 'border-blue-500 text-white bg-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/50')
              }
            >
              <span>{t.label}</span>
              <span className="ml-1.5 text-[10px] text-gray-500">{t.hint}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
