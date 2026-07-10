/** A union of known literals that still accepts any other value of `Base`, without collapsing
 * the literals away. Editors keep autocompleting the known members while arbitrary strings stay
 * assignable.
 *
 * @example
 * ```ts
 * type PluginName = LiteralUnion<'plugin-ts' | 'plugin-zod'>
 * const a: PluginName = 'plugin-ts' // autocompletes
 * const b: PluginName = 'anything'  // still allowed
 * ```
 */
export type LiteralUnion<T extends Base, Base = string> = T | (Base & {})
