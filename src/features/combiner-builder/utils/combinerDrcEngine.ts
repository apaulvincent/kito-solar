// src/features/combiner-builder/utils/combinerDrcEngine.ts
import {
  CombinerComponentInstance,
  CombinerWireConnection,
  DrcDiagnostic,
  TerminalPort,
  WireGaugeMm2,
} from '../types';

export interface DrcEvaluationResult {
  diagnostics: DrcDiagnostic[];
  errorCount: number;
  warningCount: number;
  passCount: number;
  isNormal: boolean;
}

/**
 * Evaluates the full electrical wiring graph inside the combiner box.
 */
export function evaluateCombinerWiringDRC(
  components: CombinerComponentInstance[],
  wires: CombinerWireConnection[],
): DrcEvaluationResult {
  const diagnostics: DrcDiagnostic[] = [];

  // Build quick port lookup map
  const portMap = new Map<string, { port: TerminalPort; component: CombinerComponentInstance }>();
  for (const comp of components) {
    for (const port of comp.ports) {
      portMap.set(port.id, { port, component: comp });
    }
  }

  // --- Rule 1: Check every wire for direct shorts or cross-domain issues ---
  wires.forEach((wire) => {
    const from = portMap.get(wire.fromPortId);
    const to = portMap.get(wire.toPortId);
    if (!from || !to) return;

    const { port: p1, component: c1 } = from;
    const { port: p2, component: c2 } = to;

    // 1.1: Cross Domain (AC <-> DC)
    if (
      (p1.domain === 'AC' && p2.domain === 'DC') ||
      (p1.domain === 'DC' && p2.domain === 'AC')
    ) {
      diagnostics.push({
        id: `drc_cross_domain_${wire.id}`,
        severity: 'error',
        code: 'CROSS_DOMAIN_AC_DC',
        title: 'AC and DC Domain Cross-Connection',
        description: `Wire connects AC port "${p1.label}" on ${c1.name} to DC port "${p2.label}" on ${c2.name}. AC and DC circuits must remain isolated.`,
        affectedIds: [wire.id, c1.id, c2.id],
      });
    }

    // 1.2: Direct Short Circuit (L to N, or DC+ to DC-)
    if (
      (p1.polarity === 'L' && p2.polarity === 'N') ||
      (p1.polarity === 'N' && p2.polarity === 'L') ||
      (p1.polarity === 'DC_POS' && p2.polarity === 'DC_NEG') ||
      (p1.polarity === 'DC_NEG' && p2.polarity === 'DC_POS')
    ) {
      // Don't flag if connecting to an internal sensing, protector, or meter coil that has both L and N inputs
      const isAcceptableInput =
        (c1.category === 'din_meter' && c2.category === 'din_meter') ||
        (c1.category === 'digital_protector' && c2.category === 'digital_protector') ||
        (p1.domain === 'CONTROL_SENSE' && p2.domain === 'CONTROL_SENSE');

      if (!isAcceptableInput) {
        diagnostics.push({
          id: `drc_short_circuit_${wire.id}`,
          severity: 'error',
          code: 'SHORT_CIRCUIT_LN',
          title: 'Direct Short Circuit Detected',
          description: `Wire bridges opposite polarities ("${p1.label}" and "${p2.label}") without load resistance. This will cause an explosive dead short upon energizing.`,
          affectedIds: [wire.id, c1.id, c2.id],
        });
      }
    }

    // 1.3: Wire Ampacity vs Breaker Rating
    const maxRatedAmps = Math.max(c1.ratedAmps, c2.ratedAmps);
    if (maxRatedAmps > 0 && p1.domain !== 'CONTROL_SENSE' && p2.domain !== 'CONTROL_SENSE' && p1.domain !== 'PE_GND') {
      const minGauge = getMinimumWireGaugeForAmps(maxRatedAmps);
      if (wire.gaugeMm2 < minGauge) {
        diagnostics.push({
          id: `drc_undersized_${wire.id}`,
          severity: 'warning',
          code: 'UNDERSIZED_WIRE_GAUGE',
          title: `Undersized Wire Gauge (${wire.gaugeMm2}mm²)`,
          description: `Connected to ${maxRatedAmps}A breaker (${c1.name} / ${c2.name}). Standard electrical code requires at least ${minGauge}mm² to prevent thermal melting under continuous load.`,
          affectedIds: [wire.id, c1.id, c2.id],
        });
      }
    }
  });

  // --- Rule 2: Unbonded SPD Check ---
  // Every AC and DC SPD must have its PE terminal connected to earth/ground busbar
  const spdComponents = components.filter(
    (c) => c.category === 'dc_spd' || c.category === 'ac_spd',
  );

  spdComponents.forEach((spd) => {
    const pePort = spd.ports.find((p) => p.polarity === 'PE');
    if (!pePort) return;

    const hasGroundWire = wires.some((w) => {
      const isFrom = w.fromPortId === pePort.id;
      const isTo = w.toPortId === pePort.id;
      if (!isFrom && !isTo) return false;
      const otherPortId = isFrom ? w.toPortId : w.fromPortId;
      const other = portMap.get(otherPortId);
      return other?.port.polarity === 'PE';
    });

    if (!hasGroundWire) {
      diagnostics.push({
        id: `drc_unbonded_spd_${spd.id}`,
        severity: 'warning',
        code: 'UNBONDED_SPD_PE',
        title: `Unbonded Surge Protector (${spd.name})`,
        description: `Surge Protective Device bottom PE terminal is not connected to the Ground Busbar. Lightning and grid transients will not be diverted safely away from equipment.`,
        affectedIds: [spd.id],
      });
    }
  });

  // --- Rule 3: ATS Voltage Sensing & Source Verification ---
  const atsComponents = components.filter(
    (c) => c.category === 'ats_cb' || c.category === 'ats_solenoid',
  );

  atsComponents.forEach((ats) => {
    // Check if source power inputs are connected
    const connectedPorts = new Set(
      wires.flatMap((w) => [w.fromPortId, w.toPortId]),
    );

    const sourceAPorts = ats.ports.filter((p) => p.id.includes('Source A') || p.id.includes('Normal') || p.label.includes('Source A') || p.label.includes('Normal'));
    const sourceBPorts = ats.ports.filter((p) => p.id.includes('Source B') || p.id.includes('Reserve') || p.label.includes('Source B') || p.label.includes('Reserve'));

    const hasSourceA = sourceAPorts.some((p) => connectedPorts.has(p.id));
    const hasSourceB = sourceBPorts.some((p) => connectedPorts.has(p.id));

    if (!hasSourceA || !hasSourceB) {
      diagnostics.push({
        id: `drc_ats_unconnected_${ats.id}`,
        severity: 'warning',
        code: 'MISSING_ATS_SENSE',
        title: 'ATS Input Sources Incomplete',
        description: `Dual-power transfer switch requires both Source A (Inverter) and Source B (Utility Grid) inputs connected to perform automatic fallback.`,
        affectedIds: [ats.id],
      });
    }

    // Check sense terminals if present
    const sensePorts = ats.ports.filter((p) => p.domain === 'CONTROL_SENSE');
    if (sensePorts.length > 0) {
      const wiredSenseCount = sensePorts.filter((p) => connectedPorts.has(p.id)).length;
      if (wiredSenseCount === 0) {
        diagnostics.push({
          id: `drc_ats_sense_${ats.id}`,
          severity: 'warning',
          code: 'MISSING_ATS_SENSE',
          title: 'ATS Control Sensing Not Wired',
          description: `The low-voltage sensing terminals on ${ats.name} detect grid availability. Wire thin 1.5mm² jumpers to input lines for automatic transfer capability.`,
          affectedIds: [ats.id],
        });
      }
    }
  });

  // Add positive validation checks if no critical errors found
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  if (errorCount === 0 && warningCount === 0 && components.length > 0 && wires.length > 0) {
    diagnostics.push({
      id: 'drc_all_clear',
      severity: 'pass',
      code: 'SHORT_CIRCUIT_LN',
      title: 'Electrical Parameters Normal',
      description: 'All circuit polarities, SPD ground bonding, and ATS sensing lines satisfy design rule criteria.',
      affectedIds: [],
    });
  }

  const passCount = diagnostics.filter((d) => d.severity === 'pass').length;

  return {
    diagnostics,
    errorCount,
    warningCount,
    passCount,
    isNormal: errorCount === 0,
  };
}

/**
 * Returns minimum standard gauge mm² for breaker rated amperes.
 */
export function getMinimumWireGaugeForAmps(ratedAmps: number): WireGaugeMm2 {
  if (ratedAmps >= 150) return 35;
  if (ratedAmps >= 100) return 25;
  if (ratedAmps >= 60) return 16;
  if (ratedAmps >= 40) return 10;
  if (ratedAmps >= 25) return 4;
  if (ratedAmps >= 15) return 2.5;
  return 1.5;
}
