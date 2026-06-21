import Table from '../ui/Table';

export default function ValveTable() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">배관경 선정 기준 (NFPC 103 별표1)</h3>
      <Table
        headers={['헤드 수', '배관 구경']}
        rows={[
          ['1개',     '25A (1")'],
          ['2개',     '32A (1¼")'],
          ['3~5개',   '40A (1½")'],
          ['6~10개',  '50A (2")'],
          ['11~30개', '65A (2½")'],
          ['31~60개', '80A (3")'],
          ['61~100개','100A (4")'],
          ['101~160개','125A (5")'],
          ['161개 이상','150A (6")'],
        ]}
      />
      <h3 className="text-sm font-semibold text-gray-300 pt-2">창고 방호구역 한도 (NFPC 103 제7~8조)</h3>
      <Table
        headers={['시스템', '밸브당 최대면적', '밸브당 최대헤드', '비고']}
        rows={[
          ['습식', '3,000㎡', '200개', 'NFPC 103 제7조②'],
          ['건식', '1,850㎡', '500개', '충수 60초 이내 NFPC 103 제8조③'],
        ]}
      />
    </div>
  );
}
