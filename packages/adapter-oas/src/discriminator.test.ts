import { ast } from "@kubb/core";
import { describe, expect, it } from "vitest";
import { toSnapshot } from "#mocks";
import { applyDiscriminatorInheritance } from "./discriminator.ts";
import { parseDocument } from "./factory.ts";
import { parseOas } from "./parser.ts";

describe("applyDiscriminatorInheritance", () => {
  it("returns the same root when no discriminators are present", async () => {
    const oas = await parseDocument({
      openapi: "3.0.3",
      info: { title: "NoDis", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Pet: { type: "object", properties: { name: { type: "string" } } },
        },
      },
    });

    const root = parseOas(oas).root;
    const result = applyDiscriminatorInheritance(root);

    expect(result).toBe(root);
  });

  it("injects the discriminator enum into child object schemas", async () => {
    const oas = await parseDocument({
      openapi: "3.0.3",
      info: { title: "Inject", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Animal: {
            oneOf: [
              { $ref: "#/components/schemas/Dog" },
              { $ref: "#/components/schemas/Cat" },
            ],
            discriminator: {
              propertyName: "type",
              mapping: {
                dog: "#/components/schemas/Dog",
                cat: "#/components/schemas/Cat",
              },
            },
          },
          Dog: { type: "object", properties: { name: { type: "string" } } },
          Cat: { type: "object", properties: { lives: { type: "integer" } } },
        },
      },
    });

    const root = applyDiscriminatorInheritance(parseOas(oas).root);

    const dog = root.schemas.find((s) => s.name === "Dog");
    expect(toSnapshot(ast.narrowSchema(dog, "object"))).toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "name": "Dog",
        "primitive": "object",
        "properties": [
          {
            "kind": "Property",
            "name": "name",
            "required": false,
            "schema": {
              "kind": "Schema",
              "name": "DogName",
              "optional": true,
              "primitive": "string",
              "type": "string",
            },
          },
          {
            "kind": "Property",
            "name": "type",
            "required": true,
            "schema": {
              "enumValues": [
                "dog",
              ],
              "kind": "Schema",
              "type": "enum",
            },
          },
        ],
        "type": "object",
      }
    `);

    const cat = root.schemas.find((s) => s.name === "Cat");
    expect(toSnapshot(ast.narrowSchema(cat, "object"))).toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "name": "Cat",
        "primitive": "object",
        "properties": [
          {
            "kind": "Property",
            "name": "lives",
            "required": false,
            "schema": {
              "kind": "Schema",
              "name": "CatLives",
              "optional": true,
              "primitive": "integer",
              "type": "integer",
            },
          },
          {
            "kind": "Property",
            "name": "type",
            "required": true,
            "schema": {
              "enumValues": [
                "cat",
              ],
              "kind": "Schema",
              "type": "enum",
            },
          },
        ],
        "type": "object",
      }
    `);
  });

  it("replaces an existing discriminator property instead of duplicating it", async () => {
    const oas = await parseDocument({
      openapi: "3.0.3",
      info: { title: "Replace", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Animal: {
            oneOf: [{ $ref: "#/components/schemas/Dog" }],
            discriminator: {
              propertyName: "type",
              mapping: { dog: "#/components/schemas/Dog" },
            },
          },
          Dog: {
            type: "object",
            required: ["type"],
            properties: { type: { type: "string" }, name: { type: "string" } },
          },
        },
      },
    });

    const root = applyDiscriminatorInheritance(parseOas(oas).root);

    const dog = root.schemas.find((s) => s.name === "Dog");
    expect(toSnapshot(ast.narrowSchema(dog, "object"))).toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "name": "Dog",
        "primitive": "object",
        "properties": [
          {
            "kind": "Property",
            "name": "type",
            "required": true,
            "schema": {
              "enumValues": [
                "dog",
              ],
              "kind": "Schema",
              "type": "enum",
            },
          },
          {
            "kind": "Property",
            "name": "name",
            "required": false,
            "schema": {
              "kind": "Schema",
              "name": "DogName",
              "optional": true,
              "primitive": "string",
              "type": "string",
            },
          },
        ],
        "type": "object",
      }
    `);
  });

  it("handles intersection-wrapped union (union with shared properties)", async () => {
    const oas = await parseDocument({
      openapi: "3.0.3",
      info: { title: "SharedProps", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Animal: {
            oneOf: [
              { $ref: "#/components/schemas/Dog" },
              { $ref: "#/components/schemas/Cat" },
            ],
            discriminator: {
              propertyName: "type",
              mapping: {
                dog: "#/components/schemas/Dog",
                cat: "#/components/schemas/Cat",
              },
            },
            properties: { name: { type: "string" } },
          },
          Dog: {
            type: "object",
            properties: { barkVolume: { type: "integer" } },
          },
          Cat: { type: "object", properties: { lives: { type: "integer" } } },
        },
      },
    });

    const root = applyDiscriminatorInheritance(parseOas(oas).root);

    const dog = root.schemas.find((s) => s.name === "Dog");
    expect(toSnapshot(ast.narrowSchema(dog, "object"))).toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "name": "Dog",
        "primitive": "object",
        "properties": [
          {
            "kind": "Property",
            "name": "barkVolume",
            "required": false,
            "schema": {
              "kind": "Schema",
              "name": "DogBarkVolume",
              "optional": true,
              "primitive": "integer",
              "type": "integer",
            },
          },
          {
            "kind": "Property",
            "name": "type",
            "required": true,
            "schema": {
              "enumValues": [
                "dog",
              ],
              "kind": "Schema",
              "type": "enum",
            },
          },
        ],
        "type": "object",
      }
    `);

    const cat = root.schemas.find((s) => s.name === "Cat");
    expect(toSnapshot(ast.narrowSchema(cat, "object"))).toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "name": "Cat",
        "primitive": "object",
        "properties": [
          {
            "kind": "Property",
            "name": "lives",
            "required": false,
            "schema": {
              "kind": "Schema",
              "name": "CatLives",
              "optional": true,
              "primitive": "integer",
              "type": "integer",
            },
          },
          {
            "kind": "Property",
            "name": "type",
            "required": true,
            "schema": {
              "enumValues": [
                "cat",
              ],
              "kind": "Schema",
              "type": "enum",
            },
          },
        ],
        "type": "object",
      }
    `);
  });

  it("leaves child schemas not in the discriminator mapping untouched", async () => {
    const oas = await parseDocument({
      openapi: "3.0.3",
      info: { title: "Untouched", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Animal: {
            oneOf: [{ $ref: "#/components/schemas/Dog" }],
            discriminator: {
              propertyName: "type",
              mapping: { dog: "#/components/schemas/Dog" },
            },
          },
          Dog: { type: "object", properties: { name: { type: "string" } } },
          UnrelatedSchema: {
            type: "object",
            properties: { id: { type: "integer" } },
          },
        },
      },
    });

    const root = applyDiscriminatorInheritance(parseOas(oas).root);

    const unrelated = root.schemas.find((s) => s.name === "UnrelatedSchema");
    expect(toSnapshot(ast.narrowSchema(unrelated, "object")))
      .toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "name": "UnrelatedSchema",
        "primitive": "object",
        "properties": [
          {
            "kind": "Property",
            "name": "id",
            "required": false,
            "schema": {
              "kind": "Schema",
              "name": "UnrelatedSchemaId",
              "optional": true,
              "primitive": "integer",
              "type": "integer",
            },
          },
        ],
        "type": "object",
      }
    `);
  });
});
