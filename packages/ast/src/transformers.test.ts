import { describe, expect, it } from "vitest";
import { createProperty, createSchema } from "./factory.ts";
import type { SchemaNode } from "./nodes/schema.ts";
import {
  mergeAdjacentObjects,
  setDiscriminatorEnum,
  setEnumName,
  simplifyUnion,
} from "./transformers.ts";

describe("setDiscriminatorEnum", () => {
  function makeObjectNode(propNames: Array<string>, name?: string): SchemaNode {
    return createSchema({
      type: "object",
      name,
      properties: propNames.map((prop) =>
        createProperty({
          name: prop,
          schema: createSchema({ type: "string" }),
        }),
      ),
    });
  }

  const baseNode = makeObjectNode(["type", "name"], "Pet");

  it("returns the original node when input is not an object schema", () => {
    const node = createSchema({ type: "string" });
    const result = setDiscriminatorEnum({
      node,
      propertyName: "type",
      values: ["dog"],
    });

    expect(result).toBe(node);
  });

  it("returns the original node when the target property is missing", () => {
    const result = setDiscriminatorEnum({
      node: baseNode,
      propertyName: "kind",
      values: ["dog"],
    });

    expect(result).toBe(baseNode);
  });

  it("returns the original node when object properties are empty", () => {
    const node = createSchema({ type: "object", properties: [] });
    const result = setDiscriminatorEnum({
      node,
      propertyName: "type",
      values: ["dog"],
    });

    expect(result).toBe(node);
  });

  it("replaces the discriminator property with an unnamed enum for a single value", () => {
    const result = setDiscriminatorEnum({
      node: baseNode,
      propertyName: "type",
      values: ["dog"],
    });
    const objectNode = result.type === "object" ? result : undefined;
    const typeProp = objectNode?.properties?.find(
      (prop) => prop.name === "type",
    );
    const enumNode =
      typeProp?.schema.type === "enum" ? typeProp.schema : undefined;

    expect(enumNode?.enumValues).toEqual(["dog"]);
    expect(enumNode?.name).toBeUndefined();
  });

  it("replaces the discriminator property with a named enum for multiple values", () => {
    const result = setDiscriminatorEnum({
      node: baseNode,
      propertyName: "type",
      values: ["dog", "cat"],
      enumName: "PetTypeEnum",
    });
    const objectNode = result.type === "object" ? result : undefined;
    const typeProp = objectNode?.properties?.find(
      (prop) => prop.name === "type",
    );
    const enumNode =
      typeProp?.schema.type === "enum" ? typeProp.schema : undefined;

    expect(enumNode?.enumValues).toEqual(["dog", "cat"]);
    expect(enumNode?.name).toBe("PetTypeEnum");
  });

  it("preserves non-discriminator properties", () => {
    const result = setDiscriminatorEnum({
      node: baseNode,
      propertyName: "type",
      values: ["dog"],
    });
    const objectNode = result.type === "object" ? result : undefined;
    const nameProp = objectNode?.properties?.find(
      (prop) => prop.name === "name",
    );

    expect(nameProp?.schema.type).toBe("string");
  });

  it("preserves readOnly from the original discriminator property", () => {
    const node = createSchema({
      type: "object",
      properties: [
        createProperty({
          name: "type",
          schema: createSchema({ type: "string", readOnly: true }),
        }),
      ],
    });
    const result = setDiscriminatorEnum({
      node,
      propertyName: "type",
      values: ["dog"],
    });
    const objectNode = result.type === "object" ? result : undefined;
    const typeProp = objectNode?.properties?.find(
      (prop) => prop.name === "type",
    );

    expect(typeProp?.schema.readOnly).toBe(true);
  });

  it("preserves writeOnly from the original discriminator property", () => {
    const node = createSchema({
      type: "object",
      properties: [
        createProperty({
          name: "type",
          schema: createSchema({ type: "string", writeOnly: true }),
        }),
      ],
    });
    const result = setDiscriminatorEnum({
      node,
      propertyName: "type",
      values: ["dog"],
    });
    const objectNode = result.type === "object" ? result : undefined;
    const typeProp = objectNode?.properties?.find(
      (prop) => prop.name === "type",
    );

    expect(typeProp?.schema.writeOnly).toBe(true);
  });
});

describe("mergeAdjacentObjects()", () => {
  function makeObject(props: Array<string>, name?: string): SchemaNode {
    return createSchema({
      type: "object",
      name,
      properties: props.map((prop) =>
        createProperty({
          name: prop,
          schema: createSchema({ type: "string" }),
        }),
      ),
    });
  }

  it("returns an empty array unchanged", () => {
    expect(mergeAdjacentObjects([])).toMatchInlineSnapshot(`[]`);
  });

  it("keeps a single anonymous object unchanged", () => {
    const node = makeObject(["a"]);

    expect(
      mergeAdjacentObjects([node]).map((n) =>
        n.type === "object"
          ? {
              type: n.type,
              name: n.name,
              props: n.properties.map((p) => p.name),
            }
          : { type: n.type },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": undefined,
          "props": [
            "a",
          ],
          "type": "object",
        },
      ]
    `);
  });

  it("merges two adjacent anonymous objects into one object", () => {
    const result = mergeAdjacentObjects([makeObject(["a"]), makeObject(["b"])]);

    expect(
      result.map((n) =>
        n.type === "object"
          ? { type: n.type, props: n.properties.map((p) => p.name) }
          : { type: n.type },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "props": [
            "a",
            "b",
          ],
          "type": "object",
        },
      ]
    `);
  });

  it("merges three adjacent anonymous objects into one object", () => {
    const result = mergeAdjacentObjects([
      makeObject(["a"]),
      makeObject(["b"]),
      makeObject(["c"]),
    ]);

    expect(
      result.map((n) =>
        n.type === "object"
          ? { type: n.type, props: n.properties.map((p) => p.name) }
          : { type: n.type },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "props": [
            "a",
            "b",
            "c",
          ],
          "type": "object",
        },
      ]
    `);
  });

  it("does not merge named objects", () => {
    const result = mergeAdjacentObjects([
      makeObject(["a"], "Foo"),
      makeObject(["b"], "Bar"),
    ]);

    expect(
      result.map((n) =>
        n.type === "object"
          ? {
              type: n.type,
              name: n.name,
              props: n.properties.map((p) => p.name),
            }
          : { type: n.type },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": "Foo",
          "props": [
            "a",
          ],
          "type": "object",
        },
        {
          "name": "Bar",
          "props": [
            "b",
          ],
          "type": "object",
        },
      ]
    `);
  });

  it("does not merge across named-object boundaries", () => {
    const result = mergeAdjacentObjects([
      makeObject(["a"]),
      makeObject(["b"], "Named"),
      makeObject(["c"]),
    ]);

    expect(
      result.map((n) =>
        n.type === "object"
          ? {
              type: n.type,
              name: n.name,
              props: n.properties.map((p) => p.name),
            }
          : { type: n.type },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": undefined,
          "props": [
            "a",
          ],
          "type": "object",
        },
        {
          "name": "Named",
          "props": [
            "b",
          ],
          "type": "object",
        },
        {
          "name": undefined,
          "props": [
            "c",
          ],
          "type": "object",
        },
      ]
    `);
  });

  it("does not merge ref nodes with anonymous objects", () => {
    const result = mergeAdjacentObjects([
      createSchema({
        type: "ref",
        ref: "#/components/schemas/Address",
        name: "Address",
      }),
      makeObject(["streetNumber"]),
      makeObject(["streetName"]),
    ]);

    expect(
      result.map((n) =>
        n.type === "object"
          ? {
              type: n.type,
              name: n.name,
              props: n.properties.map((p) => p.name),
            }
          : n.type === "ref"
            ? { type: n.type, name: n.name, ref: n.ref }
            : { type: n.type },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": "Address",
          "ref": "#/components/schemas/Address",
          "type": "ref",
        },
        {
          "name": undefined,
          "props": [
            "streetNumber",
            "streetName",
          ],
          "type": "object",
        },
      ]
    `);
  });
});

describe("simplifyUnion()", () => {
  it("returns members unchanged when no scalar primitives are present", () => {
    const members = [
      createSchema({
        type: "ref",
        ref: "#/components/schemas/Foo",
        name: "Foo",
      }),
    ];

    expect(simplifyUnion(members)).toEqual(members);
  });

  it("removes a string enum when a broader string scalar is present", () => {
    const members = [
      createSchema({
        type: "enum",
        primitive: "string",
        enumValues: ["placed", "approved"],
      }),
      createSchema({ type: "string" }),
    ];

    expect(simplifyUnion(members)).toEqual([members[1]]);
  });

  it("keeps a const-derived string enum when a broader string scalar is present", () => {
    const members = [
      createSchema({
        type: "enum",
        primitive: "string",
        enumValues: ["accepted"],
      }),
      createSchema({ type: "string" }),
    ];

    expect(simplifyUnion(members)).toEqual(members);
  });

  it("keeps a string enum when no broader string scalar is present", () => {
    const members = [
      createSchema({
        type: "enum",
        primitive: "string",
        enumValues: ["placed"],
      }),
    ];

    expect(simplifyUnion(members)).toEqual(members);
  });

  it("removes a number enum when a broader number scalar is present", () => {
    const members = [
      createSchema({
        type: "enum",
        primitive: "number",
        enumValues: [200, 400],
      }),
      createSchema({ type: "number" }),
    ];

    expect(simplifyUnion(members)).toEqual([members[1]]);
  });

  it("preserves ref members while simplifying scalar enum members", () => {
    const members = [
      createSchema({
        type: "enum",
        primitive: "string",
        enumValues: ["x", "y"],
      }),
      createSchema({ type: "string" }),
      createSchema({
        type: "ref",
        ref: "#/components/schemas/Bar",
        name: "Bar",
      }),
    ];
    const result = simplifyUnion(members);

    expect(result).toEqual([members[1], members[2]]);
  });
});

describe("setEnumName()", () => {
  it("assigns the resolved name to enum nodes", () => {
    const node = createSchema({
      type: "enum",
      primitive: "string",
      enumValues: ["a", "b"],
    });
    const result = setEnumName(node, "Order", "status", "enum");

    expect(result.name).toBe("OrderStatusEnum");
  });

  it("strips names from boolean enum nodes", () => {
    const node = createSchema({
      type: "enum",
      primitive: "boolean",
      enumValues: [true],
      name: "ShouldDrop",
    });
    const result = setEnumName(node, "Order", "enabled", "enum");

    expect(result.name).toBeUndefined();
  });

  it("passes through non-enum nodes unchanged", () => {
    const node = createSchema({ type: "string" });
    const result = setEnumName(node, "Order", "status", "enum");

    expect(result).toBe(node);
  });
});
