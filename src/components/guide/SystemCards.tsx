import type { SystemType } from '../../types';

const SYSTEMS: { type: SystemType; label: string; icon: string; color: string; desc: string; pros: string[]; cons: string[] }[] = [
  {
    type: 'wet',
    label: '습식',
    icon: '💧',
    color: 'blue',
    desc: '배관 내 항상 물이 충전된 가장 일반적인 방식',
    pros: ['구조 단순, 유지관리 용이', '즉시 방수 — 응동시간 최단', '초기 공사비 저렴'],
    cons: ['동결 우려 공간 적용 불가', '수손 위험이 있는 공간 주의'],
  },
  {
    type: 'dry',
    label: '건식',
    icon: '💨',
    color: 'orange',
    desc: '배관 내 압축공기/질소 충전, 헤드 개방 시 공기 방출 후 물 방수',
    pros: ['동결 환경 적용 가능', '수손 위험 공간 주의 가능'],
    cons: ['충수시간 60초 이내 의무(NFPC 103 제8조③)', '가속기 설치 필요', '유지관리 복잡'],
  },
  {
    type: 'preaction',
    label: '준비작동식',
    icon: '⚙️',
    color: 'purple',
    desc: '화재감지기 신호 수신 후 준비작동밸브 개방, 오방수 방지',
    pros: ['수손 시 치명적 손실 공간 적합', '오방수 방지', '데이터센터·박물관 적합'],
    cons: ['구조 복잡, 공사비 고가', '감지기 연동 유지관리 필요'],
  },
  {
    type: 'deluge',
    label: '일제살수식',
    icon: '🌊',
    color: 'red',
    desc: '개방형 헤드 + 일제개방밸브, 구역 전체 동시 방수',
    pros: ['급속화재 억제에 효과적', '무대부 등 화재위험 높은 공간 적합'],
    cons: ['대량 방수 — 수손 및 배수계획 필수', '개방형 헤드 — 오작동 위험'],
  },
];

const COLOR_MAP: Record<string, string> = {
  blue:   'border-blue-600 bg-blue-900/20',
  orange: 'border-orange-600 bg-orange-900/20',
  purple: 'border-purple-600 bg-purple-900/20',
  red:    'border-red-600 bg-red-900/20',
};

export default function SystemCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {SYSTEMS.map(s => (
        <div key={s.type} className={`rounded-xl border p-5 ${COLOR_MAP[s.color]}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{s.icon}</span>
            <span className="font-bold text-white text-lg">{s.label}식</span>
          </div>
          <p className="text-gray-400 text-sm mb-3">{s.desc}</p>
          <div className="space-y-2">
            <div>
              <span className="text-green-400 text-xs font-semibold">✓ 장점</span>
              <ul className="text-xs text-gray-300 mt-1 space-y-0.5">
                {s.pros.map((p, i) => <li key={i}>• {p}</li>)}
              </ul>
            </div>
            <div>
              <span className="text-red-400 text-xs font-semibold">✗ 단점/주의</span>
              <ul className="text-xs text-gray-300 mt-1 space-y-0.5">
                {s.cons.map((c, i) => <li key={i}>• {c}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
