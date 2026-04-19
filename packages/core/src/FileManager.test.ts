import { createFile, createSource, createText } from "@kubb/ast";
import { describe, expect, it } from "vitest";
import { FileManager } from "./FileManager.ts";

function makeFile(path: string, sourceValue?: string) {
  return createFile({
    path,
    baseName: path.split("/").pop() as `${string}.${string}`,
    sources: sourceValue
      ? [createSource({ nodes: [createText(sourceValue)] })]
      : [],
    imports: [],
    exports: [],
  });
}

describe("FileManager", () => {
  it("starts with an empty file list", () => {
    const manager = new FileManager();
    expect(manager.files).toEqual([]);
  });

  describe("add", () => {
    it("stores a new file", () => {
      const manager = new FileManager();
      manager.add(makeFile("/src/foo.ts", "export const x = 1"));
      expect(manager.files).toHaveLength(1);
      expect(manager.files[0]?.path).toBe("/src/foo.ts");
    });

    it("merges two files with the same path passed in a single call", () => {
      const manager = new FileManager();
      manager.add(
        makeFile("/src/foo.ts", "const a = 1"),
        makeFile("/src/foo.ts", "const b = 2"),
      );
      expect(manager.files).toHaveLength(1);
      expect(manager.files[0]?.sources).toHaveLength(2);
    });

    it("stores multiple distinct files", () => {
      const manager = new FileManager();
      manager.add(makeFile("/src/a.ts"), makeFile("/src/b.ts"));
      expect(manager.files).toHaveLength(2);
    });

    it("returns the resolved file nodes", () => {
      const manager = new FileManager();
      const result = manager.add(makeFile("/src/foo.ts"));
      expect(result).toHaveLength(1);
      expect(result[0]?.path).toBe("/src/foo.ts");
    });
  });

  describe("upsert", () => {
    it("stores a new file when it does not yet exist", () => {
      const manager = new FileManager();
      manager.upsert(makeFile("/src/foo.ts", "export const x = 1"));
      expect(manager.files).toHaveLength(1);
    });

    it("merges into an existing file with the same path", () => {
      const manager = new FileManager();
      manager.add(makeFile("/src/foo.ts", "const a = 1"));
      manager.upsert(makeFile("/src/foo.ts", "const b = 2"));
      expect(manager.files).toHaveLength(1);
      expect(manager.files[0]?.sources).toHaveLength(2);
    });
  });

  describe("getByPath", () => {
    it("returns the file for a known path", () => {
      const manager = new FileManager();
      manager.add(makeFile("/src/foo.ts"));
      const file = manager.getByPath("/src/foo.ts");
      expect(file).not.toBeNull();
      expect(file?.path).toBe("/src/foo.ts");
    });

    it("returns null for an unknown path", () => {
      const manager = new FileManager();
      expect(manager.getByPath("/src/unknown.ts")).toBeNull();
    });
  });

  describe("deleteByPath", () => {
    it("removes the file with the given path", () => {
      const manager = new FileManager();
      manager.add(makeFile("/src/foo.ts"));
      manager.deleteByPath("/src/foo.ts");
      expect(manager.files).toHaveLength(0);
    });

    it("is a no-op for an unknown path", () => {
      const manager = new FileManager();
      manager.add(makeFile("/src/foo.ts"));
      manager.deleteByPath("/src/other.ts");
      expect(manager.files).toHaveLength(1);
    });
  });

  describe("clear", () => {
    it("removes all stored files", () => {
      const manager = new FileManager();
      manager.add(makeFile("/src/a.ts"), makeFile("/src/b.ts"));
      manager.clear();
      expect(manager.files).toHaveLength(0);
    });
  });

  describe("files sorting", () => {
    it("returns files sorted by path length (shortest first)", () => {
      const manager = new FileManager();
      manager.add(
        makeFile("/src/components/button/index.ts"),
        makeFile("/src/a.ts"),
        makeFile("/src/components/b.ts"),
      );
      const paths = manager.files.map((f) => f.path);
      expect(paths[0]).toBe("/src/a.ts");
      expect(paths[1]).toBe("/src/components/b.ts");
      expect(paths[2]).toBe("/src/components/button/index.ts");
    });

    it("places index files last within the same length bucket", () => {
      const manager = new FileManager();
      manager.add(makeFile("/src/index.ts"), makeFile("/src/types.ts"));
      const paths = manager.files.map((f) => f.path);
      expect(paths[0]).toBe("/src/types.ts");
      expect(paths[1]).toBe("/src/index.ts");
    });
  });
});
