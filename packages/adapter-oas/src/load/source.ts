import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { exists, getErrorMessage, read, toError } from '@internals/utils'
import { isPublicAddress } from '@kubb/core'
import { Diagnostics } from '@kubb/kit'
import { CORE_SCHEMA, constructFromEvents, parseEvents } from 'js-yaml'
import { parse } from 'yaml'
import { rememberEvents } from '../sourceLocator.ts'

export const urlRegExp = /^https?:\/+/i

/** How long one request for a document or a `$ref` may take before Kubb gives up on it. */
const FETCH_TIMEOUT_MS = 30_000

/**
 * Options for reading a source. `signal` cancels the request. `publicOnly` makes a redirect fail,
 * so a public URL cannot forward the request to a private host.
 */
type ReadOptions = { signal?: AbortSignal; publicOnly?: boolean }

/**
 * Whether `url` names a host that is loopback, private, link-local, or another address that is not
 * public. A host that does not resolve, or not within the request timeout, counts as not public,
 * because the check cannot prove it public. `signal` cancels the lookup.
 *
 * shortcut: the name is resolved again when `fetch` connects, so a host that changes its answer in
 * between can still reach a private address. Upgrade to a pinned lookup, like `@kubb/studio`'s
 * `publicFetch`, if a sandbox needs that guarantee.
 */
export async function isPrivateHost(url: URL, { signal }: { signal?: AbortSignal } = {}): Promise<boolean> {
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(host)) return !isPublicAddress(host)
  // `dns.lookup` takes no signal, so the race settles a lookup that stalls.
  const deadline = withTimeout(signal)
  // An abort that already happened fires no event, so check it before waiting.
  deadline.throwIfAborted()
  const stopped = new Promise<never>((_, reject) => deadline.addEventListener('abort', () => reject(deadline.reason), { once: true }))
  const addresses = await Promise.race([lookup(host, { all: true }), stopped]).catch(() => [])
  signal?.throwIfAborted()
  return addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))
}

function withTimeout(signal: AbortSignal | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

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

async function fetchSource(url: URL, { signal, publicOnly }: ReadOptions): Promise<{ response: Response; body: string }> {
  const deadline = withTimeout(signal)
  try {
    const response = await fetch(url, { signal: deadline, redirect: publicOnly ? 'error' : 'follow' })
    // The body is read here too, so a server that stalls after its headers also hits the timeout.
    return { response, body: response.ok ? await response.text() : '' }
  } catch (error) {
    // A canceled build stops here; only a timeout or a network failure is the server's problem.
    if (signal?.aborted) throw signal.reason
    const reason = deadline.aborted ? `no answer within ${FETCH_TIMEOUT_MS / 1000} seconds` : describeFetchFailure(error)
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputUnreachable,
      severity: 'error',
      message: `Cannot reach ${url.href}: ${reason}`,
      help: 'Check that the host is running and reachable from this machine. For a local server, start it and confirm the port matches the one in `input`.',
      location: { kind: 'config' },
      cause: error instanceof Error ? error : undefined,
    })
  }
}

async function readSource(sourcePath: string, options: ReadOptions): Promise<string> {
  if (urlRegExp.test(sourcePath)) {
    // api-ref-bundler joins relative refs with posix normalization, collapsing `https://` to
    // `https:/`. The WHATWG URL parser restores the double slash.
    const url = new URL(sourcePath)
    const { response, body } = await fetchSource(url, options)

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

    return body
  }

  return read(sourcePath)
}

/**
 * Reads and parses one source file or URL referenced during bundling: YAML/JSON is parsed into an
 * object, Markdown is returned as-is (bundled inline rather than dereferenced).
 */
export async function resolveSource(sourcePath: string, { remember, ...options }: { remember?: boolean } & ReadOptions = {}): Promise<object | string> {
  const data = await readSource(sourcePath, options)

  if (sourcePath.toLowerCase().endsWith('.md')) {
    return data
  }

  // A URL's query string or fragment must not hide the extension.
  const pathname = urlRegExp.test(sourcePath) ? new URL(sourcePath).pathname : sourcePath

  return parseYaml(data, {
    origin: sourcePath,
    json: !/\.ya?ml$/i.test(pathname),
    help: 'Fix the syntax at the reported line, or check that `input` points at the spec and not an HTML page.',
    remember,
  })
}

/**
 * Parses a YAML (or JSON) spec. A syntax error throws `KUBB_INVALID_DOCUMENT` naming `origin`,
 * with the parser message, which keeps the line and column.
 *
 * With `json` (the default), a document that starts with `{` or `[` goes through `JSON.parse`
 * first, about ten times faster than `js-yaml` on a JSON spec. A duplicate key then keeps the last
 * value, as every JSON parser does. YAML flow syntax also starts with `{`, so a parse failure falls
 * through to YAML. Pass `json: false` for a source known to be YAML.
 *
 * `js-yaml` parses about ten times faster than `yaml`, and rejects duplicate keys instead of
 * keeping the last one. Its core schema keeps timestamps as strings and `<<` as a plain key, as
 * `yaml` does for YAML 1.2.
 */
export function parseYaml(
  data: string,
  { origin, help, json = true, remember = false }: { origin: string; help: string; json?: boolean; remember?: boolean },
): object {
  if (json && /^\s*[[{]/.test(data)) {
    try {
      return JSON.parse(data) as object
    } catch {
      // Not JSON, so YAML parses it below.
    }
  }
  try {
    const events = parseEvents(data, {})
    const documents = constructFromEvents(events, { source: data, schema: CORE_SCHEMA })
    if (documents.length === 1 && documents[0] !== undefined) {
      if (remember) rememberEvents({ source: data, events })
      return documents[0] as object
    }
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
