import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useSolarMapperStore } from '@/features/solar-mapper/store/useSolarMapperStore';
import { useYieldSimulatorStore } from './useYieldSimulatorStore';
import { runYieldSimulation } from '../utils/yieldSimulationEngine';
import { DailySimulationSummary } from '../types/yieldSimulator';
import { LIFEPO4_ROUND_TRIP_EFFICIENCY } from '@/lib/solarConstants';

export function computeYieldSummarySnapshot(): DailySimulationSummary | undefined {
  const calcState = useCalculatorStore.getState();
  const simState = useYieldSimulatorStore.getState();
  const loadState = useApplianceLoadStore.getState();
  const mapperState = useSolarMapperStore.getState();
  const { calculationResult } = calcState;
  const { summary, battery } = calculationResult;
  const isHybrid = calculationResult.systemType === 'hybrid' && battery.hasBattery;

  return runYieldSimulation({
    pvArrayKwp: summary.totalArrayPowerKw || simState.pvArrayKwp,
    inverterKw: summary.inverterPowerKw || simState.inverterKw,
    batteryCapacityKwh: isHybrid ? Number((battery.totalEnergyWh / 1000).toFixed(2)) : 0,
    initialBatterySocPercent: simState.initialBatterySocPercent,
    minReserveSocPercent: simState.minReserveSocPercent,
    roundTripEfficiency: LIFEPO4_ROUND_TRIP_EFFICIENCY,
    maxBatteryCRate: 0.5,
    systemTopology: isHybrid ? 'hybrid' : 'grid_tie',
    isZeroExport: simState.isZeroExport,
    weatherScenario:
      simState.weatherScenario === 'live_open_meteo' ? 'clear_sky' : simState.weatherScenario,
    emsMode: simState.emsMode,
    peakSunHours: mapperState.getSelectedPsh(),
    latitude: mapperState.coordinates.lat,
    tariffPhpPerKwh: simState.tariffPhpPerKwh,
    brownout: simState.brownout,
    instantBlackoutActive: false,
    currentStepIndex: simState.currentStepIndex,
    appliances: loadState.items,
    disabledApplianceIds: simState.disabledApplianceIds,
    forcedOnApplianceIds: simState.forcedOnApplianceIds,
    shiftedToMiddayIds: simState.shiftedToMiddayIds,
  });
}
