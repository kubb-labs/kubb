import { ast } from "@kubb/core";
import { describe, expect, it } from "vitest";
import { adapterOas } from "./adapter.ts";

describe("adapterOas.getImports", () => {
  it("returns named imports as string arrays", async () => {
    const adapter = adapterOas();

    await adapter.parse({
      type: "data",
      data: {
        openapi: "3.0.0",
        info: { title: "test", version: "1.0.0" },
        paths: {},
        components: {
          schemas: {
            Pet: {
              type: "object",
              properties: {
                id: { type: "string" },
              },
            },
          },
        },
      },
    });

    const imports = adapter.getImports(
      ast.createSchema({
        type: "ref",
        ref: "#/components/schemas/Pet",
        name: "Pet",
      }),
      () => ({
        name: "PetType",
        path: "./pet.ts",
      }),
    );

    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatchObject({ name: ["PetType"], path: "./pet.ts" });
  });
});
