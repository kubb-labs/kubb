import { describe, expect, it } from "vitest";
import { createRenderer } from "../createRenderer.tsx";
import { File } from "./File.tsx";

describe("File.Source", () => {
  it("should register source block attributes", async () => {
    const renderer = createRenderer();
    await renderer.render(
      <File baseName="models.ts" path="src/models.ts">
        <File.Source name="Pet" isExportable isIndexable isTypeOnly>
          {"export type Pet = { id: number }"}
        </File.Source>
      </File>,
    );

    const source = renderer.files[0]?.sources[0];
    expect(source?.name).toBe("Pet");
    expect(source?.isExportable).toBe(true);
    expect(source?.isIndexable).toBe(true);
    expect(source?.isTypeOnly).toBe(true);
    renderer.unmount();
  });
});

describe("File.Import", () => {
  it("should register import attributes", async () => {
    const renderer = createRenderer();
    await renderer.render(
      <File baseName="client.ts" path="src/client.ts">
        <File.Import
          name={["Pet"]}
          path="./models/pet"
          isTypeOnly
          root="/src"
        />
        <File.Source>{"const p: Pet = {}"}</File.Source>
      </File>,
    );

    const imp = renderer.files[0]?.imports[0];
    expect(imp?.path).toBe("./models/pet");
    expect(imp?.isTypeOnly).toBe(true);
    expect(imp?.root).toBe("/src");
    renderer.unmount();
  });
});

describe("File.Export", () => {
  it("should register export attributes", async () => {
    const renderer = createRenderer();
    await renderer.render(
      <File baseName="index.ts" path="src/index.ts">
        <File.Export name={["Pet"]} path="./models/pet" isTypeOnly asAlias />
        <File.Source>{"// barrel"}</File.Source>
      </File>,
    );

    const exp = renderer.files[0]?.exports[0];
    expect(exp?.path).toBe("./models/pet");
    expect(exp?.isTypeOnly).toBe(true);
    expect(exp?.asAlias).toBe(true);
    renderer.unmount();
  });
});
