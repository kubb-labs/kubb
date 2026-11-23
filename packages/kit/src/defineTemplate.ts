import type { PluginType, Template } from './types.ts'

/**
 * Defines a template: the files a plugin writes for each node of one `kind`. `render` gets that
 * node, typed by `kind`, and returns JSX, a `FileNode`, `Array<FileNode>`, or `null` to skip it.
 * Register it with `addTemplate`.
 *
 * @example
 * ```tsx
 * export const zodSchema = defineTemplate<PluginZod>({
 *   kind: 'Schema',
 *   render(node, ctx) {
 *     if (!node.name) return null
 *     return <File {...ctx.file(node)}>…</File>
 *   },
 * })
 * ```
 */
export function defineTemplate<TOptions extends PluginType = PluginType, TElement = unknown>(
  template: Template<TOptions, TElement>,
): Template<TOptions, TElement> {
  return template
}
