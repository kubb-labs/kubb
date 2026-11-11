import * as graph from './graph/index.ts'
import * as http from './http/index.ts'
import * as ref from './ref/index.ts'
import * as schema from './schema/index.ts'

/** @deprecated Use `ast.ref.isBare`. Removed in Kubb v6. */
export const isBareRef = ref.isBare

/** @deprecated Use `ast.ref.merge`. Removed in Kubb v6. */
export const mergeRefWithSchema = ref.merge

/** @deprecated Use `ast.ref.name`. Removed in Kubb v6. */
export const refName = ref.name

/** @deprecated Use `ast.ref.resolve`. Removed in Kubb v6. */
export const resolveRef = ref.resolve

/** @deprecated Use `ast.ref.name`. Removed in Kubb v6. */
export const resolveRefName = ref.name

/** @deprecated Use `ast.graph.importedNames`. Removed in Kubb v6. */
export const collectImportedRefNames = graph.importedNames

/** @deprecated Use `ast.graph.refs`. Removed in Kubb v6. */
export const collectSchemaRefs = graph.refs

/** @deprecated Use `ast.graph.usedNames`. Removed in Kubb v6. */
export const collectUsedSchemaNames = graph.usedNames

/** @deprecated Use `ast.graph.circular`. Removed in Kubb v6. */
export const findCircularSchemas = graph.circular

/** @deprecated Use `ast.schema.literalValues`. Removed in Kubb v6. */
export const getSchemaLiteralValues = schema.literalValues

/** @deprecated Use `ast.schema.discriminatorName`. Removed in Kubb v6. */
export const inferDiscriminatorPropertyName = schema.discriminatorName

/** @deprecated Use `ast.schema.properties`. Removed in Kubb v6. */
export const resolveSchemaProperties = schema.properties

/** @deprecated Use `ast.http.is`. Removed in Kubb v6. */
export const isHttpOperationNode = http.is
