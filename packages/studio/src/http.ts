type PostJsonOptions = {
  headers?: Record<string, string>
  body?: unknown
  /**
   * Studio's device-token polling endpoint returns a body worth reading on 4xx too
   * (`authorization_pending`, `slow_down`, `access_denied`, ...), so set this to read the response
   * instead of throwing.
   */
  ignoreResponseError?: boolean
}

/**
 * Posts JSON to Studio and parses the JSON response. Throws on a non-2xx status with a
 * `statusCode` property, unless `ignoreResponseError` is set.
 */
export async function postJson<T>(url: string, { headers, body, ignoreResponseError }: PostJsonOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = (await response.json().catch(() => undefined)) as T

  if (!response.ok && !ignoreResponseError) {
    throw Object.assign(new Error(`Request to ${url} failed with status ${response.status}`), { statusCode: response.status })
  }

  return data
}
