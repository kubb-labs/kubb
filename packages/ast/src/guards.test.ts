import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createFunctionParameter,
  createFunctionParameters,
  createInput,
  createOperation,
  createParameter,
  createParameterGroup,
  createProperty,
  createResponse,
  createSchema,
} from "./factory.ts";
import {
  isFunctionParameterNode,
  isFunctionParametersNode,
  isInputNode,
  isOperationNode,
  isParameterGroupNode,
  isParameterNode,
  isPropertyNode,
  isResponseNode,
  isSchemaNode,
  narrowSchema,
} from "./guards.ts";
import type { Node } from "./nodes/index.ts";
import type { OperationNode } from "./nodes/operation.ts";
import type { ParameterNode } from "./nodes/parameter.ts";
import type { PropertyNode } from "./nodes/property.ts";
import type { ResponseNode } from "./nodes/response.ts";
import type { InputNode } from "./nodes/root.ts";
import type {
  ObjectSchemaNode,
  SchemaNode,
  StringSchemaNode,
  UnionSchemaNode,
} from "./nodes/schema.ts";

describe("isInputNode", () => {
  it("returns true for InputNode", () => {
    expect(isInputNode(createInput())).toBe(true);
  });
  it("returns false for other nodes", () => {
    expect(isInputNode(createSchema({ type: "string" }))).toBe(false);
    expect(
      isInputNode(
        createOperation({ operationId: "op", method: "GET", path: "/" }),
      ),
    ).toBe(false);
  });
  it("narrows to InputNode in a conditional", () => {
    const node: Node = createInput();
    if (isInputNode(node)) {
      expectTypeOf(node).toEqualTypeOf<InputNode>();
    }
  });
});

describe("isOperationNode", () => {
  it("returns true for OperationNode", () => {
    expect(
      isOperationNode(
        createOperation({ operationId: "op", method: "GET", path: "/" }),
      ),
    ).toBe(true);
  });
  it("returns false for other nodes", () => {
    expect(isOperationNode(createInput())).toBe(false);
  });
  it("narrows to OperationNode in a conditional", () => {
    const node: Node = createOperation({
      operationId: "op",
      method: "GET",
      path: "/",
    });
    if (isOperationNode(node)) {
      expectTypeOf(node).toEqualTypeOf<OperationNode>();
    }
  });
});

describe("isSchemaNode", () => {
  it("returns true for SchemaNode", () => {
    expect(isSchemaNode(createSchema({ type: "string" }))).toBe(true);
  });
  it("returns false for other nodes", () => {
    expect(isSchemaNode(createInput())).toBe(false);
  });
  it("narrows to SchemaNode in a conditional", () => {
    const node: Node = createSchema({ type: "string" });
    if (isSchemaNode(node)) {
      expectTypeOf(node).toMatchTypeOf<SchemaNode>();
    }
  });
});

describe("isParameterNode", () => {
  it("returns true for ParameterNode", () => {
    expect(
      isParameterNode(
        createParameter({
          name: "id",
          in: "path",
          schema: createSchema({ type: "string" }),
        }),
      ),
    ).toBe(true);
  });
  it("returns false for other nodes", () => {
    expect(isParameterNode(createSchema({ type: "string" }))).toBe(false);
  });
  it("narrows to ParameterNode in a conditional", () => {
    const node: Node = createParameter({
      name: "id",
      in: "path",
      schema: createSchema({ type: "string" }),
    });
    if (isParameterNode(node)) {
      expectTypeOf(node).toEqualTypeOf<ParameterNode>();
    }
  });
});

describe("isPropertyNode", () => {
  it("returns true for PropertyNode", () => {
    expect(
      isPropertyNode(
        createProperty({
          name: "id",
          schema: createSchema({ type: "integer" }),
        }),
      ),
    ).toBe(true);
  });
  it("returns false for non-property nodes", () => {
    expect(isPropertyNode(createSchema({ type: "string" }))).toBe(false);
  });
  it("narrows to PropertyNode in a conditional", () => {
    const node: Node = createProperty({
      name: "id",
      schema: createSchema({ type: "integer" }),
    });
    if (isPropertyNode(node)) {
      expectTypeOf(node).toEqualTypeOf<PropertyNode>();
    }
  });
});

describe("isResponseNode", () => {
  it("returns true for ResponseNode", () => {
    expect(
      isResponseNode(
        createResponse({
          statusCode: "200",
          schema: createSchema({
            type: "string",
          }),
        }),
      ),
    ).toBe(true);
  });
  it("returns false for other nodes", () => {
    expect(isResponseNode(createInput())).toBe(false);
  });
  it("narrows to ResponseNode in a conditional", () => {
    const node: Node = createResponse({
      statusCode: "200",
      schema: createSchema({
        type: "string",
      }),
    });
    if (isResponseNode(node)) {
      expectTypeOf(node).toEqualTypeOf<ResponseNode>();
    }
  });
});

describe("type guards", () => {
  it("isFunctionParameterNode", () => {
    expect(
      isFunctionParameterNode(
        createFunctionParameter({ name: "x", optional: false }),
      ),
    ).toBe(true);
    expect(isFunctionParameterNode(createFunctionParameters())).toBe(false);
  });

  it("isParameterGroupNode", () => {
    expect(isParameterGroupNode(createParameterGroup({ properties: [] }))).toBe(
      true,
    );
    expect(
      isParameterGroupNode(
        createFunctionParameter({ name: "x", optional: false }),
      ),
    ).toBe(false);
  });

  it("isFunctionParametersNode", () => {
    expect(isFunctionParametersNode(createFunctionParameters())).toBe(true);
    expect(
      isFunctionParametersNode(
        createFunctionParameter({ name: "x", optional: false }),
      ),
    ).toBe(false);
  });
});

describe("narrowSchema", () => {
  it("returns the node when type matches", () => {
    const node = createSchema({ type: "object", properties: [] });
    const result = narrowSchema(node, "object");

    expect(result).toBe(node);
    expect(result?.type).toBe("object");
  });

  it("returns undefined when type does not match", () => {
    expect(
      narrowSchema(createSchema({ type: "string" }), "object"),
    ).toBeUndefined();
  });

  it("returns undefined when node is undefined", () => {
    expect(narrowSchema(undefined, "string")).toBeUndefined();
  });

  it('narrows return type to ObjectSchemaNode | undefined for "object"', () => {
    expectTypeOf(
      narrowSchema(createSchema({ type: "object" }), "object"),
    ).toEqualTypeOf<ObjectSchemaNode | undefined>();
  });

  it('narrows return type to StringSchemaNode | undefined for "string"', () => {
    expectTypeOf(
      narrowSchema(createSchema({ type: "string" }), "string"),
    ).toEqualTypeOf<StringSchemaNode | undefined>();
  });

  it('narrows return type to UnionSchemaNode | undefined for "union"', () => {
    expectTypeOf(
      narrowSchema(createSchema({ type: "union" }), "union"),
    ).toEqualTypeOf<UnionSchemaNode | undefined>();
  });
});
