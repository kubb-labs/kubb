import type { StatusCode } from '../nodes/response.ts'

const classByRange = new Map([
  ['1xx', 1],
  ['2xx', 2],
  ['3xx', 3],
  ['4xx', 4],
  ['5xx', 5],
])

/**
 * The class digit of a status code or range, such as `2` for `201` and `2xx`, or `null` for `default`.
 *
 * @example
 * ```ts
 * ast.http.status.class('2xx') // 2
 * ```
 */
function statusClass(statusCode: StatusCode | number | (string & {})): number | null {
  const rangeClass = classByRange.get(String(statusCode))
  if (rangeClass) return rangeClass
  const code = Number(statusCode)
  return Number.isNaN(code) ? null : Math.floor(code / 100)
}

export { statusClass as class }

/**
 * Whether the status code or range is a `2xx` success.
 *
 * @example
 * ```ts
 * ast.http.status.isSuccess('201') // true
 * ```
 */
export function isSuccess(statusCode: StatusCode | number | (string & {})): boolean {
  return statusClass(statusCode) === 2
}

/**
 * Whether the status code or range is a `4xx` or `5xx` error. `default` is neither a success nor an error.
 *
 * @example
 * ```ts
 * ast.http.status.isError('default') // false
 * ```
 */
export function isError(statusCode: StatusCode | number | (string & {})): boolean {
  const code = statusClass(statusCode)
  return code !== null && code >= 4
}
