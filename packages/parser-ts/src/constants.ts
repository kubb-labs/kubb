/**
 * Number of spaces used to indent a nested block when pretty-printing.
 */
export const INDENT_SIZE = 2 as const

/**
 * Matches the trailing `.<ext>` segment of a path (keeps segments like `foo.bar.ts`
 * intact by only trimming the last run of non-`/`/`.` characters).
 */
export const FILE_EXTENSION_PATTERN = /\.[^/.]+$/

/**
 * Matches Windows-style backslash path separators.
 */
export const WINDOWS_PATH_SEPARATOR = /\\/g

/**
 * Matches `*\/` in free-form text so JSDoc bodies can neutralise premature
 * comment terminators (`*\/` → `* /`).
 */
export const JSDOC_TERMINATOR_PATTERN = /\*\//g

/**
 * Matches carriage returns for normalising CRLF/CR line endings to LF.
 */
export const CARRIAGE_RETURN_PATTERN = /\r/g

/**
 * Matches CRLF sequences used when normalising TypeScript printer output.
 */
export const CRLF_PATTERN = /\r\n/g

/**
 * Matches an identifier that starts with a digit — JavaScript disallows this
 * so the printer prefixes such names with `_`.
 */
export const LEADING_DIGIT_PATTERN = /^\d/

/**
 * Relative path prefix used to detect traversal segments (`../`).
 */
export const PARENT_DIRECTORY_PREFIX = '../' as const

/**
 * Relative path prefix used when resolving imports within the output root.
 */
export const CURRENT_DIRECTORY_PREFIX = './' as const
