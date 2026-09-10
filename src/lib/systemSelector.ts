/**
 * 스프링클러 방식 선정
 *
 * 선정 순서
 *   ① 법이 방식을 강제하는가  ② 배관이 얼 수 있는가  ③ 오방수 피해 > 화재 피해인가
 *   ①은 물리·경제 판단보다 항상 먼저다.
 *
 * 근거
 *  · NFTC 103 2.7.4      무대부 또는 연소할 우려가 있는 개구부 → 개방형 헤드
 *  · NFPC 609 제7조①1    창고시설 → 라지드롭형을 습식으로. 건식은 가·나목만 예외
 *  · NFPC 609 제7조①4    천장 높이 13.7 m 이하 랙식 창고 → ESFR 선택 가능
 *  · NFTC 103 2.5.15     주차장 → 습식 외의 방식 (2.5.15.1·2.5.15.2 예외)
 *  · NFTC 103 2.3.1.7    조기반응형 헤드 설치 시 → 습식유수검지장치 또는 부압식
 *  · NFTC 103 2.7.7.7    습식·부압식 외의 설비 → 상향식 헤드 (예외 3가지)
 *  · NFTC 103 2.6.3.2    준비작동식·일제살수식 화재감지회로는 교차회로. 단서 2가지 예외
 */

import type { DesignCondition, SystemResult, SystemType, ValveItem, LawCheck } from '../types';
import { SYSTEM_LABELS } from '../types';
import {
  PARKING_RULE,
  UPRIGHT_HEAD_RULE,
  QUICK_RESPONSE,
  ESFR,
  DRY_SYSTEM_VOLUME,
  ZONE_LIMIT,
  DELUGE_ZONE_LIMIT,
  MIN_PIPE_SIZE,
  PIPE_SLOPE,
  TAMPER_SWITCH_LAW,
  PUMP_ACCESSORY,
  WAREHOUSE_EMERGENCY_POWER,
} from '../constants/nfpc';

interface Mandate {
  system: SystemType;
  reason: string;
  law: string;
}

/** ① 법정 강제 판단 */
function checkMandate(c: DesignCondition): Mandate | null {
  if (c.usage === 'stage') {
    return {
      system: 'deluge',
      reason: '무대부 — 개방형 스프링클러헤드를 설치해야 함',
      law: 'NFTC 103 2.7.4',
    };
  }

  const isWarehouse = c.standard !== 'nftc103';
  if (isWarehouse) {
    if (c.coldStorage) {
      return {
        system: 'dry',
        reason: '냉동창고 또는 영하의 온도로 저장하는 냉장창고 — 건식 허용 (가목)',
        law: 'NFPC 609 제7조①1 가목',
      };
    }
    if (c.unheatedWarehouse) {
      return {
        system: 'dry',
        reason: '창고시설 내에 상시 근무자가 없어 난방을 하지 않는 창고시설 — 건식 허용 (나목)',
        law: 'NFPC 609 제7조①1 나목',
      };
    }
    return {
      system: 'wet',
      reason: '창고시설은 라지드롭형 스프링클러헤드를 습식으로 설치하는 것이 원칙',
      law: 'NFPC 609 제7조①1',
    };
  }

  if (c.usage === 'parking') {
    const exempt = c.temp === 'normal';
    if (exempt) {
      return {
        system: 'wet',
        reason:
          '주차장은 습식 외의 방식이 원칙이나, 동절기 상시 난방되거나 동결 우려가 없는 곳은 습식 가능 (2.5.15.1)',
        law: PARKING_RULE.law,
      };
    }
    return {
      system: 'dry',
      reason: '주차장의 스프링클러설비는 습식 외의 방식으로 해야 함',
      law: PARKING_RULE.law,
    };
  }

  return null;
}

export function selectSystem(c: DesignCondition): SystemResult {
  const mandate = checkMandate(c);
  let system: SystemType;
  let isMandated = false;
  let isManualOverride = false;
  const reasons: string[] = [];
  const laws: string[] = [];

  if (c.systemOverride) {
    system = c.systemOverride;
    isManualOverride = true;
    reasons.push(`사용자가 ${SYSTEM_LABELS[system]}을 직접 선택했습니다.`);
    if (mandate && mandate.system !== system) {
      reasons.push(
        `⚠ 법정 기준은 ${SYSTEM_LABELS[mandate.system]}입니다 — ${mandate.reason} (${mandate.law}). 다른 방식을 채택하려면 근거를 도서에 명시하고 관할 소방서와 협의하십시오.`,
      );
    }
  } else if (mandate) {
    system = mandate.system;
    isMandated = true;
    reasons.push(mandate.reason);
    laws.push(mandate.law);
  } else if (c.temp === 'freeze' || c.temp === 'cold') {
    system = 'dry';
    reasons.push('동결 우려가 있는 장소 — 배관 내 물이 얼면 습식은 물리적으로 불가');
    reasons.push('동결 방호구역만 분리하여 건식으로 하고 나머지는 습식으로 하는 것이 실무 정석입니다.');
  } else if (c.damage === 'critical' || c.damage === 'sensitive') {
    system = 'preaction';
    reasons.push(
      c.damage === 'critical'
        ? '오방수 시 치명적 손실이 예상되는 용도 — 감지기와 헤드의 이중 동작으로 오방수 방지'
        : '수손에 민감한 용도 — 준비작동식으로 오방수 위험을 낮춤',
    );
    reasons.push('※ 법정 강제가 아니라 설계 판단입니다. 채택 사유를 도서에 명시하십시오.');
  } else {
    system = 'wet';
    reasons.push('동결 우려가 없고 법정 강제 사유도 없음 — 국내 스프링클러의 기본값');
    reasons.push('가장 빠르고 단순하며 고장 지점이 적습니다.');
  }

  // ESFR 가능 여부 안내
  if (c.standard === 'nfpc609_rack' && c.ceiling <= ESFR.maxCeilingHeight && system !== 'esfr') {
    reasons.push(
      `천장 높이 ${c.ceiling} m ≤ ${ESFR.maxCeilingHeight} m — 화재조기진압용 스프링클러설비(ESFR)를 선택할 수 있습니다. ` +
        `랙식 창고의 수원 9.6 ㎥/개 및 랙 3 m마다의 인랙 헤드를 피할 수 있어 비교검토 가치가 큽니다.`,
    );
    laws.push(ESFR.warehouseLaw);
  }

  return {
    system,
    isMandated,
    isManualOverride,
    reasons,
    laws: [...laws, ...getLawsForSystem(system, c)],
    valves: getValveList(system),
    checks: buildChecks(system, c),
  };
}

function getLawsForSystem(system: SystemType, c: DesignCondition): string[] {
  const common = [
    'NFTC 103 2.3.1.1 — 하나의 방호구역 바닥면적 3,000 ㎡ 이하 (격자형 3,700 ㎡)',
    'NFTC 103 2.3.1.3 — 하나의 방호구역은 2개 층에 미치지 않을 것',
    'NFTC 103 2.3.1.4 — 유수검지장치 0.8~1.5 m, 출입문 0.5 m × 1 m, 「유수검지장치실」 표지',
    'NFTC 103 표 2.5.3.3 — 헤드 수별 급수관의 구경',
  ];

  if (c.standard === 'nftc103') {
    common.push('NFTC 103 2.5.9.2 — 한쪽 가지배관 헤드 8개 이하');
    common.push('NFTC 103 2.7.3 — 헤드 수평거리 1.7 / 2.1(내화 2.3) m');
  } else {
    common.push('NFPC 609 제7조④ — 창고시설 한쪽 가지배관 헤드 4개 이하 (NFTC 103 2.5.9.2의 8개가 아님)');
    common.push('NFPC 609 제7조⑤1 — 창고 라지드롭형 헤드 수평거리 1.7 / 2.1(내화 2.3) m');
    common.push(`${WAREHOUSE_EMERGENCY_POWER.law} — 비상전원 20분(랙식 60분) / 옥내소화전 40분`);
  }
  common.push(`${TAMPER_SWITCH_LAW} — 급수개폐밸브 작동표시 스위치(탬퍼스위치)`);

  switch (system) {
    case 'wet':
      return [...common, 'NFTC 103 2.5.12.1 — 시험장치는 유수검지장치 2차 측 배관에 연결', 'NFTC 103 2.5.17.1 — 습식·부압식 배관은 수평'];
    case 'dry':
      return [
        ...common,
        `${DRY_SYSTEM_VOLUME.law} — 2차측 내용적 ${DRY_SYSTEM_VOLUME.liters.toLocaleString()} L 초과 시 1분 이내 방수`,
        'NFTC 103 2.5.12.1 — 시험장치는 가장 먼 가지배관의 끝에서 연결',
        `NFTC 103 2.5.17.2 — 수평주행배관 1/${1 / PIPE_SLOPE.feedMain}, 가지배관 1/${1 / PIPE_SLOPE.branch} 이상 기울기`,
        UPRIGHT_HEAD_RULE.law + ' — 상향식 헤드 원칙',
      ];
    case 'preaction':
      return [
        ...common,
        'NFTC 103 2.5.11 — 2차측 배관 부대설비 (개폐표시형밸브·자동배수장치·압력스위치)',
        'NFTC 103 2.6.3.2 — 화재감지회로 교차회로방식 (단서 2가지 예외)',
        'NFTC 103 2.6.3.3 — 밸브 인근 수동기동(전기식 및 배수식)',
        UPRIGHT_HEAD_RULE.law + ' — 상향식 헤드 원칙',
      ];
    case 'deluge':
      return [
        ...common,
        `${DELUGE_ZONE_LIMIT.law} — 하나의 방수구역 헤드 ${DELUGE_ZONE_LIMIT.maxHeads}개 이하 (2구역 분할 시 각 ${DELUGE_ZONE_LIMIT.minHeadsWhenSplit}개 이상)`,
        'NFTC 103 2.7.4 — 무대부·연소할 우려가 있는 개구부는 개방형 헤드',
        'NFTC 103 2.5.11 — 2차측 배관 부대설비',
      ];
    case 'esfr':
      return [
        `${ESFR.law} — 화재조기진압용 스프링클러설비`,
        `${ESFR.warehouseLaw} — 천장 높이 13.7 m 이하 랙식 창고에 설치 가능`,
        'NFPC 609 제7조④ 단서 — ESFR 설치 시 가지배관 4개 제한 미적용',
      ];
  }
}

function buildChecks(system: SystemType, c: DesignCondition): LawCheck[] {
  const checks: LawCheck[] = [];

  checks.push({
    label: '적용 기준',
    actual: c.standard === 'nftc103' ? 'NFTC 103' : 'NFPC/NFTC 609 (창고시설)',
    standard: '창고시설은 2024.1.1부터 NFPC 609가 단독 규율',
    isPassing: true,
    law: 'NFPC 609 부칙 제3조①',
  });

  if (c.standard !== 'nftc103') {
    checks.push({
      label: '창고 설비방식',
      actual: SYSTEM_LABELS[system],
      standard: '라지드롭형을 습식으로. 건식은 냉동·냉장창고 또는 상시 근무자 없어 난방하지 않는 창고만',
      isPassing: system === 'wet' || system === 'esfr' || c.coldStorage || c.unheatedWarehouse,
      law: 'NFPC 609 제7조①1',
    });
  }

  if (c.usage === 'parking') {
    checks.push({
      label: '주차장 방식',
      actual: SYSTEM_LABELS[system],
      standard: PARKING_RULE.rule,
      isPassing: system !== 'wet' || c.temp === 'normal',
      isWarning: system === 'wet',
      law: PARKING_RULE.law,
    });
  }

  if (system !== 'wet' && system !== 'deluge') {
    checks.push({
      label: '헤드 방향',
      actual: '상향식 헤드 필요',
      standard: UPRIGHT_HEAD_RULE.rule + ` (예외: ${UPRIGHT_HEAD_RULE.exceptions.join(' / ')})`,
      isPassing: true,
      isWarning: true,
      law: UPRIGHT_HEAD_RULE.law,
    });
  }

  if (system === 'dry') {
    checks.push({
      label: '건식 2차측 내용적',
      actual: '배관 산출 후 확인 필요',
      standard: DRY_SYSTEM_VOLUME.requirement,
      isPassing: true,
      isWarning: true,
      law: DRY_SYSTEM_VOLUME.law,
    });
  }

  if (c.gridPipe) {
    checks.push({
      label: '격자형 배관방식',
      actual: `방호구역 ${ZONE_LIMIT.areaMaxGridPipe.toLocaleString()} ㎡까지 확대 적용`,
      standard: ZONE_LIMIT.gridPipeNote,
      isPassing: true,
      isWarning: true,
      law: ZONE_LIMIT.law,
    });
  }

  checks.push({
    label: '조기반응형 헤드 대상',
    actual: QUICK_RESPONSE.places.join(' / '),
    standard: QUICK_RESPONSE.linkedRule,
    isPassing: true,
    isWarning: true,
    law: `${QUICK_RESPONSE.law} / ${QUICK_RESPONSE.linkedLaw}`,
  });

  return checks;
}

/** 방식별 밸브·부속 목록 — 각 항목에 근거 조문을 붙인다 */
export function getValveList(system: SystemType, size = '100A'): ValveItem[] {
  const pumpCommon: ValveItem[] = [
    {
      icon: '🔩',
      name: '개폐표시형 밸브 + 탬퍼스위치',
      size,
      desc: '급수를 차단할 수 있는 개폐밸브는 개폐표시형. 흡입측은 버터플라이 외의 개폐표시형밸브',
      law: 'NFTC 103 2.5.3.2 / 2.5.16',
    },
    {
      icon: '↩️',
      name: '순환배관 + 릴리프밸브',
      size: `${MIN_PIPE_SIZE.circulation.mm} ㎜ 이상`,
      desc:
        '체절운전 시 수온 상승 방지. 「체크밸브와 펌프 사이」에서 분기 — 열이 갇히는 구간이 정확히 그 구간이기 때문. ' +
        '릴리프밸브는 「체절압력 미만」에서 개방되어야 하며(체절압 도달 전에 열려야 순환이 시작됨), 환수는 수조로. ' +
        '※ 대형 패키지의 주 릴리프밸브(PRV)나 웨이스트콘이 있어도 2.5.7의 순환배관이 면제되지 않습니다.',
      law: `NFTC 103 2.2.1.6 / ${MIN_PIPE_SIZE.circulation.law}`,
    },
    {
      icon: '📊',
      name: '성능시험배관 + 유량측정장치',
      size: '유량측정장치의 호칭지름에 따름',
      desc:
        '토출측 개폐밸브 「이전」에서 분기 — 계통을 잠근 채 펌프만 단독 시험하기 위함. 「직선으로」 설치(엘보 직후면 편류로 측정 오차). ' +
        '유량측정장치 기준 전단 직관부에 개폐밸브, 후단 직관부에 유량조절밸브 — 조절을 하류에서 해야 유량계에 난류·기포가 생기지 않음. ' +
        '직관부 거리는 제조사 설치사양. 유량측정장치는 정격토출량의 175 % 이상 측정 가능. 환수는 수조로(배수 방류 시 수원 손실).',
      law: 'NFTC 103 2.2.1.5 / 2.5.6.1 / 2.5.6.2',
    },
    {
      icon: '🫧',
      name: '기동용수압개폐장치 (압력챔버)',
      size: `${PUMP_ACCESSORY.pressureChamberLiters} L 이상`,
      desc: '배관 압력변동을 검지하여 펌프 자동 기동',
      law: PUMP_ACCESSORY.pressureChamberLaw,
    },
    {
      icon: '💧',
      name: '물올림장치 (부압수조 시)',
      size: `전용수조 ${PUMP_ACCESSORY.primingTankLiters} L 이상 / 급수배관 ${PUMP_ACCESSORY.primingSupplyMM} ㎜ 이상`,
      desc:
        '수원의 수위가 펌프보다 낮은 경우에만 설치. 후드밸브~임펠러 구간을 항상 물로 채워 마중물을 유지. ' +
        '물올림관 접속점은 「펌프와 토출측 체크밸브 사이」가 실무 정석 — 정지 시 밀폐구간의 최상부이고, ' +
        '운전 중에는 토출압이 물올림관 체크밸브를 닫아 탱크를 보호함. 흡입측에 접속하면 운전 중 부압으로 탱크가 빨려 비워짐. ' +
        '※ 법정 수치는 100 L와 급수배관 15 ㎜뿐 — 물올림관 25 ㎜·오버플로우 50 ㎜는 실무 관행값이며 접속 위치도 조문에 없음.',
      law: `${PUMP_ACCESSORY.primingLaw} / 감수경보는 2.10.2.4 · 2.10.3.8`,
    },
    {
      icon: '🧲',
      name: '여과장치(스트레이너)',
      size,
      desc: '펌프 흡입 측 배관은 공기 고임이 생기지 않는 구조로 하고 여과장치를 설치',
      law: 'NFTC 103 2.5.4.1',
    },
    {
      icon: '🚿',
      name: '송수구',
      size: '65 ㎜ 쌍구형',
      desc: '지면 0.5~1 m, 하나의 층 바닥면적 3,000 ㎡마다 1개(최대 5개), 부근에 자동배수밸브 및 체크밸브',
      law: 'NFTC 103 2.8.1',
    },
    {
      icon: '🧹',
      name: '청소구',
      size: `${MIN_PIPE_SIZE.flushingConnection.mm} ㎜ 이상`,
      desc: '교차배관 끝에 개폐밸브 설치, 호스접결이 가능한 나사식 또는 고정배수 배관식',
      law: MIN_PIPE_SIZE.flushingConnection.law,
    },
    {
      icon: '🕳️',
      name: '수직배수배관',
      size: `${MIN_PIPE_SIZE.drainRiser.mm} ㎜ 이상`,
      desc: '수직배관 구경이 50 ㎜ 미만이면 수직배관과 동일 구경 가능',
      law: MIN_PIPE_SIZE.drainRiser.law,
    },
  ];

  const testValve = (where: string): ValveItem => ({
    icon: '🧪',
    name: '시험장치',
    size: `${MIN_PIPE_SIZE.testConnection.mm} ㎜ 이상`,
    desc: `${where}. 끝에 개폐밸브 및 개방형헤드 또는 동등 방수성능 오리피스, 물받이 통 및 배수관`,
    law: 'NFTC 103 2.5.12',
  });

  switch (system) {
    case 'wet':
      return [
        { icon: '💦', name: '습식유수검지장치 (알람밸브)', size, desc: '방호구역마다 1개 이상, 바닥에서 0.8~1.5 m', law: 'NFTC 103 2.3.1.2 / 2.3.1.4' },
        { icon: '🔔', name: '압력스위치', size: '-', desc: '유수 검지 시 음향장치 경보 및 펌프 기동', law: 'NFTC 103 2.6.1.1 / 2.6.2.1' },
        testValve('습식·부압식은 유수검지장치 2차 측 배관에 연결'),
        ...pumpCommon,
      ];
    case 'dry':
      return [
        { icon: '💨', name: '건식유수검지장치', size, desc: '2차측에 압축공기 또는 질소 충전', law: 'NFTC 103 1.7.1.26 / 2.3.1.2' },
        { icon: '🌡️', name: '공기압축기 · 공기공급장치', size: '-', desc: '2차측 압력 유지 (국내 기준에 용량 규정 없음 — 시방 사항 ⚠)', law: '설계 시방' },
        { icon: '🔔', name: '압력스위치', size: '-', desc: '유수 검지 시 경보 및 펌프 기동', law: 'NFTC 103 2.6.1.1' },
        testValve('건식은 유수검지장치에서 가장 먼 거리에 위치한 가지배관의 끝에서 연결'),
        {
          icon: '⏱️',
          name: '2차측 내용적 관리',
          size: `${DRY_SYSTEM_VOLUME.liters.toLocaleString()} L`,
          desc: DRY_SYSTEM_VOLUME.requirement,
          law: DRY_SYSTEM_VOLUME.law,
        },
        { icon: '🚱', name: '자동배수밸브', size: '-', desc: '잔류수 배출 — 동결 방지', law: 'NFTC 103 2.5.17.2 / 2.8.1.7' },
        ...pumpCommon,
      ];
    case 'preaction':
      return [
        { icon: '⚙️', name: '준비작동식유수검지장치', size, desc: '2차측은 대기압 또는 저압', law: 'NFTC 103 1.7.1.25 / 2.3.1.2' },
        { icon: '🔌', name: '솔레노이드밸브', size: '-', desc: '감지기 신호로 중간챔버 감압 → 클래퍼 개방', law: 'NFTC 103 2.6.3.1' },
        { icon: '🔥', name: '화재감지기 (교차회로)', size: '-', desc: '인접한 2 이상의 감지기가 동시 감지 시 개방. 단서 2가지 예외 有', law: 'NFTC 103 2.6.3.2' },
        { icon: '🖐️', name: '수동기동장치 (SVP)', size: '-', desc: '밸브 인근에서 전기식 및 배수식으로 개방 가능', law: 'NFTC 103 2.6.3.3' },
        { icon: '🚰', name: '2차측 부대설비', size: '-', desc: '개폐표시형밸브 · 수직배수배관 연결 · 자동배수장치 및 압력스위치', law: 'NFTC 103 2.5.11' },
        testValve('준비작동식은 2.5.12의 시험장치 대상이 아니며 2.5.11.2.2의 압력스위치로 확인'),
        ...pumpCommon,
      ];
    case 'deluge':
      return [
        { icon: '🌊', name: '일제개방밸브', size, desc: '방수구역마다 설치. 표지는 「일제개방밸브실」', law: 'NFTC 103 2.4.1.2 / 2.4.1.4' },
        { icon: '🔥', name: '화재감지기', size: '-', desc: '감지기 동작에 따라 개방 및 작동', law: 'NFTC 103 2.6.3.1' },
        { icon: '🖐️', name: '수동기동장치', size: '-', desc: '밸브 인근 수동기동(전기식 및 배수식)', law: 'NFTC 103 2.6.3.3' },
        { icon: '🎛️', name: '감시제어반 수동조작스위치', size: '-', desc: '일제개방밸브를 개방시킬 수 있는 수동조작스위치', law: 'NFTC 103 2.10.3.6' },
        { icon: '🚰', name: '2차측 부대설비', size: '-', desc: '개폐표시형밸브 · 자동배수장치 및 압력스위치', law: 'NFTC 103 2.5.11' },
        ...pumpCommon,
      ];
    case 'esfr':
      return [
        { icon: '⚡', name: '화재조기진압용 스프링클러설비', size, desc: ESFR.note, law: ESFR.law },
        { icon: '💦', name: '습식유수검지장치', size, desc: '방호구역마다 1개 이상', law: 'NFTC 103 2.3.1.2' },
        testValve('유수검지장치 2차 측 배관에 연결'),
        ...pumpCommon,
      ];
  }
}
