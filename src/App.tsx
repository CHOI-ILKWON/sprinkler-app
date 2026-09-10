import { useMemo, useState } from 'react';
import Nav from './components/Nav';
import GuideTab from './components/tabs/GuideTab';
import SelectTab from './components/tabs/SelectTab';
import WaterTab from './components/tabs/WaterTab';
import RoomTab from './components/tabs/RoomTab';
import PipeTab from './components/tabs/PipeTab';
import DelugeTab from './components/tabs/DelugeTab';
import DryVolumeTab from './components/tabs/DryVolumeTab';
import HydraulicTab from './components/tabs/HydraulicTab';
import ReportTab from './components/tabs/ReportTab';
import { placeHeads } from './lib/headPlacer';
import { calcZones } from './lib/zoneCalc';
import type {
  DesignCondition,
  SystemResult,
  Room,
  RoomPlacement,
  PipeCalcResult,
  HydraulicResult,
  WaterSupplyResult,
  DryVolumeResult,
  WorstHead,
} from './types';

const DEFAULT_CONDITION: DesignCondition = {
  standard: 'nftc103',
  suctionType: 'flooded',
  placeCategoryId: 'other_h8_under',
  usage: 'general_h8_under',
  fireproof: true,
  temp: 'normal',
  coldStorage: false,
  unheatedWarehouse: false,
  ceiling: 3,
  damage: 'normal',
  gridPipe: false,
  totalArea: 500,
};

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [condition, setCondition] = useState<DesignCondition>(DEFAULT_CONDITION);
  const [systemResult, setSystemResult] = useState<SystemResult | null>(null);
  const [waterSupply, setWaterSupply] = useState<WaterSupplyResult | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pipeResult, setPipeResult] = useState<PipeCalcResult | null>(null);
  const [dryVolume, setDryVolume] = useState<DryVolumeResult | null>(null);
  const [hydraulicResult, setHydraulicResult] = useState<HydraulicResult | null>(null);
  const [worstHead, setWorstHead] = useState<WorstHead | null>(null);

  const system = systemResult?.system ?? 'wet';

  // 실 목록·조건이 바뀌면 배치를 항상 다시 계산한다 (수동 동기화 제거)
  const placements: RoomPlacement[] = useMemo(
    () => rooms.map(r => placeHeads(r, system, condition.standard, condition.fireproof)),
    [rooms, system, condition.standard, condition.fireproof],
  );

  const zoneCheck = useMemo(
    () =>
      rooms.length > 0
        ? calcZones(
            rooms,
            placements,
            system,
            condition.standard,
            condition.gridPipe,
            waterSupply?.designFlowLPM,
          )
        : null,
    [rooms, placements, system, condition.standard, condition.gridPipe, waterSupply],
  );

  const totalHeads = placements.reduce((s, p) => s + p.heads, 0);

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
          />
        )}

        {activeTab === 2 && (
          <WaterTab
            condition={condition}
            installedHeads={totalHeads}
            result={waterSupply}
            setResult={setWaterSupply}
          />
        )}

        {activeTab === 3 && (
          <RoomTab
            rooms={rooms}
            setRooms={setRooms}
            placements={placements}
            condition={condition}
            system={system}
            zoneCheck={zoneCheck}
            pipeResult={pipeResult}
            worstHead={worstHead}
            onWorstHeadChange={setWorstHead}
          />
        )}

        {activeTab === 4 && (
          <PipeTab
            rooms={rooms}
            placements={placements}
            condition={condition}
            system={system}
            waterSupply={waterSupply}
            zoneCheck={zoneCheck}
            result={pipeResult}
            setResult={setPipeResult}
          />
        )}

        {activeTab === 5 && <DelugeTab system={system} />}

        {activeTab === 6 && (
          <DryVolumeTab
            system={system}
            protectedArea={rooms.reduce((s, r) => s + r.w * r.d, 0)}
            result={dryVolume}
            setResult={setDryVolume}
          />
        )}

        {activeTab === 7 && (
          <HydraulicTab
            pipeResult={pipeResult}
            waterSupply={waterSupply}
            placements={placements}
            worstHead={worstHead}
            onResult={setHydraulicResult}
          />
        )}

        {activeTab === 8 && (
          <ReportTab
            condition={condition}
            systemResult={systemResult}
            waterSupply={waterSupply}
            rooms={rooms}
            pipeResult={pipeResult}
            hydraulicResult={hydraulicResult}
            dryVolume={dryVolume}
            zoneCheck={zoneCheck}
          />
        )}
      </main>
    </div>
  );
}
