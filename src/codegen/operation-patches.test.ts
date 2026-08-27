import { describe, expect, it } from "vite-plus/test";
import { operationPatches } from "./operation-patches";

describe("operationPatches", () => {
  it("patches GET /event-types response to an array (bug #12)", () => {
    const operation = {
      responses: {
        "200": {
          content: {
            "application/hal+json; charset=UTF-8": {
              schema: { $ref: "#/components/schemas/EventType" },
            },
          },
        },
      },
    };

    operationPatches["GET /event-types"](operation);

    expect(
      operation.responses["200"].content["application/hal+json; charset=UTF-8"].schema,
    ).toEqual({
      type: "array",
      items: { $ref: "#/components/schemas/EventType" },
    });
  });
});
