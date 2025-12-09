import type { Schema } from '../SchemaMapper.ts'

/**
 * Base types and utilities for creating extensible parsers.
 *
 * This module provides common types and helper functions that can be used
 * by validation library parsers (Zod, Valibot, etc.) to maintain consistency
 * and reduce duplication across parser implementations.
 *
 * @module ParserHelpers
 */

/**
 * Base options that all parsers should support.
 * Specific parser implementations can extend this with their own options.
 */
export type BaseParserOptions = {
  /**
   * Custom mapper for overriding specific schema property outputs.
   * Keys are property names, values are the custom output strings.
   */
  mapper?: Record<string, string>

  /**
   * Whether validation can be overridden (used in faker for data generation).
   */
  canOverride?: boolean
}

/**
 * Options for parsers that support coercion/transformation.
 * Extended by parsers like Zod that can coerce types.
 */
export type CoercionOptions = {
  /**
   * Enable coercion for all types, or selectively for specific types.
   */
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
}

/**
 * Helper to check if coercion should be enabled for a specific type.
 */
export function shouldCoerce(coercion: CoercionOptions['coercion'] | undefined, type: 'dates' | 'strings' | 'numbers'): boolean {
  if (coercion === undefined) {
    return false
  }
  if (typeof coercion === 'boolean') {
    return coercion
  }

  return !!coercion[type]
}

/**
 * Type guard to check if a parser supports mini mode (functional API style).
 * Mini mode typically means using functional wrappers instead of chainable methods.
 */
export type MiniModeSupport = {
  /**
   * Whether the parser is in mini mode.
   */
  mini?: boolean
}

/**
 * Options for parsers that support versioning.
 * Some libraries (like Zod) have different API versions.
 */
export type VersionedParserOptions = {
  /**
   * Version of the validation library being used.
   */
  version?: string
}

/**
 * Modifiers that can be applied to schemas in mini mode.
 * These represent wrapping functions rather than chainable methods.
 */
export type MiniModifiers = {
  hasOptional?: boolean
  hasNullable?: boolean
  hasNullish?: boolean
  defaultValue?: string | number | true | object
}

/**
 * Base interface that all schema keyword mappers should implement.
 * This provides a consistent structure for mapping OpenAPI schema keywords
 * to validation library syntax.
 *
 * @template TOutput - The output type (typically string for code generation)
 */
export type BaseKeywordMapper<TOutput = string | null | undefined> = {
  /**
   * Maps each schema keyword to a function that generates the appropriate
   * validation code. Functions can accept various arguments based on the
   * complexity of the schema keyword.
   */
  [key: string]: ((...args: any[]) => TOutput | undefined) | undefined
}

/**
 * Context provided to parser functions containing the current schema tree state.
 * This matches the SchemaTree type from SchemaMapper but is documented here
 * for parser implementers.
 */
export type ParserContext = {
  /**
   * The complete schema being parsed.
   */
  schema: any

  /**
   * Parent schema node in the tree.
   */
  parent: Schema | undefined

  /**
   * Current schema node being processed.
   */
  current: Schema

  /**
   * Sibling schema nodes at the same level.
   */
  siblings: Schema[]

  /**
   * Property name (for object properties).
   */
  name?: string
}

/**
 * A parser function that converts schema nodes to output code.
 *
 * @template TOptions - Parser-specific options
 * @template TOutput - Output type (typically string)
 */
export type Parser<TOptions extends BaseParserOptions = BaseParserOptions, TOutput = string> = (
  context: ParserContext,
  options: TOptions,
) => TOutput | null | undefined
