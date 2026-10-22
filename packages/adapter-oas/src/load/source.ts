import { exists, getErrorMessage, read, toError } from '@internals/utils'
import { Diagnostics } from '@kubb/kit'
import { CORE_SCHEMA, load } from 'js-yaml'
import { parse } from 'yaml'

export const urlRegExp = /^https?:\/+/i

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

  return parseYaml(data, {
    origin: sourcePath,
    help: 'Fix the syntax at the reported line, or check that `input` points at the spec and not an HTML page.',
  })
}

/**
 * Parses a YAML (or JSON) spec. A syntax error throws `KUBB_INVALID_DOCUMENT` naming `origin`,
 * with the parser message, which keeps the line and column.
 *
 * JSON is valid YAML, so one parser handles both. `js-yaml` parses about ten times faster than
 * `yaml`, and unlike `JSON.parse` it rejects duplicate keys instead of keeping the last one. Its
 * core schema keeps timestamps as strings and `<<` as a plain key, as `yaml` does for YAML 1.2.
 */
export function parseYaml(data: string, { origin, help }: { origin: string; help: string }): object {
  try {
    const document = load(data, { schema: CORE_SCHEMA })
    if (document !== undefined) return document as object
  } catch {
    // `yaml` parses it again below to report the error with its line and column.
  }
  try {
    return parse(data) as object
  } catch (error) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidDocument,
      severity: 'error',
      message: `Cannot parse ${origin} as JSON or YAML: ${getErrorMessage(error)}`,
      help,
      location: { kind: 'config' },
      cause: toError(error),
    })
  }
}

/**
 * Throws a coded `KUBB_INPUT_NOT_FOUND` diagnostic when a local input path does not exist.
 * URLs are skipped: a remote input reports `KUBB_INPUT_REQUEST_FAILED` or `KUBB_INPUT_UNREACHABLE`
 * from the request itself. A malformed but readable file is left for `parseDocument` to surface
 * its parse error instead.
 */
export async function assertInputExists(input: string): Promise<void> {
  if (urlRegExp.test(input)) {
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
