import type { PluginTs } from './types.ts'

type OptionalType = PluginTs['resolvedOptions']['optionalType']
type EnumType = PluginTs['resolvedOptions']['enumType']

/**
 * `optionalType` values that cause a property's type to include `| undefined`.
 */
export const OPTIONAL_ADDS_UNDEFINED = new Set<OptionalType>(['undefined', 'questionTokenAndUndefined'] as const)

/**
 * `optionalType` values that render the property key with a `?` token.
 */
export const OPTIONAL_ADDS_QUESTION_TOKEN = new Set<OptionalType>(['questionToken', 'questionTokenAndUndefined'] as const)

/**
 * `enumType` values that append a `Key` suffix to the generated enum type alias.
 */
export const ENUM_TYPES_WITH_KEY_SUFFIX = new Set<EnumType>(['asConst', 'asPascalConst'] as const)
