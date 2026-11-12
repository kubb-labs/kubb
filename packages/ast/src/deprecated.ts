import * as graph from './graph/index.ts'
import * as http from './http/index.ts'
import * as ref from './ref/index.ts'
import * as schema from './schema/index.ts'
import { mergeRefWithSchema as mergeRef } from './utils/refs.ts'

/** @deprecated Use `ast.ref.isBare`. Removed in Kubb v6. */
export const isBareRef = ref.isBare

/** @deprecated Use `ast.ref.sync`. Removed in Kubb v6. */
export const mergeRefWithSchema = mergeRef

/** @deprecated Use `ast.ref.getName`. Removed in Kubb v6. */
export const refName = ref.getName

/** @deprecated Use `ast.ref.resolve`. Removed in Kubb v6. */
export const resolveRef = ref.resolve

/** @deprecated Use `ast.ref.getName`. Removed in Kubb v6. */
export const resolveRefName = ref.getName

/** @deprecated Use `ast.graph.getImportedNames`. Removed in Kubb v6. */
export const collectImportedRefNames = graph.getImportedNames

/** @deprecated Use `ast.graph.getRefs`. Removed in Kubb v6. */
export const collectSchemaRefs = graph.getRefs

/** @deprecated Use `ast.graph.getUsedNames`. Removed in Kubb v6. */
export const collectUsedSchemaNames = graph.getUsedNames

/** @deprecated Use `ast.graph.getCircular`. Removed in Kubb v6. */
export const findCircularSchemas = graph.getCircular

/** @deprecated Use `ast.schema.getLiterals`. Removed in Kubb v6. */
export const getSchemaLiteralValues = schema.getLiterals

/** @deprecated Use `ast.schema.inferDiscriminator`. Removed in Kubb v6. */
export const inferDiscriminatorPropertyName = schema.inferDiscriminator

/** @deprecated Use `ast.schema.findProperties`. Removed in Kubb v6. */
export const resolveSchemaProperties = schema.findProperties

/** @deprecated Use `ast.http.is`. Removed in Kubb v6. */
export const isHttpOperationNode = http.is
