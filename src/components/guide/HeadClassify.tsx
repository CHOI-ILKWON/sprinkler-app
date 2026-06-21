import Table from '../ui/Table';

export default function HeadClassify() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">위험등급별 헤드 설치 기준 (NFPC 103 제10조)</h3>
      <Table
        headers={['위험등급', '표준 방호면적 (㎡/개)', '헤드간격 (m)', '방수량 (LPM/개)', '적용 예']}
        rows={[
          ['경급',    '20.9', '4.6', '80',  '사무실, 호텔 객실, 아파트'],
          ['중급 I',  '12.1', '4.0', '114', '판매시설, 주차장, 복합건물'],
          ['중급 II', '9.3',  '3.7', '114', '창고(일반), 공장(무위험)'],
          ['상급',    '9.3',  '3.1', '189', '창고(랙식), 공장(위험)'],
        ]}
      />
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-400 space-y-1">
        <div className="font-semibold text-gray-300">헤드 설치 규정 (NFPC 103 제10조)</div>
        <div>• 반사판~천장면: 30mm~60mm 이내</div>
        <div>• 벽~첫번째 헤드: 헤드 간격의 ½ 이내</div>
        <div>• 장애물~헤드: 60cm 이상</div>
        <div>• 가지관당 헤드: 최대 8개 (NFPC 103 제6조②)</div>
      </div>
    </div>
  );
}
