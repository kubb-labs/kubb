/**
 * Parser utilities and types for creating extensible validation library parsers.
 *
 * This module provides:
 * - Base types for parser options and keyword mappers
 * - Helper functions for common parser operations (coercion checks, mini mode)
 * - Utilities for supporting functional API style validation libraries
 * - Factory function for creating parsers with consistent patterns
 *
 * Use these utilities when creating new parser implementations for validation
 * libraries like Zod, Valibot, ArkType, or custom validation systems.
 *
 * @module parsers
 */

export type {
  BaseKeywordMapper,
  BaseParserOptions,
  CoercionOptions,
  MiniModeSupport,
  MiniModifiers,
  Parser,
  ParserContext,
  VersionedParserOptions,
} from './ParserHelpers.ts'
export { shouldCoerce } from './ParserHelpers.ts'
export { extractMiniModifiers, filterMiniModifiers, miniModifierKeywords } from './miniHelpers.ts'
export { createParser, type CreateParserConfig } from './createParser.ts'
