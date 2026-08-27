type OperationObject = {
  responses?: Record<
    string,
    {
      content?: Record<string, { schema?: Record<string, unknown> }>;
    }
  >;
};

const HAL_JSON = "application/hal+json; charset=UTF-8";

function responseSchema(
  operation: OperationObject,
  status = "200",
): Record<string, unknown> | undefined {
  return operation.responses?.[status]?.content?.[HAL_JSON]?.schema;
}

function setResponseSchema(
  operation: OperationObject,
  schema: Record<string, unknown>,
  status = "200",
): void {
  const content = operation.responses?.[status]?.content?.[HAL_JSON];
  if (content) content.schema = schema;
}

/**
 * Operation-level OpenAPI patches applied before codegen.
 * Registry: src/upstream/bugs.ts · Live probes: src/upstream/bug-probes.ts
 */
export const operationPatches: Record<string, (operation: OperationObject) => void> = {
  // upstream: event-types-array-response (discovered 2026-08-27)
  "GET /event-types": (operation) => {
    const schema = responseSchema(operation);
    if (!schema?.$ref) return;
    setResponseSchema(operation, {
      type: "array",
      items: schema,
    });
  },
};
