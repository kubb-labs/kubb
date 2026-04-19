import { assert, describe, expect, it } from "vitest";
import {
  appendChildNode,
  createNode,
  createTextNode,
  setAttribute,
} from "./dom.ts";
import { processFiles } from "./utils.ts";

function makeFile(name = "test.ts") {
  const root = createNode("kubb-root");
  const file = createNode("kubb-file");
  setAttribute(file, "baseName", name);
  setAttribute(file, "path", `src/${name}`);
  setAttribute(file, "meta", {});
  appendChildNode(root, file);
  return { root, file };
}

function makeSource(file: ReturnType<typeof createNode>, name = "Src") {
  const source = createNode("kubb-source");
  setAttribute(source, "name", name);
  setAttribute(source, "isExportable", false);
  setAttribute(source, "isIndexable", false);
  setAttribute(source, "isTypeOnly", false);
  appendChildNode(file, source);
  return source;
}

describe("processFiles", () => {
  it("should collect source node attributes", () => {
    const { root, file } = makeFile();
    const source = createNode("kubb-source");
    setAttribute(source, "name", "MyType");
    setAttribute(source, "isExportable", true);
    setAttribute(source, "isIndexable", true);
    setAttribute(source, "isTypeOnly", false);
    appendChildNode(file, source);

    const [result] = processFiles(root);
    assert(result);
    const node = result.sources[0];
    assert(node);
    expect(node.name).toBe("MyType");
    expect(node.isExportable).toBe(true);
    expect(node.isIndexable).toBe(true);
  });

  it("should map child element kinds to code nodes", () => {
    const { root, file } = makeFile();
    const source = makeSource(file);
    const children: Array<[string, string]> = [
      ["kubb-function", "Function"],
      ["kubb-arrow-function", "ArrowFunction"],
      ["kubb-const", "Const"],
      ["kubb-type", "Type"],
    ];
    for (const [nodeName, _] of children) {
      const child = createNode(nodeName);
      setAttribute(child, "name", "foo");
      appendChildNode(source, child);
    }

    const [result] = processFiles(root);
    assert(result);
    const node = result.sources[0];
    assert(node?.nodes);
    expect(node.nodes.map((n) => n.kind)).toEqual(
      children.map(([, kind]) => kind),
    );
  });

  it("should add Break node for br children", () => {
    const { root, file } = makeFile();
    const source = makeSource(file);
    appendChildNode(source, createNode("br"));

    const [result] = processFiles(root);
    assert(result);
    const node = result.sources[0];
    assert(node?.nodes);
    expect(node.nodes[0]?.kind).toBe("Break");
  });

  it("should add Jsx node for kubb-jsx children with text", () => {
    const { root, file } = makeFile();
    const source = makeSource(file);
    const jsx = createNode("kubb-jsx");
    appendChildNode(jsx, createTextNode("<div/>"));
    appendChildNode(source, jsx);

    const [result] = processFiles(root);
    assert(result);
    const node = result.sources[0];
    assert(node?.nodes);
    expect(node.nodes[0]?.kind).toBe("Jsx");
  });

  it("should skip kubb-jsx children with empty text", () => {
    const { root, file } = makeFile();
    const source = makeSource(file);
    appendChildNode(source, createNode("kubb-jsx"));

    const [result] = processFiles(root);
    assert(result);
    const node = result.sources[0];
    assert(node?.nodes);
    expect(node.nodes.length).toBe(0);
  });

  it("should skip whitespace-only text children", () => {
    const { root, file } = makeFile();
    const source = makeSource(file);
    appendChildNode(source, createTextNode("   "));

    const [result] = processFiles(root);
    assert(result);
    const node = result.sources[0];
    assert(node?.nodes);
    expect(node.nodes.length).toBe(0);
  });

  it("should not collect sources nested inside ignored elements", () => {
    const { root, file } = makeFile();
    const exportNode = createNode("kubb-export");
    setAttribute(exportNode, "path", "./foo");
    makeSource(exportNode);
    appendChildNode(file, exportNode);

    const [result] = processFiles(root);
    assert(result);
    expect(result.sources.length).toBe(0);
  });

  it("should collect export node attributes", () => {
    const { root, file } = makeFile();
    const exportNode = createNode("kubb-export");
    setAttribute(exportNode, "name", ["Pet"]);
    setAttribute(exportNode, "path", "./models/pet");
    setAttribute(exportNode, "isTypeOnly", false);
    setAttribute(exportNode, "asAlias", false);
    appendChildNode(file, exportNode);

    const [result] = processFiles(root);
    assert(result);
    const node = result.exports[0];
    assert(node);
    expect(node.path).toBe("./models/pet");
    expect(node.isTypeOnly).toBe(false);
  });

  it("should collect import node attributes", () => {
    const { root, file } = makeFile();
    const importNode = createNode("kubb-import");
    setAttribute(importNode, "name", ["useState"]);
    setAttribute(importNode, "path", "react");
    setAttribute(importNode, "isTypeOnly", false);
    setAttribute(importNode, "isNameSpace", false);
    appendChildNode(file, importNode);

    const [result] = processFiles(root);
    assert(result);
    const node = result.imports[0];
    assert(node);
    expect(node.path).toBe("react");
    expect(node.isTypeOnly).toBe(false);
    expect(node.isNameSpace).toBe(false);
  });

  it("should collect a file node with its sources, imports, exports, and metadata", () => {
    const root = createNode("kubb-root");
    const file = createNode("kubb-file");
    setAttribute(file, "baseName", "pet.ts");
    setAttribute(file, "path", "src/models/pet.ts");
    setAttribute(file, "meta", { tag: "pet" });
    setAttribute(file, "banner", "// banner");
    setAttribute(file, "footer", "// footer");

    const source = createNode("kubb-source");
    setAttribute(source, "name", "Pet");
    setAttribute(source, "isExportable", true);
    setAttribute(source, "isIndexable", true);
    setAttribute(source, "isTypeOnly", false);
    appendChildNode(file, source);

    const importNode = createNode("kubb-import");
    setAttribute(importNode, "name", ["useState"]);
    setAttribute(importNode, "path", "react");
    setAttribute(importNode, "isTypeOnly", false);
    setAttribute(importNode, "isNameSpace", false);
    appendChildNode(file, importNode);

    const exportNode = createNode("kubb-export");
    setAttribute(exportNode, "path", "./models/pet");
    setAttribute(exportNode, "isTypeOnly", false);
    setAttribute(exportNode, "asAlias", false);
    appendChildNode(file, exportNode);

    appendChildNode(root, file);

    const [result] = processFiles(root);
    expect(result?.baseName).toBe("pet.ts");
    expect(result?.path).toBe("src/models/pet.ts");
    expect(result?.meta).toEqual({ tag: "pet" });
    expect(result?.banner).toBe("// banner");
    expect(result?.footer).toBe("// footer");
    expect(result?.sources[0]?.name).toBe("Pet");
    expect(result?.imports[0]?.path).toBe("react");
    expect(result?.exports[0]?.path).toBe("./models/pet");
  });

  it("should skip file nodes missing baseName or path", () => {
    const root = createNode("kubb-root");
    const noBaseName = createNode("kubb-file");
    setAttribute(noBaseName, "path", "src/a.ts");
    appendChildNode(root, noBaseName);
    const noPath = createNode("kubb-file");
    setAttribute(noPath, "baseName", "b.ts");
    appendChildNode(root, noPath);

    expect(processFiles(root)).toEqual([]);
  });

  it("should traverse nested non-file elements to find files", () => {
    const root = createNode("kubb-root");
    const app = createNode("kubb-app");
    const file = createNode("kubb-file");
    setAttribute(file, "baseName", "nested.ts");
    setAttribute(file, "path", "src/nested.ts");
    setAttribute(file, "meta", {});
    appendChildNode(app, file);
    appendChildNode(root, app);

    const result = processFiles(root);
    expect(result.length).toBe(1);
    expect(result[0]?.baseName).toBe("nested.ts");
  });
});
