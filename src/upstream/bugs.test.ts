import { describe, expect, it } from "vite-plus/test";
import { PROBED_UPSTREAM_BUGS, UPSTREAM_BUGS } from "./bugs";
import { PROBED_BUG_SLUGS } from "./bug-probes";

describe("upstream bug registry", () => {
  it("assigns unique ids and slugs", () => {
    const ids = UPSTREAM_BUGS.map((bug) => bug.id);
    const slugs = UPSTREAM_BUGS.map((bug) => bug.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps probed slugs aligned with the live probe runner", () => {
    expect(PROBED_BUG_SLUGS).toEqual(PROBED_UPSTREAM_BUGS.map((bug) => bug.slug));
  });
});
