import type { PluginType, Template } from './types.ts'

/** Defines a template for one node `kind`. `render` gets that node, typed by `kind`. Register it with `addTemplate`. */
export function defineTemplate<TOptions extends PluginType = PluginType, TElement = unknown>(
  template: Template<TOptions, TElement>,
): Template<TOptions, TElement> {
  return template
}
