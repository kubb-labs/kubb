Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let node_crypto = require("node:crypto");
let node_path = require("node:path");
node_path = __toESM(node_path, 1);
//#region src/constants.ts
const visitorDepths = {
	shallow: "shallow",
	deep: "deep"
};
/**
* Schema type discriminators used by all AST schema nodes.
*
* Each value is a stable discriminator across the AST (for example `schema.type === schemaTypes.object`).
*/
const schemaTypes = {
	/**
	* Text value.
	*/
	string: "string",
	/**
	* Floating-point number (`float`, `double`).
	*/
	number: "number",
	/**
	* Whole number (`int32`). Use `bigint` for `int64`.
	*/
	integer: "integer",
	/**
	* 64-bit integer (`int64`). Only used when `integerType` is set to `'bigint'`.
	*/
	bigint: "bigint",
	/**
	* Boolean value.
	*/
	boolean: "boolean",
	/**
	* Explicit null value.
	*/
	null: "null",
	/**
	* Any value (no type restriction).
	*/
	any: "any",
	/**
	* Unknown value (must be narrowed before usage).
	*/
	unknown: "unknown",
	/**
	* No return value (`void`).
	*/
	void: "void",
	/**
	* Object with named properties.
	*/
	object: "object",
	/**
	* Sequential list of items.
	*/
	array: "array",
	/**
	* Fixed-length list with position-specific items.
	*/
	tuple: "tuple",
	/**
	* "One of" multiple schema members.
	*/
	union: "union",
	/**
	* "All of" multiple schema members.
	*/
	intersection: "intersection",
	/**
	* Enum schema.
	*/
	enum: "enum",
	/**
	* Reference to another schema.
	*/
	ref: "ref",
	/**
	* Calendar date (for example `2026-03-24`).
	*/
	date: "date",
	/**
	* Date-time value (for example `2026-03-24T09:00:00Z`).
	*/
	datetime: "datetime",
	/**
	* Time-only value (for example `09:00:00`).
	*/
	time: "time",
	/**
	* UUID value.
	*/
	uuid: "uuid",
	/**
	* Email address value.
	*/
	email: "email",
	/**
	* URL value.
	*/
	url: "url",
	/**
	* IPv4 address value.
	*/
	ipv4: "ipv4",
	/**
	* IPv6 address value.
	*/
	ipv6: "ipv6",
	/**
	* Binary/blob value.
	*/
	blob: "blob",
	/**
	* Impossible value (`never`).
	*/
	never: "never"
};
//#endregion
//#region src/guards.ts
/**
* Narrows a `SchemaNode` to the variant that matches `type`.
*
* @example
* ```ts
* const schema = createSchema({ type: 'string' })
* const stringNode = narrowSchema(schema, 'string') // StringSchemaNode | null
* ```
*/
function narrowSchema(node, type) {
	return node?.type === type ? node : null;
}
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
function isHttpOperationNode(node) {
	return node.protocol === "http" || node.method !== void 0 && node.path !== void 0;
}
//#endregion
//#region src/defineNode.ts
/**
* Visitor callback names, one per traversable node kind, in traversal order.
* Kept in sync with the keys of `Visitor` in `visitor.ts`.
*/
const visitorKeys = [
	"input",
	"output",
	"operation",
	"schema",
	"property",
	"parameter",
	"response"
];
/**
* Builds a type guard that matches nodes of the given `kind`.
*/
function isKind(kind) {
	return (node) => node?.kind === kind;
}
/**
* Defines a node once and derives its `create` builder, `is` guard, and traversal
* metadata. `create` merges `defaults`, the `build` hook (or the raw input), and the
* `kind`, so node construction lives in one place without scattered `as` casts.
*
* @example Simple node
* ```ts
* const importDef = defineNode<ImportNode>({ kind: 'Import' })
* const createImport = importDef.create
* ```
*
* @example Node with a build hook
* ```ts
* const propertyDef = defineNode<PropertyNode, UserPropertyNode>({
*   kind: 'Property',
*   build: (props) => ({ ...props, required: props.required ?? false }),
*   children: ['schema'],
*   visitorKey: 'property',
* })
* ```
*/
function defineNode(config) {
	const { kind, defaults, build, children, visitorKey } = config;
	function create(input) {
		const base = build ? build(input) : input;
		const node = {
			kind,
			...defaults,
			...base
		};
		node.kind = kind;
		return node;
	}
	return {
		kind,
		create,
		is: isKind(kind),
		children,
		visitorKey
	};
}
//#endregion
//#region src/nodes/code.ts
/**
* Definition for the {@link ConstNode}.
*/
const constDef = defineNode({ kind: "Const" });
/**
* Definition for the {@link TypeNode}.
*/
const typeDef = defineNode({ kind: "Type" });
/**
* Definition for the {@link FunctionNode}.
*/
const functionDef = defineNode({ kind: "Function" });
/**
* Definition for the {@link ArrowFunctionNode}.
*/
const arrowFunctionDef = defineNode({ kind: "ArrowFunction" });
/**
* Definition for the {@link TextNode}.
*/
const textDef = defineNode({
	kind: "Text",
	build: (value) => ({ value })
});
/**
* Definition for the {@link BreakNode}.
*/
const breakDef = defineNode({
	kind: "Break",
	build: () => ({})
});
/**
* Definition for the {@link JsxNode}.
*/
const jsxDef = defineNode({
	kind: "Jsx",
	build: (value) => ({ value })
});
/**
* Creates a `ConstNode` representing a TypeScript `const` declaration.
*
* @example Exported constant with type and `as const`
* ```ts
* createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true })
* // export const pets: Pet[] = ... as const
* ```
*/
const createConst = constDef.create;
/**
* Creates a `TypeNode` representing a TypeScript `type` alias declaration.
*
* @example
* ```ts
* createType({ name: 'Pet', export: true })
* // export type Pet = ...
* ```
*/
const createType = typeDef.create;
/**
* Creates a `FunctionNode` representing a TypeScript `function` declaration.
*
* @example
* ```ts
* createFunction({ name: 'fetchPet', export: true, async: true, returnType: 'Pet' })
* // export async function fetchPet(): Promise<Pet> { ... }
* ```
*/
const createFunction = functionDef.create;
/**
* Creates an `ArrowFunctionNode` representing a TypeScript arrow function.
*
* @example
* ```ts
* createArrowFunction({ name: 'double', export: true, params: 'n: number', singleLine: true })
* // export const double = (n: number) => ...
* ```
*/
const createArrowFunction = arrowFunctionDef.create;
/**
* Creates a {@link TextNode} representing a raw string fragment in the source output.
*
* @example
* ```ts
* createText('return fetch(id)')
* // { kind: 'Text', value: 'return fetch(id)' }
* ```
*/
const createText = textDef.create;
/**
* Creates a {@link BreakNode} representing a line break in the source output.
*
* @example
* ```ts
* createBreak()
* // { kind: 'Break' }
* ```
*/
function createBreak() {
	return breakDef.create();
}
/**
* Creates a {@link JsxNode} representing a raw JSX fragment in the source output.
*
* @example
* ```ts
* createJsx('<>\n  <a href={href}>Open</a>\n</>')
* // { kind: 'Jsx', value: '<>\n  <a href={href}>Open</a>\n</>' }
* ```
*/
const createJsx = jsxDef.create;
//#endregion
//#region src/nodes/content.ts
/**
* Definition for the {@link ContentNode}.
*/
const contentDef = defineNode({
	kind: "Content",
	children: ["schema"]
});
/**
* Creates a `ContentNode` for a single request-body or response content type.
*/
const createContent = contentDef.create;
//#endregion
//#region ../../internals/utils/src/fs.ts
/**
* Strips the file extension from a path or file name.
* Only removes the last `.ext` segment when the dot is not part of a directory name.
*
* @example
* trimExtName('petStore.ts')             // 'petStore'
* trimExtName('/src/models/pet.ts')      // '/src/models/pet'
* trimExtName('/project.v2/gen/pet.ts')  // '/project.v2/gen/pet'
* trimExtName('noExtension')             // 'noExtension'
*/
function trimExtName(text) {
	const dotIndex = text.lastIndexOf(".");
	if (dotIndex > 0 && !text.includes("/", dotIndex)) return text.slice(0, dotIndex);
	return text;
}
//#endregion
//#region ../../internals/utils/src/promise.ts
/**
* Wraps `factory` with a keyed cache backed by the provided store.
*
* Pass a `WeakMap` for object keys (results are GC-eligible when the key is
* collected) or a `Map` for primitive keys. For multi-argument functions,
* nest two `memoize` calls — the outer keyed by the first argument, the
* inner (created once per outer miss) keyed by the second.
*
* Because the cache is owned by the caller, it can be shared, inspected, or
* cleared independently of the memoized function.
*
* @example Single WeakMap key
* ```ts
* const cache = new WeakMap<SchemaNode, Set<string>>()
* const getRefs = memoize(cache, (node) => collectRefs(node))
* ```
*
* @example Single Map key (primitive)
* ```ts
* const cache = new Map<string, Resolver>()
* const getResolver = memoize(cache, (name) => buildResolver(name))
* ```
*
* @example Two-level (object + primitive)
* ```ts
* const outer = new WeakMap<Params[], Map<string, Params[]>>()
* const fn = memoize(outer, (params) => memoize(new Map(), (key) => transform(params, key)))
* fn(params)('camelcase')
* ```
*/
function memoize(store, factory) {
	return (key) => {
		if (store.has(key)) return store.get(key);
		const value = factory(key);
		store.set(key, value);
		return value;
	};
}
//#endregion
//#region src/utils/extractStringsFromNodes.ts
/**
* Extracts all string content from a `CodeNode` tree recursively.
*
* Collects text node values, identifier references in string fields (`params`, `generics`, `returnType`, `type`),
* and nested node content. Used to build the full source string for import filtering.
*/
function extractStringsFromNodes(nodes) {
	if (!nodes?.length) return "";
	const collected = [];
	for (const node of nodes) {
		if (typeof node === "string") {
			if (node) collected.push(node);
			continue;
		}
		if (node.kind === "Text") {
			if (node.value) collected.push(node.value);
			continue;
		}
		if (node.kind === "Break") continue;
		if (node.kind === "Jsx") {
			if (node.value) collected.push(node.value);
			continue;
		}
		const parts = [];
		if ("params" in node && node.params) parts.push(node.params);
		if ("generics" in node && node.generics) parts.push(Array.isArray(node.generics) ? node.generics.join(", ") : node.generics);
		if ("returnType" in node && node.returnType) parts.push(node.returnType);
		if ("type" in node && typeof node.type === "string") parts.push(node.type);
		const nested = extractStringsFromNodes(node.nodes);
		if (nested) parts.push(nested);
		if (parts.length) collected.push(parts.join("\n"));
	}
	return collected.join("\n");
}
//#endregion
//#region src/utils/combineFileMembers.ts
const IDENTIFIER_RUN = /[\w$]+/g;
/**
* How many imports a file needs before indexing the source beats scanning it once per name.
*/
const INDEX_ABOVE_IMPORTS = 128;
/**
* Every unbroken run of identifier characters in the source.
*/
function collectIdentifiers(source) {
	return new Set(source.match(IDENTIFIER_RUN));
}
function sourceKey(source) {
	return `${source.name ?? extractStringsFromNodes(source.nodes)}:${source.isExportable ?? false}:${source.isTypeOnly ?? false}`;
}
function pathTypeKey(path, isTypeOnly) {
	return `${path}:${isTypeOnly ?? false}`;
}
function exportKey(path, name, isTypeOnly, asAlias) {
	return `${path}:${name ?? ""}:${isTypeOnly ?? false}:${asAlias ?? ""}`;
}
function importKey(path, name, isTypeOnly) {
	return `${path}:${name ?? ""}:${isTypeOnly ?? false}`;
}
/**
* Computes a multi-level sort key for exports and imports:
* non-array names first (wildcards/namespace aliases). Type-only before value. Alphabetical path. Unnamed before named.
*/
function sortKey(node) {
	const isArray = Array.isArray(node.name) ? "1" : "0";
	const typeOnly = node.isTypeOnly ? "0" : "1";
	const hasName = node.name != null ? "1" : "0";
	const name = Array.isArray(node.name) ? node.name.toSorted().join("\0") : node.name ?? "";
	return `${isArray}:${typeOnly}:${node.path}:${hasName}:${name}`;
}
/**
* Deduplicates `SourceNode` objects by `name + isExportable + isTypeOnly`, keeping the first of each
* key. Unnamed sources fall back to their extracted node strings as the name part of the key. Returns
* the deduplicated array in original order.
*/
function combineSources(sources) {
	const seen = /* @__PURE__ */ new Map();
	for (const source of sources) {
		const key = sourceKey(source);
		if (!seen.has(key)) seen.set(key, source);
	}
	return [...seen.values()];
}
/**
* Merges `incoming` names into `existing`, preserving order and dropping duplicates.
*
* Shared by `combineExports` and `combineImports` for the same-path name-merge case.
*/
function mergeNameArrays(existing, incoming) {
	const merged = new Set(existing);
	for (const name of incoming) merged.add(name);
	return [...merged];
}
/**
* Deduplicates and merges `ExportNode` objects by path and type.
*
* Named exports with the same path and `isTypeOnly` flag have their names merged into a single export.
* Non-array exports are deduplicated by exact identity. Returns a sorted, deduplicated array.
*/
function combineExports(exports) {
	const result = [];
	const namedByPath = /* @__PURE__ */ new Map();
	const seen = /* @__PURE__ */ new Set();
	const keyed = exports.map((node) => ({
		node,
		key: sortKey(node)
	}));
	keyed.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
	for (const { node: curr } of keyed) {
		const { name, path, isTypeOnly, asAlias } = curr;
		if (Array.isArray(name)) {
			if (!name.length) continue;
			const key = pathTypeKey(path, isTypeOnly);
			const existing = namedByPath.get(key);
			if (existing && Array.isArray(existing.name)) existing.name = mergeNameArrays(existing.name, name);
			else {
				const newItem = {
					...curr,
					name: [...new Set(name)]
				};
				result.push(newItem);
				namedByPath.set(key, newItem);
			}
		} else {
			const key = exportKey(path, name, isTypeOnly, asAlias);
			if (!seen.has(key)) {
				result.push(curr);
				seen.add(key);
			}
		}
	}
	return result;
}
/**
* Deduplicates and merges `ImportNode` objects, filtering out unused imports.
*
* Retains imports that are referenced in `source` or re-exported. Imports with the same path and
* `isTypeOnly` flag have their names merged. Returns a sorted, deduplicated, filtered array.
*/
function combineImports(imports, exports, source) {
	const exportedNames = new Set(exports.flatMap((e) => Array.isArray(e.name) ? e.name : e.name ? [e.name] : []));
	const identifiers = source && imports.length > INDEX_ABOVE_IMPORTS ? collectIdentifiers(source) : null;
	const isUsed = (importName) => !source || identifiers?.has(importName) || source.includes(importName) || exportedNames.has(importName);
	const importNameMemo = /* @__PURE__ */ new Map();
	const canonicalizeName = (n) => {
		if (typeof n === "string") return n;
		const key = `${n.propertyName}:${n.name ?? ""}`;
		if (!importNameMemo.has(key)) importNameMemo.set(key, n);
		return importNameMemo.get(key);
	};
	const pathsWithUsedNamedImport = /* @__PURE__ */ new Set();
	for (const node of imports) {
		if (!Array.isArray(node.name)) continue;
		if (node.name.some((item) => typeof item === "string" ? isUsed(item) : isUsed(item.name ?? item.propertyName))) pathsWithUsedNamedImport.add(node.path);
	}
	const result = [];
	const namedByPath = /* @__PURE__ */ new Map();
	const seen = /* @__PURE__ */ new Set();
	const keyed = imports.map((node) => ({
		node,
		key: sortKey(node)
	}));
	keyed.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
	for (const { node: curr } of keyed) {
		if (curr.path === curr.root) continue;
		const { path, isTypeOnly } = curr;
		let { name } = curr;
		if (Array.isArray(name)) {
			name = [...new Set(name.map(canonicalizeName))].filter((item) => typeof item === "string" ? isUsed(item) : isUsed(item.name ?? item.propertyName));
			if (!name.length) continue;
			const key = pathTypeKey(path, isTypeOnly);
			const existing = namedByPath.get(key);
			if (existing && Array.isArray(existing.name)) existing.name = mergeNameArrays(existing.name, name);
			else {
				const newItem = {
					...curr,
					name
				};
				result.push(newItem);
				namedByPath.set(key, newItem);
			}
		} else {
			if (name && !isUsed(name) && !pathsWithUsedNamedImport.has(path)) continue;
			const key = importKey(path, name, isTypeOnly);
			if (!seen.has(key)) {
				result.push(curr);
				seen.add(key);
			}
		}
	}
	return result;
}
//#endregion
//#region src/nodes/file.ts
/**
* Definition for the {@link ImportNode}.
*/
const importDef = defineNode({ kind: "Import" });
/**
* Definition for the {@link ExportNode}.
*/
const exportDef = defineNode({ kind: "Export" });
/**
* Definition for the {@link SourceNode}.
*/
const sourceDef = defineNode({ kind: "Source" });
/**
* Definition for the {@link FileNode}. The fully resolved builder lives in
* `createFile`, so this definition only supplies the guard.
*/
const fileDef = defineNode({ kind: "File" });
/**
* Creates an `ImportNode` representing a language-agnostic import/dependency declaration.
*
* @example Named import
* ```ts
* createImport({ name: ['useState'], path: 'react' })
* // import { useState } from 'react'
* ```
*/
const createImport = importDef.create;
/**
* Creates an `ExportNode` representing a language-agnostic export/public API declaration.
*
* @example Named export
* ```ts
* createExport({ name: ['Pet'], path: './Pet' })
* // export { Pet } from './Pet'
* ```
*/
const createExport = exportDef.create;
/**
* Creates a `SourceNode` representing a fragment of source code within a file.
*
* @example
* ```ts
* createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], isExportable: true })
* ```
*/
const createSource = sourceDef.create;
/**
* Creates a fully resolved `FileNode` from a file input descriptor.
*
* Computes:
* - `id` SHA256 hash of the file path
* - `name` `baseName` without extension
* - `extname` extension extracted from `baseName`
*
* Deduplicates:
* - `sources` via `combineSources`
* - `exports` via `combineExports`
* - `imports` via `combineImports` (also filters unused imports)
*
* @throws {Error} when `baseName` has no extension.
*
* @example
* ```ts
* const file = createFile({
*   baseName: 'petStore.ts',
*   path: 'src/models/petStore.ts',
*   sources: [createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')] })],
*   imports: [createImport({ name: ['z'], path: 'zod' })],
*   exports: [createExport({ name: ['Pet'], path: './petStore' })],
* })
* // file.id      = SHA256 hash of 'src/models/petStore.ts'
* // file.name    = 'petStore'
* // file.extname = '.ts'
* ```
*
* @example Copy a real file into the output verbatim
* ```ts
* const file = createFile({
*   baseName: 'client.ts',
*   path: 'src/gen/client.ts',
*   copy: '/abs/path/to/templates/client.ts',
* })
* ```
*/
function createFile(input) {
	const extname = node_path.default.extname(input.baseName);
	if (!extname) throw new Error(`No extname found for ${input.baseName}`);
	const resolvedExports = input.exports?.length ? combineExports(input.exports) : [];
	const resolvedImports = (() => {
		if (!input.imports?.length) return [];
		const sourceParts = [];
		const localNames = /* @__PURE__ */ new Set();
		for (const item of input.sources ?? []) {
			const extracted = item.nodes && extractStringsFromNodes(item.nodes);
			if (extracted) sourceParts.push(extracted);
			if (item.name) localNames.add(item.name);
		}
		const source = sourceParts.join("\n") || void 0;
		const combinedImports = combineImports(input.imports, resolvedExports, source);
		const nameOf = (item) => typeof item === "string" ? item : item.name ?? item.propertyName;
		return combinedImports.flatMap((imp) => {
			if (imp.path === input.path) return [];
			if (!Array.isArray(imp.name)) return typeof imp.name === "string" && localNames.has(imp.name) ? [] : [imp];
			const kept = imp.name.filter((item) => !localNames.has(nameOf(item)));
			if (!kept.length) return [];
			return [kept.length === imp.name.length ? imp : {
				...imp,
				name: kept
			}];
		});
	})();
	const resolvedSources = input.sources?.length ? combineSources(input.sources) : [];
	return {
		kind: "File",
		...input,
		id: (0, node_crypto.hash)("sha256", input.path, "hex"),
		name: trimExtName(input.baseName),
		extname,
		imports: resolvedImports,
		exports: resolvedExports,
		sources: resolvedSources,
		meta: input.meta ?? {}
	};
}
//#endregion
//#region src/nodes/input.ts
/**
* Definition for the {@link InputNode}.
*/
const inputDef = defineNode({
	kind: "Input",
	defaults: {
		schemas: [],
		operations: [],
		meta: {
			circularNames: [],
			enumNames: []
		}
	},
	children: ["schemas", "operations"],
	visitorKey: "input"
});
/**
* Creates an `InputNode`, defaulting `schemas`/`operations` to empty arrays and `meta` per
* {@link inputDef}.
*
* @example
* ```ts
* const input = createInput()
* // { kind: 'Input', schemas: [], operations: [] }
* ```
*/
function createInput(overrides = {}) {
	return inputDef.create(overrides);
}
//#endregion
//#region src/nodes/requestBody.ts
/**
* Definition for the {@link RequestBodyNode}. Content entries are built upfront with
* {@link createContent}, mirroring how `parameters` and `responses` take prebuilt nodes.
*/
const requestBodyDef = defineNode({
	kind: "RequestBody",
	children: ["content"]
});
/**
* Creates a `RequestBodyNode`.
*/
const createRequestBody = requestBodyDef.create;
//#endregion
//#region src/nodes/operation.ts
/**
* Definition for the {@link OperationNode}. HTTP operations (those carrying both
* `method` and `path`) are tagged with `protocol: 'http'`, and the request body is
* normalized into a `RequestBodyNode`.
*/
const operationDef = defineNode({
	kind: "Operation",
	build: (props) => {
		const { requestBody, ...rest } = props;
		const isHttp = rest.method !== void 0 && rest.path !== void 0;
		return {
			tags: [],
			parameters: [],
			responses: [],
			...rest,
			...isHttp ? { protocol: "http" } : {},
			requestBody: requestBody ? createRequestBody(requestBody) : void 0
		};
	},
	children: [
		"parameters",
		"requestBody",
		"responses"
	],
	visitorKey: "operation"
});
function createOperation(props) {
	return operationDef.create(props);
}
//#endregion
//#region src/nodes/output.ts
/**
* Definition for the {@link OutputNode}.
*/
const outputDef = defineNode({
	kind: "Output",
	defaults: { files: [] },
	visitorKey: "output"
});
/**
* Creates an `OutputNode` with a stable default for `files`.
*
* @example
* ```ts
* const output = createOutput()
* // { kind: 'Output', files: [] }
* ```
*/
function createOutput(overrides = {}) {
	return outputDef.create(overrides);
}
//#endregion
//#region src/optionality.ts
/**
* Generic JSON Schema optionality: a non-required field is optional, and a
* non-required nullable field is nullish.
*/
function optionality(schema, required) {
	const nullable = schema.nullable ?? false;
	return {
		...schema,
		optional: !required && !nullable ? true : void 0,
		nullish: !required && nullable ? true : void 0
	};
}
//#endregion
//#region src/nodes/parameter.ts
/**
* Definition for the {@link ParameterNode}. `required` defaults to `false`, and the schema's
* `optional`/`nullish` flags are derived from it through {@link optionality}.
*/
const parameterDef = defineNode({
	kind: "Parameter",
	build: (props) => {
		const required = props.required ?? false;
		return {
			...props,
			required,
			schema: optionality(props.schema, required)
		};
	},
	children: ["schema"],
	visitorKey: "parameter"
});
/**
* Creates a `ParameterNode`.
*
* @example
* ```ts
* const param = createParameter({
*   name: 'petId',
*   in: 'path',
*   required: true,
*   schema: createSchema({ type: 'string' }),
* })
* ```
*/
const createParameter = parameterDef.create;
//#endregion
//#region src/nodes/property.ts
/**
* Definition for the {@link PropertyNode}. `required` defaults to `false`, and the schema's
* `optional`/`nullish` flags are derived from it through {@link optionality}.
*/
const propertyDef = defineNode({
	kind: "Property",
	build: (props) => {
		const required = props.required ?? false;
		return {
			...props,
			required,
			schema: optionality(props.schema, required)
		};
	},
	children: ["schema"],
	visitorKey: "property"
});
/**
* Creates a `PropertyNode`.
*
* @example
* ```ts
* const property = createProperty({
*   name: 'status',
*   required: true,
*   schema: createSchema({ type: 'string', nullable: true }),
* })
* // required=true, no optional/nullish
* ```
*/
const createProperty = propertyDef.create;
//#endregion
//#region src/nodes/response.ts
/**
* Definition for the {@link ResponseNode}. A single legacy `schema` (with optional
* `mediaType`/`keysToOmit`) is normalized into one `content` entry.
*/
const responseDef = defineNode({
	kind: "Response",
	build: (props) => {
		const { schema, mediaType, keysToOmit, content, ...rest } = props;
		const entries = content ?? (schema ? [createContent({
			contentType: mediaType ?? "application/json",
			schema,
			keysToOmit: keysToOmit ?? null
		})] : void 0);
		return {
			...rest,
			content: entries
		};
	},
	children: ["content"],
	visitorKey: "response"
});
/**
* Creates a `ResponseNode`.
*
* @example
* ```ts
* const response = createResponse({
*   statusCode: '200',
*   content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object', properties: [] }) })],
* })
* ```
*/
const createResponse = responseDef.create;
//#endregion
//#region src/nodes/schema.ts
/**
* Maps schema `type` to its underlying `primitive`.
* Primitive types map to themselves and special string formats map to `'string'`.
* Any type not listed here (such as `ref`, `enum`, `union`, `intersection`, `tuple`, `ipv4`, `ipv6`, `blob`) has no `primitive`.
*/
const TYPE_TO_PRIMITIVE = {
	string: "string",
	number: "number",
	integer: "integer",
	bigint: "bigint",
	boolean: "boolean",
	null: "null",
	any: "any",
	unknown: "unknown",
	void: "void",
	never: "never",
	object: "object",
	array: "array",
	date: "date",
	uuid: "string",
	email: "string",
	url: "string",
	datetime: "string",
	time: "string"
};
/**
* Definition for the {@link SchemaNode}. Object schemas default `properties` to an
* empty array, and `primitive` is inferred from `type` when not explicitly provided.
*/
const schemaDef = defineNode({
	kind: "Schema",
	build: (props) => {
		if (props.type === "object") return {
			properties: [],
			primitive: "object",
			...props
		};
		return {
			primitive: TYPE_TO_PRIMITIVE[props.type],
			...props
		};
	},
	children: [
		"properties",
		"items",
		"members",
		"additionalProperties"
	],
	visitorKey: "schema"
});
function createSchema(props) {
	return schemaDef.create(props);
}
//#endregion
//#region src/registry.ts
/**
* Every node definition. Adding a node means adding its `defineNode` to one
* `nodes/*.ts` file and listing it here. The visitor tables in `visitor.ts` derive from it.
*/
const nodeDefs = [
	inputDef,
	outputDef,
	operationDef,
	requestBodyDef,
	contentDef,
	responseDef,
	schemaDef,
	propertyDef,
	parameterDef,
	constDef,
	typeDef,
	functionDef,
	arrowFunctionDef,
	textDef,
	breakDef,
	jsxDef,
	importDef,
	exportDef,
	sourceDef,
	fileDef
];
//#endregion
//#region src/visitor.ts
/**
* Child node fields per node kind, in traversal order (Babel's `VISITOR_KEYS`).
* Derived from each definition's `children`.
*/
const VISITOR_KEYS = Object.fromEntries(nodeDefs.flatMap((def) => def.children ? [[def.kind, def.children]] : []));
/**
* Maps a node kind to the matching visitor callback name. Derived from each
* definition's `visitorKey`.
*/
const VISITOR_KEY_BY_KIND = Object.fromEntries(nodeDefs.flatMap((def) => def.visitorKey ? [[def.kind, def.visitorKey]] : []));
const visitorKeysByKind = VISITOR_KEYS;
/**
* Returns `true` when `value` is an AST node (an object carrying a `kind`).
*/
function isNode(value) {
	return typeof value === "object" && value !== null && typeof value.kind === "string";
}
/**
* Returns the immediate traversable children of `node` based on {@link VISITOR_KEYS}.
*
* `Schema` children are only included when `recurse` is `true`. Shallow mode skips them.
*
* @example
* ```ts
* const children = getChildren(operationNode, true)
* // returns parameters, the request body, and responses
* ```
*/
function* getChildren(node, recurse) {
	if (node.kind === "Schema" && !recurse) return;
	const keys = visitorKeysByKind[node.kind];
	if (!keys) return;
	const record = node;
	for (const key of keys) {
		const value = record[key];
		if (Array.isArray(value)) {
			for (const item of value) if (isNode(item)) yield item;
		} else if (isNode(value)) yield value;
	}
}
/**
* Runs the visitor callback that matches `node.kind` with the traversal
* context. The result is a replacement node, a collected value, or `undefined`
* when no callback is registered for the kind.
*
* Shared by `transform` and `collect` so node-kind dispatch lives in one place.
* `TResult` is the caller's expected return: the same node type for `transform`,
* the collected value type for `collect`.
*/
function applyVisitor(node, visitor, parent) {
	const key = VISITOR_KEY_BY_KIND[node.kind];
	if (!key) return void 0;
	const fn = visitor[key];
	return fn?.(node, { parent });
}
function transform(node, options) {
	const { depth, parent, ...visitor } = options;
	return transformNode(node, visitor, (depth ?? visitorDepths.deep) === visitorDepths.deep, parent);
}
/**
* Visits a single node, then immutably rebuilds its children. Returns the original
* reference when neither the visitor nor the child rebuild changed anything, so callers
* can detect "nothing changed" by identity and ancestors avoid reallocating.
*/
function transformNode(node, visitor, recurse, parent) {
	return transformChildren(applyVisitor(node, visitor, parent) ?? node, visitor, recurse);
}
/**
* Immutably rebuilds a node's children using {@link VISITOR_KEYS}, transforming
* each child node and leaving non-node values (e.g. `additionalProperties: true`) intact.
* `Schema` children are skipped in shallow mode.
*/
function transformChildren(node, visitor, recurse) {
	if (node.kind === "Schema" && !recurse) return node;
	const keys = visitorKeysByKind[node.kind];
	if (!keys) return node;
	const record = node;
	let updates;
	for (const key of keys) {
		if (!(key in record)) continue;
		const value = record[key];
		if (Array.isArray(value)) {
			let mapped;
			for (const [i, item] of value.entries()) {
				const next = isNode(item) ? transformNode(item, visitor, recurse, node) : item;
				if (mapped) {
					mapped.push(next);
					continue;
				}
				if (next !== item) mapped = [...value.slice(0, i), next];
			}
			if (mapped) (updates ??= {})[key] = mapped;
		} else if (isNode(value)) {
			const next = transformNode(value, visitor, recurse, node);
			if (next !== value) (updates ??= {})[key] = next;
		}
	}
	if (!updates) return node;
	return {
		...node,
		...updates
	};
}
/**
* Lazy depth-first collection pass. Yields every non-null value returned by
* the visitor callbacks. Use `collectSync` for the eager array form.
*
* @example Collect every operationId
* ```ts
* const ids: string[] = []
* for (const id of collect<string>(root, {
*   operation(node) {
*     return node.operationId
*   },
* })) {
*   ids.push(id)
* }
* ```
*/
function* collect(node, options) {
	const { depth, parent, ...visitor } = options;
	yield* collectNode(node, visitor, (depth ?? visitorDepths.deep) === visitorDepths.deep, parent);
}
function* collectNode(node, visitor, recurse, parent) {
	const v = applyVisitor(node, visitor, parent);
	if (v != null) yield v;
	for (const child of getChildren(node, recurse)) yield* collectNode(child, visitor, recurse, node);
}
/**
* Eager depth-first collection pass. Gathers every non-null value the visitor
* callbacks return into an array.
*
* @example Collect every operationId
* ```ts
* const ids = collectSync<string>(root, {
*   operation(node) {
*     return node.operationId
*   },
* })
* ```
*/
function collectSync(node, options) {
	return Array.from(collect(node, options));
}
//#endregion
//#region src/defineMacro.ts
/**
* Sort weight for an `enforce` hint. `pre` sorts before unmarked items and `post` after, so a plain
* list keeps its authored order.
*/
function enforceWeight(enforce) {
	if (enforce === "pre") return 0;
	if (enforce === "post") return 2;
	return 1;
}
/**
* Types a macro for inference and a single construction site, mirroring `definePlugin`.
* Adds no runtime behavior.
*
* @example
* ```ts
* const macroUntagged = defineMacro({
*   name: 'untagged',
*   operation(node) {
*     return node.tags?.length ? undefined : { ...node, tags: ['untagged'] }
*   },
* })
* ```
*/
function defineMacro(macro) {
	return macro;
}
/**
* Runs every macro's callback for one node kind in order, chaining the result so each macro sees
* the previous macro's output. Returns `undefined` when nothing changed, so `transform` keeps the
* original reference (structural sharing).
*/
function chain({ macros, key, node, context }) {
	let current = node;
	for (const macro of macros) {
		const callback = macro[key];
		if (!callback) continue;
		if (macro.match && !macro.match(current)) continue;
		const next = callback(current, context);
		if (next != null) current = next;
	}
	return current === node ? void 0 : current;
}
/**
* Folds an ordered list of macros into a single {@link Visitor} that `transform` (and the per-plugin
* transform layer in `@kubb/core`) can run. Macros are stable-sorted by `enforce`, then applied
* sequentially per node so later macros see earlier output. This differs from a plain visitor, which
* has no names, ordering, or composition.
*
* @example
* ```ts
* const visitor = composeMacros([macroSimplifyUnion, macroDiscriminatorEnum])
* const next = transform(root, visitor)
* ```
*/
function composeMacros(macros) {
	const ordered = [...macros].sort((a, b) => enforceWeight(a.enforce) - enforceWeight(b.enforce));
	const visitor = {};
	for (const key of visitorKeys) {
		if (!ordered.some((macro) => typeof macro[key] === "function")) continue;
		const callback = (node, context) => chain({
			macros: ordered,
			key,
			node,
			context
		});
		visitor[key] = callback;
	}
	return visitor;
}
/**
* Runs a list of macros over a node tree and returns the rewritten tree. Keeps `transform`'s
* structural sharing, so an empty or no-op macro list returns the same reference. Pass
* `depth: 'shallow'` to rewrite the root node only.
*
* @example
* ```ts
* const next = applyMacros(root, [macroIntegerToString])
* ```
*
* @example Apply to the root node only
* ```ts
* const named = applyMacros(node, [macroEnumName({ parentName, propName, enumSuffix })], { depth: 'shallow' })
* ```
*/
function applyMacros(root, macros, options) {
	if (macros.length === 0) return root;
	return transform(root, {
		...composeMacros(macros),
		...options
	});
}
//#endregion
//#region src/createPrinter.ts
/**
* Creates a schema printer: a function that takes a `SchemaNode` and emits
* code in your target language. Each plugin that produces code from schemas
* (TypeScript types, Zod schemas, Faker factories) ships a printer built
* with this helper.
*
* The builder receives resolved options and returns:
*
* - `name` unique identifier for the printer.
* - `options` stored on the returned printer instance.
* - `nodes` map of `SchemaType` → handler. Handlers return the rendered
*   output (a string, a TypeScript AST node, ...) for that schema type.
* - `overrides` (optional), user-supplied handlers that win over `nodes`.
*   An override can call `this.base(node)` to reuse the handler it replaced.
* - `print` (optional), top-level override exposed as `printer.print`.
*   Use `this.transform(node)` inside it to dispatch to `nodes` recursively.
*
* Without a `print` override, `printer.print` falls back to `printer.transform`
* (the node-level dispatcher).
*
* @example Tiny Zod printer
* ```ts
* import { createPrinter, type PrinterFactoryOptions } from '@kubb/ast'
*
* type PrinterZod = PrinterFactoryOptions<'zod', { strict?: boolean }, string>
*
* export const zodPrinter = createPrinter<PrinterZod>((options) => ({
*   name: 'zod',
*   options: { strict: options.strict ?? true },
*   nodes: {
*     string: () => 'z.string()',
*     object(node) {
*       const props = node.properties
*         .map((p) => `${p.name}: ${this.transform(p.schema)}`)
*         .join(', ')
*       return `z.object({ ${props} })`
*     },
*   },
* }))
* ```
*/
function createPrinter(build) {
	return (options) => {
		const { name, options: resolvedOptions, nodes, overrides, print: printOverride } = build(options ?? {});
		const merged = overrides ? {
			...nodes,
			...overrides
		} : nodes;
		const context = {
			options: resolvedOptions,
			transform: (node) => {
				const handler = merged[node.type];
				if (!handler) return null;
				return handler.call(context, node);
			},
			base: (node) => {
				const handler = nodes[node.type];
				if (!handler) return null;
				return handler.call(context, node);
			}
		};
		return {
			name,
			options: resolvedOptions,
			transform: context.transform,
			print: printOverride ? printOverride.bind(context) : context.transform
		};
	};
}
//#endregion
//#region src/utils/refs.ts
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
function resolveRefName(node) {
	if (!node || node.type !== "ref") return null;
	if (node.targetName) return node.targetName;
	if (node.ref) return node.ref.split("/").at(-1) ?? node.ref;
	return node.name ?? node.schema?.name ?? null;
}
//#endregion
//#region src/utils/schemaGraph.ts
/**
* Memoized inner pass that walks a single node and returns the names of every schema it references.
*/
const collectSchemaRefs = memoize(/* @__PURE__ */ new WeakMap(), (node) => {
	const refs = /* @__PURE__ */ new Set();
	collectSync(node, { schema(child) {
		if (child.type === "ref") {
			const name = resolveRefName(child);
			if (name) refs.add(name);
		}
	} });
	return refs;
});
/**
* Collects the names of every ref found anywhere inside a node's own subtree.
*
* Each ref contributes its name only, so the schema it points to is never traversed here. Pass `out`
* to accumulate names from several nodes into one set.
*
* @example Collect refs from a single schema
* ```ts
* const names = collectReferencedSchemaNames(petSchema)
* // Set { 'Category', 'Tag' }
* ```
*
* @example Accumulate refs from multiple schemas into one set
* ```ts
* const out = new Set<string>()
* for (const schema of schemas) {
*   collectReferencedSchemaNames(schema, out)
* }
* ```
*/
function collectReferencedSchemaNames(node, out = /* @__PURE__ */ new Set()) {
	if (!node) return out;
	for (const name of collectSchemaRefs(node)) out.add(name);
	return out;
}
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
const collectImportedRefNames = memoize(/* @__PURE__ */ new WeakMap(), (node) => {
	const seen = /* @__PURE__ */ new Set();
	const names = [];
	collectSync(node, { schema(child) {
		if (child.type !== "ref" || !child.ref) return;
		const name = resolveRefName(child);
		if (name && !seen.has(name)) {
			seen.add(name);
			names.push(name);
		}
	} });
	return names;
});
function computeUsedSchemaNames(operations, schemas) {
	const schemaMap = /* @__PURE__ */ new Map();
	for (const schema of schemas) if (schema.name) schemaMap.set(schema.name, schema);
	const result = /* @__PURE__ */ new Set();
	function visitSchema(schema) {
		const directRefs = collectReferencedSchemaNames(schema);
		for (const name of directRefs) if (!result.has(name)) {
			result.add(name);
			const namedSchema = schemaMap.get(name);
			if (namedSchema) visitSchema(namedSchema);
		}
	}
	for (const op of operations) for (const schema of collect(op, {
		depth: "shallow",
		schema: (node) => node
	})) visitSchema(schema);
	return result;
}
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
function collectUsedSchemaNames(operations, schemas) {
	return computeUsedSchemaNames(operations, schemas);
}
const EMPTY_CIRCULAR_SET = /* @__PURE__ */ new Set();
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
function findCircularSchemasFromGraph(graph) {
	const circular = /* @__PURE__ */ new Set();
	for (const start of graph.keys()) {
		const visited = /* @__PURE__ */ new Set();
		const stack = [...graph.get(start) ?? []];
		while (stack.length > 0) {
			const node = stack.pop();
			if (node === start) {
				circular.add(start);
				break;
			}
			if (visited.has(node)) continue;
			visited.add(node);
			const next = graph.get(node);
			if (next) for (const r of next) stack.push(r);
		}
	}
	return circular;
}
const findCircularSchemasMemo = memoize(/* @__PURE__ */ new WeakMap(), (schemas) => {
	const graph = /* @__PURE__ */ new Map();
	for (const schema of schemas) {
		if (!schema.name) continue;
		graph.set(schema.name, collectReferencedSchemaNames(schema));
	}
	return findCircularSchemasFromGraph(graph);
});
/**
* Finds every schema that takes part in a circular dependency chain, including direct self-loops.
*
* Wrap the returned schema positions in a deferred construct (a lazy getter or `z.lazy(() => …)`) so
* the generated code does not recurse forever. Refs are followed by name only, so the walk stays
* linear in the size of the schema graph.
*
* @note Call this once on the full graph, then check individual schemas with `containsCircularRef()`.
*/
function findCircularSchemas(schemas) {
	if (schemas.length === 0) return EMPTY_CIRCULAR_SET;
	return findCircularSchemasMemo(schemas);
}
//#endregion
//#region src/factory.ts
var factory_exports = /* @__PURE__ */ __exportAll({
	createArrowFunction: () => createArrowFunction,
	createBreak: () => createBreak,
	createConst: () => createConst,
	createContent: () => createContent,
	createExport: () => createExport,
	createFile: () => createFile,
	createFunction: () => createFunction,
	createImport: () => createImport,
	createInput: () => createInput,
	createJsx: () => createJsx,
	createOperation: () => createOperation,
	createOutput: () => createOutput,
	createParameter: () => createParameter,
	createProperty: () => createProperty,
	createRequestBody: () => createRequestBody,
	createResponse: () => createResponse,
	createSchema: () => createSchema,
	createSource: () => createSource,
	createText: () => createText,
	createType: () => createType,
	update: () => update
});
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
function update(node, changes) {
	for (const key in changes) if (changes[key] !== node[key]) return {
		...node,
		...changes
	};
	return node;
}
//#endregion
//#region src/exports.ts
var exports_exports = /* @__PURE__ */ __exportAll({
	applyMacros: () => applyMacros,
	arrowFunctionDef: () => arrowFunctionDef,
	breakDef: () => breakDef,
	collect: () => collect,
	collectImportedRefNames: () => collectImportedRefNames,
	collectSync: () => collectSync,
	collectUsedSchemaNames: () => collectUsedSchemaNames,
	composeMacros: () => composeMacros,
	constDef: () => constDef,
	contentDef: () => contentDef,
	createPrinter: () => createPrinter,
	defineMacro: () => defineMacro,
	defineNode: () => defineNode,
	exportDef: () => exportDef,
	extractStringsFromNodes: () => extractStringsFromNodes,
	factory: () => factory_exports,
	fileDef: () => fileDef,
	findCircularSchemas: () => findCircularSchemas,
	findCircularSchemasFromGraph: () => findCircularSchemasFromGraph,
	functionDef: () => functionDef,
	importDef: () => importDef,
	inputDef: () => inputDef,
	isHttpOperationNode: () => isHttpOperationNode,
	jsxDef: () => jsxDef,
	narrowSchema: () => narrowSchema,
	nodeDefs: () => nodeDefs,
	operationDef: () => operationDef,
	optionality: () => optionality,
	outputDef: () => outputDef,
	parameterDef: () => parameterDef,
	propertyDef: () => propertyDef,
	requestBodyDef: () => requestBodyDef,
	resolveRefName: () => resolveRefName,
	responseDef: () => responseDef,
	schemaDef: () => schemaDef,
	schemaTypes: () => schemaTypes,
	sourceDef: () => sourceDef,
	textDef: () => textDef,
	transform: () => transform,
	typeDef: () => typeDef
});
//#endregion
exports.applyMacros = applyMacros;
exports.arrowFunctionDef = arrowFunctionDef;
Object.defineProperty(exports, "ast", {
	enumerable: true,
	get: function() {
		return exports_exports;
	}
});
exports.breakDef = breakDef;
exports.collect = collect;
exports.collectImportedRefNames = collectImportedRefNames;
exports.collectSync = collectSync;
exports.collectUsedSchemaNames = collectUsedSchemaNames;
exports.composeMacros = composeMacros;
exports.constDef = constDef;
exports.contentDef = contentDef;
exports.createPrinter = createPrinter;
exports.defineMacro = defineMacro;
exports.defineNode = defineNode;
exports.exportDef = exportDef;
exports.extractStringsFromNodes = extractStringsFromNodes;
Object.defineProperty(exports, "factory", {
	enumerable: true,
	get: function() {
		return factory_exports;
	}
});
exports.fileDef = fileDef;
exports.findCircularSchemas = findCircularSchemas;
exports.findCircularSchemasFromGraph = findCircularSchemasFromGraph;
exports.functionDef = functionDef;
exports.importDef = importDef;
exports.inputDef = inputDef;
exports.isHttpOperationNode = isHttpOperationNode;
exports.jsxDef = jsxDef;
exports.narrowSchema = narrowSchema;
exports.nodeDefs = nodeDefs;
exports.operationDef = operationDef;
exports.optionality = optionality;
exports.outputDef = outputDef;
exports.parameterDef = parameterDef;
exports.propertyDef = propertyDef;
exports.requestBodyDef = requestBodyDef;
exports.resolveRefName = resolveRefName;
exports.responseDef = responseDef;
exports.schemaDef = schemaDef;
exports.schemaTypes = schemaTypes;
exports.sourceDef = sourceDef;
exports.textDef = textDef;
exports.transform = transform;
exports.typeDef = typeDef;

//# sourceMappingURL=index.cjs.map