import type { PluginType, Template, TemplateOf } from './types.ts'

// One overload per kind, so the template keeps its kind and another template can call its `render`.
/** Defines a template for one node `kind`. `render` gets that node, typed by `kind`. Register it with `addTemplate`. */
export function defineTemplate<TOptions extends PluginType = PluginType, TElement = unknown>(
  template: TemplateOf<'Schema', TOptions, TElement>,
): TemplateOf<'Schema', TOptions, TElement>
export function defineTemplate<TOptions extends PluginType = PluginType, TElement = unknown>(
  template: TemplateOf<'Operation', TOptions, TElement>,
): TemplateOf<'Operation', TOptions, TElement>
export function defineTemplate<TOptions extends PluginType = PluginType, TElement = unknown>(
  template: TemplateOf<'Operations', TOptions, TElement>,
): TemplateOf<'Operations', TOptions, TElement>
export function defineTemplate(template: Template): Template {
  return template
}
