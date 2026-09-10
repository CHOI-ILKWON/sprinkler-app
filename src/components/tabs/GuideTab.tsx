import {
  STANDARD_HEAD_COUNT,
  STANDARD_HEAD_COUNT_LAW,
  STANDARD_HEAD_COUNT_NOTE,
  PIPE_SIZES_2533,
  PIPE_TABLE_2533,
  PIPE_TABLE_LAW,
  PIPE_TABLE_NOTES,
  ZONE_LIMIT,
  DELUGE_ZONE_LIMIT,
  DRY_SYSTEM_VOLUME,
  BRANCH_HEAD_LIMIT,
  TEMPERATURE_TABLE,
  TEMPERATURE_TABLE_LAW,
  TEMPERATURE_FACTORY_NOTE,
  WATER_SUPPLY,
  PARKING_RULE,
  UPRIGHT_HEAD_RULE,
  RELATED_STANDARDS,
  KFS_1013_NOTE,
  ESFR,
  START_DEVICE,
  JOCKEY_SIZING,
  PRESSURE_ZONE,
  PRESSURE_REDUCING_METHODS,
  PRV_NAMING_WARNING,
  maxZoneHeight,
} from '../../constants/nfpc';

const SYSTEMS = [
  {
    name: '습식',
    en: 'Wet pipe',
    second: '가압수',
    head: '폐쇄형',
    trigger: '헤드 개방',
    law: 'NFTC 103 1.7.1.23',
    note: '가장 빠르고 단순. 국내 기본값. 동결 우려 장소에는 불가.',
  },
  {
    name: '건식',
    en: 'Dry pipe',
    second: '압축공기 또는 질소',
    head: '폐쇄형 (상향식 원칙)',
    trigger: '헤드 개방 → 공기 배출 → 1차측 수압으로 밸브 작동',
    law: 'NFTC 103 1.7.1.26',
    note: `2차측 내용적 ${DRY_SYSTEM_VOLUME.liters.toLocaleString()} L 초과 시 1분 이내 방수 입증 필요 (${DRY_SYSTEM_VOLUME.law}). 면적 기준이 아님.`,
  },
  {
    name: '준비작동식',
    en: 'Preaction',
    second: '대기압 또는 저압',
    head: '폐쇄형 (상향식 원칙)',
    trigger: '감지기 작동 → 밸브 개방 → 헤드 개방 시 방수',
    law: 'NFTC 103 1.7.1.25',
    note: '감지기와 헤드의 이중 동작. 화재감지회로는 교차회로방식이 원칙이나 2.6.3.2 단서에 예외 2가지.',
  },
  {
    name: '부압식',
    en: 'Vacuum',
    second: '부압수',
    head: '폐쇄형',
    trigger: '감지기 작동으로 정압 전환 후 유수 발생',
    law: 'NFTC 103 1.7.1.24',
    note: '조기반응형 헤드 설치 시 습식 또는 부압식이어야 함 (2.3.1.7).',
  },
  {
    name: '일제살수식',
    en: 'Deluge',
    second: '대기압',
    head: '개방형',
    trigger: '감지기 작동 → 방수구역 전체 동시 방수',
    law: 'NFTC 103 1.7.1.27 / 2.7.4',
    note: `하나의 방수구역 헤드 ${DELUGE_ZONE_LIMIT.maxHeads}개 이하 (2구역 분할 시 각 ${DELUGE_ZONE_LIMIT.minHeadsWhenSplit}개 이상).`,
  },
];

export default function GuideTab() {
  return (
    <div className="space-y-8">
      <section className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h2 className="text-base font-bold text-white mb-2">이 도구의 계산 근거</h2>
        <ul className="text-xs text-gray-300 space-y-1 leading-relaxed">
          <li>· 스프링클러설비의 화재안전기술기준(NFTC 103) — 국립소방연구원공고 제2023-48호, 2024. 1. 1. 시행</li>
          <li>· 창고시설의 화재안전성능기준(NFPC 609) — 소방청고시 제2023-39호, 2024. 1. 1. 시행</li>
          <li>· 소방시설 설치 및 관리에 관한 법률 시행령 별표 4 제1호라목 — 설치대상</li>
          <li>· 화재의 예방 및 안전관리에 관한 법률 시행령 별표 2 — 특수가연물</li>
        </ul>
        <p className="text-[11px] text-yellow-300 mt-3 leading-relaxed">
          국내 기준은 「기준개수 × 방수량」 방식입니다. 위험등급(경급·중급·상급)·살수밀도·설계면적으로 유량을 정하는
          것은 NFPA 13 계열이며, 국내 법정기준에는 위험등급 개념이 없습니다. {KFS_1013_NOTE}
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white mb-3">설비 방식</h2>
        <div className="overflow-x-auto border border-gray-700 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="text-left px-3 py-2">방식</th>
                <th className="text-left px-3 py-2">2차측</th>
                <th className="text-left px-3 py-2">헤드</th>
                <th className="text-left px-3 py-2">방수 조건</th>
                <th className="text-left px-3 py-2">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {SYSTEMS.map(s => (
                <tr key={s.name} className="align-top">
                  <td className="px-3 py-2 text-gray-100 font-semibold whitespace-nowrap">
                    {s.name}
                    <span className="block text-[10px] text-gray-500 font-mono">{s.en}</span>
                    <span className="block text-[10px] text-blue-300 font-mono">{s.law}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{s.second}</td>
                  <td className="px-3 py-2 text-gray-300">{s.head}</td>
                  <td className="px-3 py-2 text-gray-400">{s.trigger}</td>
                  <td className="px-3 py-2 text-gray-400 leading-relaxed">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
          방호구역: 폐쇄형은 모두 <b>{ZONE_LIMIT.areaMax.toLocaleString()} ㎡ 이하</b>(격자형 배관방식은{' '}
          {ZONE_LIMIT.areaMaxGridPipe.toLocaleString()} ㎡ 범위 내 수리계산) — {ZONE_LIMIT.law}. 방식별로 면적 한도가
          다르지 않습니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white mb-3">{STANDARD_HEAD_COUNT_LAW}</h2>
        <div className="overflow-x-auto border border-gray-700 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="text-left px-3 py-2">설치장소</th>
                <th className="text-left px-3 py-2">기준개수</th>
                <th className="text-left px-3 py-2">수원 (× 1.6 ㎥)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {STANDARD_HEAD_COUNT.map(p => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-gray-300 leading-relaxed">
                    <span className="block text-[10px] text-gray-500">{p.group}</span>
                    {p.detail}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-100">{p.count}개</td>
                  <td className="px-3 py-2 font-mono text-gray-300">{(p.count * 1.6).toFixed(1)} ㎥</td>
                </tr>
              ))}
              <tr className="bg-blue-950/30">
                <td className="px-3 py-2 text-blue-200">창고시설 (NFPC 609 제7조②1) — 라지드롭형</td>
                <td className="px-3 py-2 font-mono text-blue-100">30개</td>
                <td className="px-3 py-2 font-mono text-blue-100">
                  96 ㎥ / 랙식 288 ㎥ (× {WATER_SUPPLY.nfpc609.coefficient} · {WATER_SUPPLY.nfpc609_rack.coefficient} ㎥)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">[비고] {STANDARD_HEAD_COUNT_NOTE}</p>
        <p className="text-[11px] text-yellow-300 mt-1 leading-relaxed">
          2024.1.1 개정으로 이 표에서 「창고」가 「공장」으로 축소되었고(NFPC 609 부칙 제3조①1), 아파트 등 공동주택은
          NFPC/NFTC 608 소관입니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white mb-3">{PIPE_TABLE_LAW}</h2>
        <div className="overflow-x-auto border border-gray-700 rounded-lg">
          <table className="w-full text-xs text-center">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="px-2 py-2 text-left">구분</th>
                {PIPE_SIZES_2533.map(s => (
                  <th key={s} className="px-2 py-2 font-mono">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(['가', '나', '다'] as const).map(col => (
                <tr key={col}>
                  <td className="px-2 py-2 text-left text-gray-100 font-semibold">{col}</td>
                  {PIPE_TABLE_2533[col].map((v, i) => (
                    <td key={i} className="px-2 py-2 font-mono text-gray-300">
                      {v === Infinity ? (col === '다' ? '91 이상' : '161 이상') : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 space-y-1">
          {PIPE_TABLE_NOTES.map((n, i) => (
            <li key={i} className="text-[11px] text-gray-400 leading-relaxed">{n}</li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-base font-bold text-white mb-3">헤드 수평거리 — NFTC 103 2.7.3</h2>
          <table className="w-full text-xs border border-gray-700 rounded-lg overflow-hidden">
            <tbody className="divide-y divide-gray-800">
              <Row k="무대부 · 특수가연물 저장·취급 장소" v="1.7 m 이하" law="2.7.3.1" />
              <Row k="그 밖의 특정소방대상물" v="2.1 m 이하" law="2.7.3.4" />
              <Row k="└ 내화구조인 경우" v="2.3 m 이하" law="2.7.3.4" />
              <Row k="구 랙식 창고 2.5 m" v="삭제" law="2.7.3.2 <삭제 2024.1.1>" />
              <Row k="구 아파트 등 3.2 m" v="삭제" law="2.7.3.3 <삭제 2024.1.1>" />
              <Row k="창고 라지드롭형" v="특수가연물 1.7 / 그 외 2.1 (내화 2.3) m" law="NFPC 609 제7조⑤1" />
            </tbody>
          </table>
          <p className="text-[11px] text-gray-500 mt-2">
            정방형 배치의 최대 간격 S = 2R·cos45° = 1.414 R. 이 값은 법에 명시된 것이 아니라 수평거리 R을 만족시키는
            기하학적 유도값입니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-3">{TEMPERATURE_TABLE_LAW}</h2>
          <table className="w-full text-xs border border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="text-left px-3 py-2">설치장소의 최고 주위온도</th>
                <th className="text-left px-3 py-2">표시온도</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {TEMPERATURE_TABLE.map((t, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-300">
                    {i === 0
                      ? `${t.ambientUnder} ℃ 미만`
                      : t.ambientUnder === Infinity
                        ? `${TEMPERATURE_TABLE[i - 1].ambientUnder} ℃ 이상`
                        : `${TEMPERATURE_TABLE[i - 1].ambientUnder} ℃ 이상 ${t.ambientUnder} ℃ 미만`}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-100">{t.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{TEMPERATURE_FACTORY_NOTE}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoBox title="가지배관 헤드 개수">
          <p>· 일반: 한쪽 {BRANCH_HEAD_LIMIT.nftc103.max}개 이하 — {BRANCH_HEAD_LIMIT.nftc103.law}</p>
          <p>· 창고시설: 한쪽 {BRANCH_HEAD_LIMIT.nfpc609.max}개 이하 — {BRANCH_HEAD_LIMIT.nfpc609.law}</p>
          <p className="text-gray-500">
            "교차배관에서 분기되는 지점을 기점으로 한쪽 가지배관"이 규정의 단위입니다. 교차배관 양쪽으로 갈라지면 한
            라인 합계는 그 2배가 될 수 있습니다.
          </p>
        </InfoBox>

        <InfoBox title="주차장 · 헤드 방향">
          <p>· {PARKING_RULE.rule} — {PARKING_RULE.law}</p>
          {PARKING_RULE.exceptions.map((e, i) => (
            <p key={i} className="text-gray-500">  다만 {e}</p>
          ))}
          <p className="pt-1">· {UPRIGHT_HEAD_RULE.rule} — {UPRIGHT_HEAD_RULE.law}</p>
          <p className="text-gray-500">  예외: {UPRIGHT_HEAD_RULE.exceptions.join(' / ')}</p>
        </InfoBox>

        <InfoBox title="건식 2차측 내용적">
          <p>· {DRY_SYSTEM_VOLUME.requirement}</p>
          <p className="text-blue-300 font-mono">{DRY_SYSTEM_VOLUME.law}</p>
          <p className="text-gray-500">
            면적(㎡)이 아니라 내용적(L)입니다. 배관 체적밀도는 구경 구성에 따라 크게 달라지므로 면적으로 고정하면
            양방향으로 틀립니다. 「건식 내용적」 탭에서 구경별 연장으로 집계하십시오.
          </p>
        </InfoBox>

        <InfoBox title="기동용수압개폐장치 vs 충압펌프 — 중복이 아닙니다">
          <p className="text-gray-300">· 기동용수압개폐장치 = <b>센서</b> — {START_DEVICE.role}</p>
          <p className="text-gray-300">· 충압펌프 = <b>액추에이터</b> — 실제로 물을 밀어 압력을 회복</p>
          <p className="text-gray-500">{START_DEVICE.capacityNote}</p>
          <p className="pt-1 text-gray-300">인출점 — {START_DEVICE.tapPoint}</p>
          <p className="text-yellow-300">⚠ {START_DEVICE.tapWarning}</p>
          <p className="text-gray-500 pt-1">
            압력챔버 100 L는 <b>{START_DEVICE.chamberLaw}</b> — 「중 압력챔버를 사용할 경우」이므로
            기동용압력스위치 방식이면 적용되지 않습니다.
          </p>
          <p className="text-gray-500">충압펌프 용량 — {JOCKEY_SIZING.rule}</p>
        </InfoBox>

        <InfoBox title="감압 — 하나의 존이 커버할 수 있는 높이">
          <table className="w-full">
            <thead className="text-gray-300">
              <tr>
                <th className="text-left py-1">설비</th>
                <th className="text-left py-1">방수압 범위</th>
                <th className="text-left py-1">이론 최대 존 높이</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {PRESSURE_ZONE.map(z => (
                <tr key={z.system}>
                  <td className="py-1 text-gray-300">{z.system}</td>
                  <td className="py-1 font-mono">{z.min} ~ {z.max} MPa</td>
                  <td className="py-1 font-mono text-gray-100">{maxZoneHeight(z.min, z.max).toFixed(0)} m</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-gray-500 pt-1">
            하나의 존은 <b>최상단이 최소압을, 최하단이 최대압을</b> 동시에 만족해야 합니다. 마찰손실·안전여유를 빼면
            실무 존 높이는 위 값의 60~70 % 수준입니다 ⚠. 옥내소화전이 스프링클러보다 스팬이 절반이라 존이 더 자주
            나뉩니다.
          </p>
          <p className="text-yellow-300 pt-1">⚠ {PRV_NAMING_WARNING}</p>
        </InfoBox>

        <InfoBox title="감압장치 — 어디에 다는가">
          {PRESSURE_REDUCING_METHODS.map(m => (
            <div key={m.method} className="pb-1">
              <p className="text-gray-200 font-semibold">{m.method}</p>
              <p className="text-gray-400">위치 — {m.where}</p>
              <p className="text-green-400">+ {m.pros}</p>
              <p className="text-red-400">− {m.cons}</p>
            </div>
          ))}
          <p className="text-gray-500">
            ⚠ NFTC 103은 방수압 상한(2.2.1.10)만 정하고 감압장치의 방법·위치를 규정하지 않습니다 — 설계자 판단입니다.
          </p>
        </InfoBox>

        <InfoBox title="ESFR — 랙식 창고의 대안">
          <p>· 천장 높이 {ESFR.maxCeilingHeight} m 이하인 랙식 창고에 설치 가능 — {ESFR.warehouseLaw}</p>
          <p>· 수원: 가장 먼 가지배관 {ESFR.simultaneousBranches}개 × 각 {ESFR.headsPerBranch}개 = {ESFR.simultaneousHeads}개 동시 개방, {ESFR.durationMinutes}분</p>
          <p>· 헤드 방호면적 {ESFR.headAreaMin} ~ {ESFR.headAreaMax} ㎡, 저장물 간격 {ESFR.storageClearanceMM} ㎜ 이상</p>
          <p className="text-gray-500">{ESFR.note}</p>
        </InfoBox>
      </section>

      <section>
        <h2 className="text-base font-bold text-white mb-3">함께 확인해야 하는 기준</h2>
        <div className="overflow-x-auto border border-gray-700 rounded-lg">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-800">
              {RELATED_STANDARDS.map(s => (
                <tr key={s.code} className="align-top">
                  <td className="px-3 py-2 text-blue-300 font-mono whitespace-nowrap">{s.code}</td>
                  <td className="px-3 py-2 text-gray-200">{s.title}</td>
                  <td className="px-3 py-2 text-gray-500 leading-relaxed">{s.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v, law }: { k: string; v: string; law: string }) {
  return (
    <tr>
      <td className="px-3 py-2 text-gray-300">{k}</td>
      <td className="px-3 py-2 font-mono text-gray-100 whitespace-nowrap">
        {v}
        <span className="block text-[10px] text-blue-300">{law}</span>
      </td>
    </tr>
  );
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      <div className="text-[11px] text-gray-400 space-y-1 leading-relaxed">{children}</div>
    </div>
  );
}
