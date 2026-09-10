/**
 * 헤드 사양 선정
 *
 * 근거
 *  · NFTC 103 2.2.1.11   방수량 80 L/min 이상
 *  · NFPC 609 제7조③1    창고시설 160 L/min 이상 (라지드롭형)
 *  · NFTC 103 2.7.7.7    습식·부압식 외의 설비에는 상향식 헤드 (드라이펜던트·동파우려 없음·개방형 예외)
 *  · NFTC 103 2.7.5      조기반응형 헤드 설치장소
 *  · NFTC 103 2.7.6      표 2.7.6 표시온도
 *  · NFPC 609 제7조①1    창고시설은 라지드롭형
 */

import type { HeadSpec, SystemType, StandardCode } from '../types';
import { WATER_SUPPLY, TEMPERATURE_TABLE, ESFR } from '../constants/nfpc';

/** 표 2.7.6 — 최고 주위온도에 따른 표시온도 */
export function temperatureRating(ambientC: number): string {
  const row = TEMPERATURE_TABLE.find(r => ambientC < r.ambientUnder);
  return row ? row.rating : TEMPERATURE_TABLE[TEMPERATURE_TABLE.length - 1].rating;
}

export function selectHead(
  standard: StandardCode,
  system: SystemType,
  ambientC = 30,
  quickResponse = false,
): HeadSpec {
  const flowPerHead = WATER_SUPPLY[standard].flowPerHead;
  const temp = temperatureRating(ambientC);

  if (system === 'esfr') {
    return {
      type: '화재조기진압용 헤드 (ESFR)',
      responseType: '조기진압형',
      orifice: 'K계수는 천장높이·저장높이별 표에 따름 ⚠',
      temp,
      flowPerHead: 0,
      law: `${ESFR.law} / ${ESFR.warehouseLaw}`,
    };
  }

  if (system === 'deluge') {
    return {
      type: '개방형 스프링클러헤드',
      responseType: '감열체 없음',
      orifice: '표준형',
      temp: '해당 없음 (감열체 없음)',
      flowPerHead,
      law: 'NFTC 103 2.7.4 / 1.7.1.10',
    };
  }

  const isWarehouse = standard !== 'nftc103';
  const upright = system !== 'wet'; // 2.7.7.7 — 습식·부압식 외에는 상향식

  return {
    type: isWarehouse
      ? `라지드롭형 ${upright ? '상향식' : '하향식/상향식'}`
      : `표준형 폐쇄형 ${upright ? '상향식' : '하향식/상향식'}`,
    responseType: quickResponse ? '조기반응형 (2.7.5)' : '표준반응형',
    orifice: '표준형',
    temp,
    flowPerHead,
    law: isWarehouse
      ? 'NFPC 609 제7조①1 / NFTC 103 2.7.6'
      : `NFTC 103 2.7.6${upright ? ' / 2.7.7.7 (상향식)' : ''}`,
  };
}
