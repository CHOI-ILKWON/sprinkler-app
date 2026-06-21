import Table from '../ui/Table';

export default function SystemCompare() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">시스템 비교 요약</h3>
      <Table
        headers={['구분', '습식', '건식', '준비작동식', '일제살수식']}
        rows={[
          ['배관 충전물', '물', '압축공기', '공기(준비)', '없음(개방형)'],
          ['헤드 종류',   '폐쇄형', '폐쇄형', '폐쇄형', '개방형'],
          ['응동속도',    '최빠름', '느림(충수시간)', '중간', '즉시(전구역)'],
          ['오방수 위험', '중간', '낮음', '매우 낮음', '높음'],
          ['동결 대응',  '불가', '가능', '불가', '불가'],
          ['적용 법규',  '제7조', '제8조', '제7조의2', '제9조'],
        ]}
      />
    </div>
  );
}
