import { exists, read } from '@internals/utils'
import { Diagnostics } from '@kubb/core'
import { parse } from 'yaml'

const urlRegExp = /^https?:\/+/i

async function readSource(sourcePath: string): Promise<string> {
  if (urlRegExp.test(sourcePath)) {
    // api-ref-bundler joins relative refs with posix normalization, collapsing `https://` to
    // `https:/`. The WHATWG URL parser restores the double slash.
    const url = new URL(sourcePath)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Cannot fetch the OAS document at ${url.href} (HTTP ${response.status})`)
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
 * URLs are skipped, and a malformed but readable file is left for `parseDocument` to surface
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
