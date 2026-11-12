import * as graph from './graph/index.ts'
import * as http from './http/index.ts'
import * as ref from './ref/index.ts'
import * as schema from './schema/index.ts'
import { mergeRefWithSchema as mergeRef } from './utils/refs.ts'
import { createPrinter as createPrinterImpl } from './createPrinter.ts'
import { defineMacro as defineMacroImpl } from './defineMacro.ts'
import * as macro from './macro/index.ts'
import * as node from './node/index.ts'
import { applyOptionality } from './optionality.ts'
import { collect } from './visitor.ts'

/** @deprecated Use `ast.ref.isAlias`. Removed in Kubb v6. */
export const isBareRef = ref.isAlias

/** @deprecated Use `ast.ref.mergeSchema`. Removed in Kubb v6. */
export const mergeRefWithSchema = mergeRef

/** @deprecated Use `ast.ref.getName`. Removed in Kubb v6. */
export const refName = ref.getName

/** @deprecated Use `ast.ref.getSchema`. Removed in Kubb v6. */
export const resolveRef = ref.getSchema

/** @deprecated Use `ast.ref.getName`. Removed in Kubb v6. */
export const resolveRefName = ref.getName

/** @deprecated Use `ast.graph.getImportedNames`. Removed in Kubb v6. */
export const collectImportedRefNames = graph.getImportedNames

/** @deprecated Use `ast.graph.getRefNames`. Removed in Kubb v6. */
export const collectSchemaRefs = graph.getRefNames

/** @deprecated Use `ast.graph.getUsedNames`. Removed in Kubb v6. */
export const collectUsedSchemaNames = graph.getUsedNames

/** @deprecated Use `ast.graph.getCircularNames`. Removed in Kubb v6. */
export const findCircularSchemas = graph.getCircularNames

/** @deprecated Use `ast.schema.getLiterals`. Removed in Kubb v6. */
export const getSchemaLiteralValues = schema.getLiterals

/** @deprecated Use `ast.schema.inferDiscriminator`. Removed in Kubb v6. */
export const inferDiscriminatorPropertyName = schema.inferDiscriminator

/** @deprecated Use `ast.schema.findProperties`. Removed in Kubb v6. */
export const resolveSchemaProperties = schema.findProperties

/** @deprecated Use `ast.http.isOperation`. Removed in Kubb v6. */
export const isHttpOperationNode = http.isOperation

/** @deprecated Use `ast.collect`, which returns the same array. Removed in Kubb v6. */
export const collectSync = collect

/** @deprecated Use `ast.applyOptionality`. Removed in Kubb v6. */
export const optionality = applyOptionality

/** @deprecated Use `ast.node.getText`. Removed in Kubb v6. */
export const extractStringsFromNodes = node.getText

/** @deprecated Use `ast.macro.compareOrder`. Removed in Kubb v6. */
export const compareEnforce = macro.compareOrder

/** @deprecated Use `createPrinter` from `@kubb/kit`. Removed in Kubb v6. */
export const createPrinter = createPrinterImpl

/** @deprecated Use `defineMacro` from `@kubb/kit`. Removed in Kubb v6. */
export const defineMacro = defineMacroImpl

/** @deprecated Use `ast.macro.apply`. Removed in Kubb v6. */
export const applyMacros = macro.apply

/** @deprecated Use `ast.node.kinds`. Removed in Kubb v6. */
export const nodeKinds = node.kinds

/** @deprecated Use `ast.schema.types`. Removed in Kubb v6. */
export const schemaTypes = schema.types

/** @deprecated Use `ast.schema.find`. Removed in Kubb v6. */
export const findSchema = schema.find

/** @deprecated Use `ast.schema.narrow`. Removed in Kubb v6. */
export const narrowSchema = schema.narrow
