import SystemCards from '../guide/SystemCards';
import SystemCompare from '../guide/SystemCompare';
import HeadClassify from '../guide/HeadClassify';
import ValveTable from '../guide/ValveTable';

export default function GuideTab() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-bold text-white mb-4">스프링클러 시스템 종류</h2>
        <SystemCards />
      </section>

      <section>
        <SystemCompare />
      </section>

      <section>
        <HeadClassify />
      </section>

      <section>
        <ValveTable />
      </section>
    </div>
  );
}
