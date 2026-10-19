import { renderCommunityShift } from '../../ui/communityShiftUi.js';
import { renderRecoveryCircuit } from '../../ui/recoveryCircuitUi.js';
import { renderVillageImpact } from '../../ui/villageImpactUi.js';
import { renderBrokenSeparator } from '../../ui/brokenSeparatorUi.js';
import { renderFieldReport } from '../../ui/fieldReportUi.js';

export function renderCommunity(scene) {
  ({ schedule: renderCommunityShift, circuit: renderRecoveryCircuit, impact: renderVillageImpact, diagnose: renderBrokenSeparator, report: renderFieldReport }[scene.gameDefinition.kind])(scene);
}