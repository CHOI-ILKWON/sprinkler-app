import type { RiskLevel, SystemType, HeadSpec } from '../types';
import { RISK_TABLE } from '../constants/nfpc';

export function selectHead(risk: RiskLevel, system: SystemType): HeadSpec {
  const flow = RISK_TABLE[risk].flow;

  if (system === 'deluge') {
    return {
      type: '개방형',
      responseType: '개방형',
      rti: '해당없음',
      orifice: '15mm (K=80)',
      temp: '해당없음',
      flowPerHead: flow,
    };
  }

  if (system === 'dry') {
    return {
      type: '폐쇄형 상향',
      responseType: risk === 'extra' ? '조기반응' : '표준반응',
      rti: risk === 'extra' ? 'RTI 50 이하' : 'RTI 80~350',
      orifice: '15mm (K=80)',
      temp: '68°C (적색 글라스벌브)',
      flowPerHead: flow,
    };
  }

  if (risk === 'extra') {
    return {
      type: 'ESFR 하향',
      responseType: 'ESFR',
      rti: 'RTI 28 이하',
      orifice: '20mm (K=200)',
      temp: '74°C (적색)',
      flowPerHead: flow,
    };
  }

  return {
    type: '폐쇄형 하향',
    responseType: risk === 'light' ? '표준반응' : '조기반응',
    rti: risk === 'light' ? 'RTI 80~350' : 'RTI 50 이하',
    orifice: '15mm (K=80)',
    temp: '68°C (적색 글라스벌브)',
    flowPerHead: flow,
  };
}
