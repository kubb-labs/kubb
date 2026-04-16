import {
  caseParams,
  childName,
  collect,
  collectImports,
  composeTransformers,
  createArrowFunction,
  createBreak,
  createConst,
  createDiscriminantNode,
  createExport,
  createFile,
  createFunction,
  createFunctionParameter,
  createFunctionParameters,
  createImport,
  createInput,
  createJsx,
  createOperation,
  createOperationParams,
  createOutput,
  createParameter,
  createParameterGroup,
  createParamsType,
  createPrinterFactory,
  createProperty,
  createResponse,
  createSchema,
  createSource,
  createText,
  createType,
  definePrinter,
  enumPropName,
  extractRefName,
  extractStringsFromNodes,
  findDiscriminator,
  httpMethods,
  isInputNode,
  isOperationNode,
  isOutputNode,
  isScalarPrimitive,
  isSchemaNode,
  isStringType,
  mediaTypes,
  mergeAdjacentObjects,
  narrowSchema,
  nodeKinds,
  schemaTypes,
  setDiscriminatorEnum,
  setEnumName,
  simplifyUnion,
  syncOptionality,
  syncSchemaRef,
  transform,
  walk,
} from '@kubb/ast'

/**
 * Namespace object that exposes every runtime helper from `@kubb/ast`.
 *
 * Community plugins can import `ast` from `@kubb/core` instead of depending
 * on `@kubb/ast` directly.
 *
 * @example
 * ```ts
 * import { ast } from '@kubb/core'
 *
 * const file = ast.createFile({ baseName: 'pet.ts', path: 'models/pet.ts' })
 * ```
 */
export const ast = {
  // constants
  httpMethods,
  isScalarPrimitive,
  mediaTypes,
  nodeKinds,
  schemaTypes,
  // factory
  createArrowFunction,
  createBreak,
  createConst,
  createExport,
  createFile,
  createFunction,
  createFunctionParameter,
  createFunctionParameters,
  createImport,
  createInput,
  createJsx,
  createOperation,
  createOutput,
  createParameter,
  createParameterGroup,
  createParamsType,
  createProperty,
  createResponse,
  createSchema,
  createSource,
  createText,
  createType,
  syncOptionality,
  // guards
  isInputNode,
  isOperationNode,
  isOutputNode,
  isSchemaNode,
  narrowSchema,
  // printer
  createPrinterFactory,
  definePrinter,
  // refs
  extractRefName,
  // resolvers
  childName,
  collectImports,
  enumPropName,
  findDiscriminator,
  // transformers
  mergeAdjacentObjects,
  setDiscriminatorEnum,
  setEnumName,
  simplifyUnion,
  // utils
  caseParams,
  createDiscriminantNode,
  createOperationParams,
  extractStringsFromNodes,
  isStringType,
  syncSchemaRef,
  // visitor
  collect,
  composeTransformers,
  transform,
  walk,
} as const
