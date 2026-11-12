import type { ResponseNode, StatusCode } from '../nodes/response.ts'

type StatusInput = StatusCode | number | (string & {}) | Pick<ResponseNode, 'statusCode'>

const classByRange = new Map([
  ['1xx', 1],
  ['2xx', 2],
  ['3xx', 3],
  ['4xx', 4],
  ['5xx', 5],
])

/** The class digit of a status code or range: `2` for `201` and `2xx`, `null` for `default`. */
function statusClass(input: StatusInput): number | null {
  const statusCode = typeof input === 'object' ? input.statusCode : input
  const rangeClass = classByRange.get(String(statusCode))
  if (rangeClass) return rangeClass
  const code = Number(statusCode)
  return Number.isNaN(code) ? null : Math.floor(code / 100)
}

export { statusClass as getClass }

export function isSuccess(statusCode: StatusInput): boolean {
  return statusClass(statusCode) === 2
}

export function isError(statusCode: StatusInput): boolean {
  const code = statusClass(statusCode)
  return code !== null && code >= 4
}

/** One concrete code for a status or range: `200` for `2xx` and `default`, the code itself otherwise. */
export function toCode(input: StatusInput): number {
  const statusCode = typeof input === 'object' ? input.statusCode : input
  const code = Number(statusCode)
  return Number.isNaN(code) ? (statusClass(statusCode) ?? 2) * 100 : code
}
