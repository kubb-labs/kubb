/**
 * Converts a param path (string with dot notation or array of strings) to a JavaScript accessor expression.
 * @param param - The param path, e.g., 'pagination.next.id' or ['pagination', 'next', 'id']
 * @param accessor - The base accessor, e.g., 'lastPage' or 'firstPage'
 * @returns A JavaScript accessor expression, e.g., "lastPage?.['pagination']?.['next']?.['id']", or undefined if param is empty
 *
 * @example
 * ```ts
 * getNestedAccessor('pagination.next.id', 'lastPage')
 * // returns: "lastPage?.['pagination']?.['next']?.['id']"
 *
 * getNestedAccessor(['pagination', 'next', 'id'], 'lastPage')
 * // returns: "lastPage?.['pagination']?.['next']?.['id']"
 *
 * getNestedAccessor('', 'lastPage')
 * // returns: undefined
 * ```
 */
export function getNestedAccessor(param: string | string[], accessor: string): string | undefined {
  const parts = Array.isArray(param) ? param : param.split('.')
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
    return undefined
  }
  return parts.reduce((acc, part) => `${acc}?.['${part}']`, accessor)
}
