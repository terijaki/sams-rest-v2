import type { SamsClient } from "../create-sams-client";
import { runSamsApiGraphSteps } from "./sams-api-graph-steps";

export { describeSamsApiGraphSuite } from "./describe-sams-api-graph";
export {
  listSamsApiGraphOperations,
  SAMS_API_GRAPH_STEPS,
  type SamsApiGraphStep,
} from "./sams-api-graph-steps";

/**
 * Walk the public SAMS GET graph through the bound SDK client.
 * Prefer `describeSamsApiGraphSuite` in tests for per-endpoint reporting.
 */
export async function walkSamsApiGraph(sams: SamsClient): Promise<void> {
  await runSamsApiGraphSteps(sams);
}
