/**
 * `@kubb/transformer` – high-performance string transformation utilities.
 *
 * This entry point tries to load the native NAPI-RS binary for the current
 * platform.  If the binary is not present (e.g. the package was installed
 * without a pre-built binary for this platform), it falls back to a pure
 * JavaScript implementation that is behaviourally identical.
 *
 * The public API is the same as `internals/utils/src/casing.ts` so any
 * package can switch to `@kubb/transformer` as a drop-in replacement.
 */

import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Import fallback implementations (always available).
import {
  camelCase as _camelCaseFallback,
  pascalCase as _pascalCaseFallback,
  snakeCase as _snakeCaseFallback,
  screamingSnakeCase as _screamingSnakeCaseFallback,
  transformReservedWord as _transformReservedWordFallback,
  getRelativePath as _getRelativePathFallback,
} from './fallback.js'

const _require = createRequire(import.meta.url)
const _dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Attempts to load the platform-specific native NAPI-RS `.node` binary.
 * Returns the module object on success, or `null` if unavailable.
 *
 * @returns {object | null}
 */
function loadNative() {
  try {
    const { platform, arch } = process

    // Map Node.js platform/arch to the NAPI-RS binary naming convention.
    const platformMap = {
      'linux-x64': 'linux-x64-gnu',
      'linux-arm64': 'linux-arm64-gnu',
      'linux-arm': 'linux-arm-gnueabihf',
      'darwin-x64': 'darwin-x64',
      'darwin-arm64': 'darwin-arm64',
      'win32-x64': 'win32-x64-msvc',
      'win32-arm64': 'win32-arm64-msvc',
      'win32-ia32': 'win32-ia32-msvc',
    }

    const platformKey = `${platform}-${arch}`
    const platformSuffix = platformMap[platformKey]

    if (platformSuffix) {
      const binaryPath = join(_dirname, `kubb-transformer.${platformSuffix}.node`)
      if (existsSync(binaryPath)) {
        return _require(binaryPath)
      }
    }

    // Development builds produce a generic `kubb-transformer.node` in the
    // package root (via `cargo build --release` + manual copy).
    const devBinaryPath = join(_dirname, 'kubb-transformer.node')
    if (existsSync(devBinaryPath)) {
      return _require(devBinaryPath)
    }

    return null
  } catch {
    return null
  }
}

const _native = loadNative()

// ---------------------------------------------------------------------------
// Exported functions – native when available, otherwise pure JS fallback.
// ---------------------------------------------------------------------------

/**
 * Converts `text` to camelCase.
 * When `isFile` is `true`, dot-separated segments are each cased independently
 * and joined with `/`.
 *
 * @param {string} text
 * @param {{ isFile?: boolean; prefix?: string; suffix?: string }} [options]
 * @returns {string}
 *
 * @example
 * camelCase('hello-world')                   // 'helloWorld'
 * camelCase('pet.petId', { isFile: true })   // 'pet/petId'
 */
export const camelCase = _native?.camelCase ?? _camelCaseFallback

/**
 * Converts `text` to PascalCase.
 * When `isFile` is `true`, the last dot-separated segment is PascalCased
 * and earlier segments are camelCased.
 *
 * @param {string} text
 * @param {{ isFile?: boolean; prefix?: string; suffix?: string }} [options]
 * @returns {string}
 *
 * @example
 * pascalCase('hello-world')                  // 'HelloWorld'
 * pascalCase('pet.petId', { isFile: true })  // 'pet/PetId'
 */
export const pascalCase = _native?.pascalCase ?? _pascalCaseFallback

/**
 * Converts `text` to snake_case.
 *
 * @param {string} text
 * @param {{ prefix?: string; suffix?: string }} [options]
 * @returns {string}
 *
 * @example
 * snakeCase('helloWorld')  // 'hello_world'
 * snakeCase('Hello-World') // 'hello_world'
 */
export const snakeCase = _native?.snakeCase ?? _snakeCaseFallback

/**
 * Converts `text` to SCREAMING_SNAKE_CASE.
 *
 * @param {string} text
 * @param {{ prefix?: string; suffix?: string }} [options]
 * @returns {string}
 *
 * @example
 * screamingSnakeCase('helloWorld') // 'HELLO_WORLD'
 */
export const screamingSnakeCase = _native?.screamingSnakeCase ?? _screamingSnakeCaseFallback

/**
 * Prefixes `word` with `_` when it is a reserved JavaScript/Java identifier
 * or starts with a digit (0–9).
 *
 * Uses an O(1) hash-set lookup in the native binary vs O(n) `Array.includes()`
 * in the JavaScript fallback.
 *
 * @param {string} word
 * @returns {string}
 *
 * @example
 * transformReservedWord('delete')  // '_delete'
 * transformReservedWord('1test')   // '_1test'
 * transformReservedWord('myVar')   // 'myVar'
 */
export const transformReservedWord = _native?.transformReservedWord ?? _transformReservedWordFallback

/**
 * Returns the relative path from `rootDir` to `filePath`, always using
 * forward slashes and prefixed with `./` when not already traversing upward.
 *
 * @param {string} rootDir
 * @param {string} filePath
 * @returns {string}
 *
 * @example
 * getRelativePath('/project/src', '/project/src/gen/types.ts')  // './gen/types.ts'
 * getRelativePath('/project/src/gen', '/project/src')            // './..'
 */
export const getRelativePath = _native?.getRelativePath ?? _getRelativePathFallback
