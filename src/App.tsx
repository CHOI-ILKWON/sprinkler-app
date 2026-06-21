import { useState } from 'react';
import Nav from './components/Nav';
import GuideTab from './components/tabs/GuideTab';
import SelectTab from './components/tabs/SelectTab';
import RoomTab from './components/tabs/RoomTab';
import PipeTab from './components/tabs/PipeTab';
import HydraulicTab from './components/tabs/HydraulicTab';
import ReportTab from './components/tabs/ReportTab';
import type {
  DesignCondition,
  SystemResult,
  Room,
  RoomPlacement,
  PipeCalcResult,
  HydraulicResult,
  WarehouseCheck,
  WorstHead,
} from './types';

const DEFAULT_CONDITION: DesignCondition = {
  usage: 'office',
  temp: 'normal',
  ceiling: 3,
  damage: 'normal',
  fire: 'slow',
  totalArea: 500,
};

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [condition, setCondition] = useState<DesignCondition>(DEFAULT_CONDITION);
  const [systemResult, setSystemResult] = useState<SystemResult | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [placements, setPlacements] = useState<RoomPlacement[]>([]);
  const [pipeResult, setPipeResult] = useState<PipeCalcResult | null>(null);
  const [hydraulicResult, setHydraulicResult] = useState<HydraulicResult | null>(null);
  const [worstHead, setWorstHead] = useState<WorstHead | null>(null);

  const currentSystem = systemResult?.system ?? 'wet';
  const zones = systemResult?.warehouseCheck?.zones;
  const warehouseCheck: WarehouseCheck | null = systemResult?.warehouseCheck ?? null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Nav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 0 && <GuideTab />}

        {activeTab === 1 && (
          <SelectTab
            condition={condition}
            setCondition={setCondition}
            result={systemResult}
            setResult={setSystemResult}
            rooms={rooms}
          />
        )}

        {activeTab === 2 && (
          <RoomTab
            rooms={rooms}
            setRooms={setRooms}
            placements={placements}
            setPlacements={setPlacements}
            system={currentSystem}
            zones={zones}
            pipeResult={pipeResult}
            worstHead={worstHead}
            onWorstHeadChange={setWorstHead}
          />
        )}

        {activeTab === 3 && (
          <PipeTab
            rooms={rooms}
            system={currentSystem}
            result={pipeResult}
            setResult={setPipeResult}
            zones={zones}
          />
        )}

        {activeTab === 4 && (
          <HydraulicTab
            pipeResult={pipeResult}
            systemResult={systemResult}
            rooms={rooms}
            worstHead={worstHead}
            onResult={setHydraulicResult}
          />
        )}

        {activeTab === 5 && (
          <ReportTab
            systemResult={systemResult}
            rooms={rooms}
            pipeResult={pipeResult}
            hydraulicResult={hydraulicResult}
            warehouseCheck={warehouseCheck}
          />
        )}
      </main>
    </div>
  );
}
