import { exists, getErrorMessage, read } from '@internals/utils'
import { Diagnostics } from '@kubb/core'
import { parse } from 'yaml'

const urlRegExp = /^https?:\/+/i

/**
 * Node reports every connection failure as `TypeError: fetch failed` and keeps the useful part
 * (`connect ECONNREFUSED 127.0.0.1:8000`) on `cause`, one level deeper again when a host resolves
 * to several addresses and the attempts collect into an `AggregateError`.
 */
function describeFetchFailure(error: unknown): string {
  if (error instanceof AggregateError && error.errors.length > 0) {
    return describeFetchFailure(error.errors[0])
  }
  if (error instanceof Error && error.cause instanceof Error) {
    return describeFetchFailure(error.cause) || error.message
  }

  return getErrorMessage(error)
}

function helpForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return 'The server refused the request. Kubb sends no credentials, so serve the document without authentication or download it and set `input` to the local file.'
  }
  if (status === 404) {
    return 'Check the URL. Open it in a browser or with `curl` to confirm it serves the OpenAPI document.'
  }
  if (status >= 500) {
    return 'The server failed while serving the document. Check that it is healthy, then run Kubb again.'
  }

  return 'Open the URL in a browser or with `curl` to see what the server returns, then point `input` at a URL that serves the OpenAPI document.'
}

async function fetchSource(url: URL): Promise<Response> {
  try {
    return await fetch(url)
  } catch (error) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputUnreachable,
      severity: 'error',
      message: `Cannot reach ${url.href}: ${describeFetchFailure(error)}`,
      help: 'Check that the host is running and reachable from this machine. For a local server, start it and confirm the port matches the one in `input`.',
      location: { kind: 'config' },
      cause: error instanceof Error ? error : undefined,
    })
  }
}

async function readSource(sourcePath: string): Promise<string> {
  if (urlRegExp.test(sourcePath)) {
    // api-ref-bundler joins relative refs with posix normalization, collapsing `https://` to
    // `https:/`. The WHATWG URL parser restores the double slash.
    const url = new URL(sourcePath)
    const response = await fetchSource(url)

    if (!response.ok) {
      const status = response.statusText ? `${response.status} ${response.statusText}` : String(response.status)

      throw new Diagnostics.Error({
        code: Diagnostics.code.inputRequestFailed,
        severity: 'error',
        message: `The server at ${url.href} answered with HTTP ${status} instead of the OpenAPI document.`,
        help: helpForStatus(response.status),
        location: { kind: 'config' },
      })
    }

    return response.text()
  }

  return read(sourcePath)
}

/**
 * Reads and parses one source file or URL referenced during bundling: YAML/JSON is parsed into an
 * object, Markdown is returned as-is (bundled inline rather than dereferenced).
 */
export async function resolveSource(sourcePath: string): Promise<object | string> {
  const data = await readSource(sourcePath)

  if (sourcePath.toLowerCase().endsWith('.md')) {
    return data
  }

  return parse(data) as object
}

/**
 * Throws a coded `KUBB_INPUT_NOT_FOUND` diagnostic when a local input path does not exist.
 * URLs are skipped: a remote input reports `KUBB_INPUT_REQUEST_FAILED` or `KUBB_INPUT_UNREACHABLE`
 * from the request itself. A malformed but readable file is left for `parseDocument` to surface
 * its parse error instead.
 */
export async function assertInputExists(input: string): Promise<void> {
  if (URL.canParse(input)) {
    return
  }
  if (!(await exists(input))) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputNotFound,
      severity: 'error',
      message: `Cannot read the file set as \`input\` (or via \`kubb generate PATH\`): ${input}`,
      help: 'Check that the path exists and is readable, then set it as `input` or pass it as `kubb generate PATH`.',
      location: { kind: 'config' },
    })
  }
}

export { urlRegExp }
