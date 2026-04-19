import { describe, expect, it } from "vitest";
import { dereferenceWithRef, resolveRef } from "./refs.ts";
import type { Document, SchemaObject } from "./types.ts";

const document: Document = {
  openapi: "3.0.3",
  info: { title: "", version: "" },
  paths: {},
  components: {
    schemas: {
      Pet: { type: "object", properties: { name: { type: "string" } } },
      Order: {
        type: "object",
        properties: { pet: { $ref: "#/components/schemas/Pet" } },
      },
    },
  },
} as Document;

describe("resolveRef", () => {
  it("resolves a local $ref to its schema", () => {
    const result = resolveRef<SchemaObject>(
      document,
      "#/components/schemas/Pet",
    );

    expect(result).toEqual({
      type: "object",
      properties: { name: { type: "string" } },
    });
  });

  it("returns null for an empty ref", () => {
    expect(resolveRef(document, "")).toBeNull();
  });

  it("returns null for a non-local (external) ref", () => {
    expect(resolveRef(document, "https://example.com/schemas/Pet")).toBeNull();
  });

  it("throws when the pointer cannot be resolved", () => {
    expect(() => resolveRef(document, "#/components/schemas/Missing")).toThrow(
      "Could not find a definition for #/components/schemas/Missing",
    );
  });

  it("handles URL-encoded pointers", () => {
    const docWithEncoded: Document = {
      ...document,
      components: {
        schemas: {
          "Pet List": { type: "array", items: { type: "string" } },
        },
      },
    } as Document;

    const result = resolveRef<SchemaObject>(
      docWithEncoded,
      "#/components/schemas/Pet%20List",
    );

    expect(result).toEqual({ type: "array", items: { type: "string" } });
  });
});

describe("dereferenceWithRef", () => {
  it("resolves a $ref object and preserves the $ref field", () => {
    const result = dereferenceWithRef<SchemaObject>(document, {
      $ref: "#/components/schemas/Pet",
    });

    expect(result).toMatchObject({
      $ref: "#/components/schemas/Pet",
      type: "object",
      properties: { name: { type: "string" } },
    });
  });

  it("returns a plain schema unchanged", () => {
    const schema: SchemaObject = { type: "string" };

    expect(dereferenceWithRef(document, schema)).toBe(schema);
  });

  it("returns undefined as-is", () => {
    expect(dereferenceWithRef(document, undefined)).toBeUndefined();
  });

  it("resolved fields are overridden by $ref identity (preserves $ref)", () => {
    const result = dereferenceWithRef<SchemaObject & { $ref: string }>(
      document,
      { $ref: "#/components/schemas/Order" },
    );

    expect(result.$ref).toBe("#/components/schemas/Order");
    expect(result.type).toBe("object");
  });
});
