import { callWithString, type NativeExports, native } from './loader.ts'

/**
 * Shared implementation for camelCase and PascalCase conversion.
 * Splits on common word boundaries (spaces, hyphens, underscores, dots, slashes, colons)
 * and capitalizes each word according to `pascal`.
 *
 * When `pascal` is `true` the first word is also capitalized (PascalCase), otherwise only subsequent words are.
 * This is the reference behavior; `convert_case` in `crate/src/lib.rs` must match it.
 */
export function convertCaseJs(text: string, pascal: boolean): string {
  return text
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .split(/[\s\-_./\\:]+/)
    .filter(Boolean)
    .map((word, i) => {
      if (word.length > 1 && word === word.toUpperCase()) return word
      const head = i === 0 && !pascal ? word.charAt(0).toLowerCase() : word.charAt(0).toUpperCase()
      return head + word.slice(1)
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

function bind(exports: NativeExports): typeof convertCaseJs {
  return (text, pascal) => callWithString(exports, text, (ptr, len) => exports.convert_case(ptr, len, pascal ? 1 : 0))
}

/** `convertCaseJs` in Rust, or `null` when the native module did not load. */
export const convertCaseNative: typeof convertCaseJs | null = native ? bind(native) : null
