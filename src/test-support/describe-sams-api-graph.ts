import { afterAll, afterEach, beforeAll, describe, it } from "vite-plus/test";
import type { SamsClient } from "../create-sams-client";
import { createSamsApiGraphContext } from "./sams-api-graph-context";
import { SAMS_API_GRAPH_STEPS } from "./sams-api-graph-steps";

export type DescribeSamsApiGraphOptions = {
  suiteName: string;
  createClient: () => SamsClient;
  timeoutMs?: number;
  beforeSuite?: () => void | Promise<void>;
  afterSuite?: () => void | Promise<void>;
  afterEach?: () => void;
};

/**
 * Registers one Vitest case per SAMS GET endpoint in dependency order.
 * Shared context (discovered UUIDs) flows from earlier cases to later ones.
 */
export function describeSamsApiGraphSuite(options: DescribeSamsApiGraphOptions): void {
  describe(options.suiteName, () => {
    let sams: SamsClient;
    const ctx = createSamsApiGraphContext();
    const timeout = options.timeoutMs ?? 60_000;

    beforeAll(async () => {
      await options.beforeSuite?.();
      sams = options.createClient();
    });

    afterEach(() => {
      options.afterEach?.();
    });

    afterAll(() => {
      options.afterSuite?.();
    });

    for (const step of SAMS_API_GRAPH_STEPS) {
      it(
        step.name,
        async () => {
          await step.run(sams, ctx);
        },
        timeout,
      );
    }
  });
}
