import { describe, expect, test } from "vitest";
import { maskString, trimExtName } from "./string.ts";

describe("maskString", () => {
  test("returns masked value when long enough", () => {
    expect(maskString("KUBB_STUDIO-abc123-xyz789")).toBe("KUBB_STU…z789");
  });

  test("returns original value when too short to mask", () => {
    expect(maskString("short")).toBe("short");
  });
});

describe("trimExtName", () => {
  test("strips .ts extension", () => {
    expect(trimExtName("petStore.ts")).toBe("petStore");
  });

  test("strips extension from a full path", () => {
    expect(trimExtName("/src/models/pet.ts")).toBe("/src/models/pet");
  });

  test("does not strip the dot from a directory segment", () => {
    expect(trimExtName("/project.v2/gen/pet.ts")).toBe("/project.v2/gen/pet");
  });

  test("returns the input unchanged when there is no extension", () => {
    expect(trimExtName("noExtension")).toBe("noExtension");
  });

  test("strips .json extension", () => {
    expect(trimExtName("schema.json")).toBe("schema");
  });

  test("strips double extension (.d.ts)", () => {
    expect(trimExtName("types.d.ts")).toBe("types.d");
  });
});
