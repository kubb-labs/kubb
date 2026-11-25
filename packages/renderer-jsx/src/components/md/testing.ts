import type { JsxRenderer } from '../../types.ts'

/**
 * Returns the `value` of the first code node in the first source of the first rendered file.
 */
export function firstValue(renderer: JsxRenderer): string | undefined {
  const node = renderer.files[0]?.sources[0]?.nodes?.[0]

  return node && 'value' in node ? node.value : undefined
}
