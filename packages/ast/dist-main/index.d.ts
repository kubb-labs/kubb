import { n as __name, t as __exportAll } from "./rolldown-runtime-CNktS9qV.js";
import { $ as importDef, $t as DistributiveOmit, A as ResponseNode, At as ArrowFunctionNode, B as createParameter, Bt as breakDef, C as inputDef, Ct as schemaDef, D as OperationNode, Dt as propertyDef, E as HttpOperationNode, Et as createProperty, F as createRequestBody, Ft as JSDocNode, G as SourceNode, Gt as createFunction, H as ExportNode, Ht as createArrowFunction, I as requestBodyDef, It as JsxNode, J as createFile, Jt as createType, K as UserFileNode, Kt as createJsx, L as ParameterLocation, Lt as TextNode, M as createResponse, Mt as CodeNode, N as responseDef, Nt as ConstNode, O as createOperation, Ot as InferSchemaNode, P as RequestBodyNode, Pt as FunctionNode, Q as fileDef, Qt as typeDef, R as ParameterNode, Rt as TypeNode, S as createInput, St as createSchema, T as HttpMethod, Tt as UserPropertyNode, U as FileNode, Ut as createBreak, V as parameterDef, Vt as constDef, W as ImportNode, Wt as createConst, X as createSource, Xt as jsxDef, Y as createImport, Yt as functionDef, Z as exportDef, Zt as textDef, _ as OutputNode, _t as SchemaType, a as Enforce, at as DateSchemaNode, b as InputMeta, bt as UnionSchemaNode, c as composeMacros, ct as IntersectionSchemaNode, d as Visitor, dt as PrimitiveSchemaType, en as NodeDef, et as sourceDef, f as VisitorContext, ft as RefSchemaNode, g as Node, gt as SchemaNodeByType, h as transform, ht as SchemaNode, i as createPrinter, in as schemaTypes, it as ArraySchemaNode, j as StatusCode, jt as BreakNode, k as operationDef, kt as ParserOptions, l as defineMacro, lt as NumberSchemaNode, m as collectSync, mt as ScalarSchemaType, n as PrinterFactoryOptions, nn as BaseNode, nt as contentDef, o as Macro, ot as DatetimeSchemaNode, p as collect, pt as ScalarSchemaNode, q as createExport, qt as createText, r as PrinterPartial, rn as NodeKind, rt as createContent, s as applyMacros, st as EnumSchemaNode, t as Printer, tn as defineNode, tt as ContentNode, u as ParentOf, ut as ObjectSchemaNode, v as createOutput, vt as StringSchemaNode, w as GenericOperationNode, wt as PropertyNode, x as InputNode, xt as UrlSchemaNode, y as outputDef, yt as TimeSchemaNode, z as ParameterStyle, zt as arrowFunctionDef } from "./types-BPqinVNh.js";
//#region src/guards.d.ts
/**
 * Narrows a `SchemaNode` to the variant that matches `type`.
 *
 * @example
 * ```ts
 * const schema = createSchema({ type: 'string' })
 * const stringNode = narrowSchema(schema, 'string') // StringSchemaNode | null
 * ```
 */
declare function narrowSchema<T extends SchemaNode['type']>(node: SchemaNode | undefined, type: T): SchemaNodeByType[T] | null;
/**
 * Narrows an `OperationNode` to an `HttpOperationNode` so `method` and `path` are present.
 *
 * @example
 * ```ts
 * if (isHttpOperationNode(node)) {
 *   console.log(node.method, node.path)
 * }
 * ```
 */
declare function isHttpOperationNode(node: OperationNode): node is HttpOperationNode;
//#endregion
//#region src/optionality.d.ts
/**
 * Generic JSON Schema optionality: a non-required field is optional, and a
 * non-required nullable field is nullish.
 */
declare function optionality(schema: SchemaNode, required: boolean): SchemaNode;
//#endregion
//#region src/utils/extractStringsFromNodes.d.ts
/**
 * Extracts all string content from a `CodeNode` tree recursively.
 *
 * Collects text node values, identifier references in string fields (`params`, `generics`, `returnType`, `type`),
 * and nested node content. Used to build the full source string for import filtering.
 */
declare function extractStringsFromNodes(nodes: Array<CodeNode> | undefined): string;
//#endregion
//#region src/utils/refs.d.ts
/**
 * Resolves the emitted name of the schema a ref node points at. Prefers `targetName` (set when
 * the referenced schema was renamed, e.g. to break a collision), then the last segment of `ref`,
 * then `name`, then the nested `schema.name`.
 *
 * Returns `null` for non-ref nodes or when no name resolves.
 *
 * @example
 * `resolveRefName({ kind: 'Schema', type: 'ref', ref: '#/components/schemas/Pet' }) // 'Pet'`
 *
 * @example Collision-renamed target
 * `resolveRefName({ kind: 'Schema', type: 'ref', ref: '#/components/schemas/Order', targetName: 'OrderSchema' }) // 'OrderSchema'`
 */
declare function resolveRefName(node: SchemaNode | null | undefined): string | null;
//#endregion
//#region src/utils/schemaGraph.d.ts
/**
 * Collects the de-duplicated target names of every pointer-carrying ref in a node's subtree, in
 * first-occurrence order. The walk is memoized by node identity, so the subtree is scanned once and
 * `resolver.imports` reads the same result across the ts, zod, and faker plugins instead of
 * re-scanning the same schema per plugin.
 *
 * Only refs that carry a `$ref` pointer count, so a synthesized ref pointing at a sibling in the
 * same file (a union member created by name) is left out. That leaves exactly the set
 * `resolver.imports` emits. This is the ordered, import-facing counterpart to
 * {@link collectReferencedSchemaNames}, which returns an unordered set for graph analysis.
 *
 * @example
 * ```ts
 * collectImportedRefNames(petSchema)
 * // ['Category', 'Tag']
 * ```
 */
declare const collectImportedRefNames: (key: SchemaNode) => readonly string[];
/**
 * Collects the names of all top-level schemas transitively used by a set of operations.
 *
 * An operation uses a schema when its parameters, request body, or responses reference it, directly
 * or through other named schemas. Once a name is added to the result it is not revisited, so
 * reference cycles terminate.
 *
 * Pair it with `include` filters so schemas reachable only from excluded operations stay ungenerated.
 *
 * @example Only generate schemas referenced by included operations
 * ```ts
 * const includedOps = operations.filter((op) => resolver.default.options(op, { options, include }) !== null)
 * const allowed = collectUsedSchemaNames(includedOps, schemas)
 *
 * for (const schema of schemas) {
 *   if (schema.name && !allowed.has(schema.name)) continue
 *   // generate schema
 * }
 * ```
 */
declare function collectUsedSchemaNames(operations: ReadonlyArray<OperationNode>, schemas: ReadonlyArray<SchemaNode>): Set<string>;
/**
 * Finds every schema that takes part in a circular dependency chain in a schema dependency graph
 * that maps each schema name to the names it references directly.
 *
 * Use this when the graph was already collected during another pass (e.g. the adapter's convert
 * walk), so the schema nodes are not swept a second time. `findCircularSchemas` builds the graph
 * from schema nodes and delegates here.
 *
 * @example
 * ```ts
 * const graph = new Map([
 *   ['Pet', new Set(['Category'])],
 *   ['Category', new Set(['Pet'])],
 * ])
 * findCircularSchemasFromGraph(graph) // Set { 'Pet', 'Category' }
 * ```
 */
declare function findCircularSchemasFromGraph(graph: ReadonlyMap<string, ReadonlySet<string>>): Set<string>;
/**
 * Finds every schema that takes part in a circular dependency chain, including direct self-loops.
 *
 * Wrap the returned schema positions in a deferred construct (a lazy getter or `z.lazy(() => …)`) so
 * the generated code does not recurse forever. Refs are followed by name only, so the walk stays
 * linear in the size of the schema graph.
 *
 * @note Call this once on the full graph, then check individual schemas with `containsCircularRef()`.
 */
declare function findCircularSchemas(schemas: ReadonlyArray<SchemaNode>): Set<string>;
declare namespace factory_d_exports {
  export { UserFileNode, createArrowFunction, createBreak, createConst, createContent, createExport, createFile, createFunction, createImport, createInput, createJsx, createOperation, createOutput, createParameter, createProperty, createRequestBody, createResponse, createSchema, createSource, createText, createType, update };
}
/**
 * Identity-preserving node update: returns `node` unchanged when every field in
 * `changes` already equals (by reference) the current value, otherwise a new node
 * with the changes applied.
 *
 * Mirrors the TypeScript compiler's `factory.updateX` contract. Pair it with the
 * structural sharing in {@link transform} so a no-op rewrite does not allocate and
 * downstream passes can detect "nothing changed" by identity. Comparison is shallow,
 * so a structurally equal but newly allocated array or object counts as a change.
 *
 * @example
 * ```ts
 * update(node, { name: node.name })        // -> same `node` reference
 * update(node, { name: 'renamed' })        // -> new node, `name` replaced
 * ```
 */
declare function update<T extends Node>(node: T, changes: Partial<T>): T;
//#endregion
//#region src/registry.d.ts
/**
 * Every node definition. Adding a node means adding its `defineNode` to one
 * `nodes/*.ts` file and listing it here. The visitor tables in `visitor.ts` derive from it.
 */
declare const nodeDefs: (NodeDef<InputNode, Partial<Omit<InputNode, "kind">>> | NodeDef<OutputNode, Partial<Omit<OutputNode, "kind">>> | NodeDef<RequestBodyNode, Omit<RequestBodyNode, "kind">> | NodeDef<OperationNode, {
  [key: string]: unknown;
  operationId: string;
  method?: HttpOperationNode["method"];
  path?: HttpOperationNode["path"];
  requestBody?: Omit<RequestBodyNode, "kind">;
}> | NodeDef<ContentNode, Omit<ContentNode, "kind">> | NodeDef<ResponseNode, Pick<ResponseNode, "statusCode"> & Partial<Omit<ResponseNode, "kind" | "content" | "statusCode">> & {
  content?: Array<ContentNode>;
  schema?: SchemaNode;
  mediaType?: string | null;
  keysToOmit?: Array<string> | null;
}> | NodeDef<SchemaNode, (Omit<ObjectSchemaNode, "kind" | "properties" | "primitive"> & {
  properties?: Array<PropertyNode>;
  primitive?: "object";
}) | DistributiveOmit<ArraySchemaNode | UnionSchemaNode | IntersectionSchemaNode | EnumSchemaNode | RefSchemaNode | DatetimeSchemaNode | DateSchemaNode | TimeSchemaNode | StringSchemaNode | NumberSchemaNode | UrlSchemaNode | (BaseNode & {
  kind: "Schema";
  name?: string | null;
  title?: string;
  description?: string;
  nullable?: boolean;
  optional?: boolean;
  nullish?: boolean;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  default?: unknown;
  examples?: Array<unknown>;
  primitive?: PrimitiveSchemaType;
  format?: string;
} & {
  type: "uuid" | "email";
  min?: number;
  max?: number;
}) | (BaseNode & {
  kind: "Schema";
  name?: string | null;
  title?: string;
  description?: string;
  nullable?: boolean;
  optional?: boolean;
  nullish?: boolean;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  default?: unknown;
  examples?: Array<unknown>;
  primitive?: PrimitiveSchemaType;
  format?: string;
} & {
  type: "ipv4";
}) | (BaseNode & {
  kind: "Schema";
  name?: string | null;
  title?: string;
  description?: string;
  nullable?: boolean;
  optional?: boolean;
  nullish?: boolean;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  default?: unknown;
  examples?: Array<unknown>;
  primitive?: PrimitiveSchemaType;
  format?: string;
} & {
  type: "ipv6";
}) | ScalarSchemaNode, "kind">> | NodeDef<PropertyNode, UserPropertyNode> | NodeDef<ParameterNode, Pick<ParameterNode, "schema" | "name" | "in"> & Partial<Omit<ParameterNode, "schema" | "kind" | "name" | "in">>> | NodeDef<ConstNode, Omit<ConstNode, "kind">> | NodeDef<TypeNode, Omit<TypeNode, "kind">> | NodeDef<FunctionNode, Omit<FunctionNode, "kind">> | NodeDef<ArrowFunctionNode, Omit<ArrowFunctionNode, "kind">> | NodeDef<TextNode, string> | NodeDef<BreakNode, void> | NodeDef<JsxNode, string> | NodeDef<ImportNode, Omit<ImportNode, "kind">> | NodeDef<ExportNode, Omit<ExportNode, "kind">> | NodeDef<SourceNode, Omit<SourceNode, "kind">> | NodeDef<FileNode<object>, Omit<FileNode<object>, "kind">>)[];
declare namespace exports_d_exports {
  export { ArraySchemaNode, ArrowFunctionNode, BreakNode, CodeNode, ConstNode, ContentNode, DateSchemaNode, DatetimeSchemaNode, DistributiveOmit, Enforce, EnumSchemaNode, ExportNode, FileNode, FunctionNode, GenericOperationNode, HttpMethod, HttpOperationNode, ImportNode, InferSchemaNode, InputMeta, InputNode, IntersectionSchemaNode, JSDocNode, JsxNode, Macro, Node, NodeDef, NodeKind, NumberSchemaNode, ObjectSchemaNode, OperationNode, OutputNode, ParameterLocation, ParameterNode, ParameterStyle, ParentOf, ParserOptions, PrimitiveSchemaType, Printer, PrinterFactoryOptions, PrinterPartial, PropertyNode, RefSchemaNode, RequestBodyNode, ResponseNode, ScalarSchemaNode, ScalarSchemaType, SchemaNode, SchemaNodeByType, SchemaType, SourceNode, StatusCode, StringSchemaNode, TextNode, TimeSchemaNode, TypeNode, UnionSchemaNode, UrlSchemaNode, UserFileNode, Visitor, VisitorContext, applyMacros, arrowFunctionDef, breakDef, collect, collectImportedRefNames, collectSync, collectUsedSchemaNames, composeMacros, constDef, contentDef, createPrinter, defineMacro, defineNode, exportDef, extractStringsFromNodes, factory_d_exports as factory, fileDef, findCircularSchemas, findCircularSchemasFromGraph, functionDef, importDef, inputDef, isHttpOperationNode, jsxDef, narrowSchema, nodeDefs, operationDef, optionality, outputDef, parameterDef, propertyDef, requestBodyDef, resolveRefName, responseDef, schemaDef, schemaTypes, sourceDef, textDef, transform, typeDef };
}
//#endregion
export { type ArraySchemaNode, type ArrowFunctionNode, type BreakNode, type CodeNode, type ConstNode, type ContentNode, type DateSchemaNode, type DatetimeSchemaNode, type DistributiveOmit, type Enforce, type EnumSchemaNode, type ExportNode, type FileNode, type FunctionNode, type GenericOperationNode, type HttpMethod, type HttpOperationNode, type ImportNode, type InferSchemaNode, type InputMeta, type InputNode, type IntersectionSchemaNode, type JSDocNode, type JsxNode, type Macro, type Node, type NodeDef, type NodeKind, type NumberSchemaNode, type ObjectSchemaNode, type OperationNode, type OutputNode, type ParameterLocation, type ParameterNode, type ParameterStyle, type ParentOf, type ParserOptions, type PrimitiveSchemaType, type Printer, type PrinterFactoryOptions, type PrinterPartial, type PropertyNode, type RefSchemaNode, type RequestBodyNode, type ResponseNode, type ScalarSchemaNode, type ScalarSchemaType, type SchemaNode, type SchemaNodeByType, type SchemaType, type SourceNode, type StatusCode, type StringSchemaNode, type TextNode, type TimeSchemaNode, type TypeNode, type UnionSchemaNode, type UrlSchemaNode, type UserFileNode, type Visitor, type VisitorContext, applyMacros, arrowFunctionDef, exports_d_exports as ast, breakDef, collect, collectImportedRefNames, collectSync, collectUsedSchemaNames, composeMacros, constDef, contentDef, createPrinter, defineMacro, defineNode, exportDef, extractStringsFromNodes, factory_d_exports as factory, fileDef, findCircularSchemas, findCircularSchemasFromGraph, functionDef, importDef, inputDef, isHttpOperationNode, jsxDef, narrowSchema, nodeDefs, operationDef, optionality, outputDef, parameterDef, propertyDef, requestBodyDef, resolveRefName, responseDef, schemaDef, schemaTypes, sourceDef, textDef, transform, typeDef };
//# sourceMappingURL=index.d.ts.map