/**
 * Character used for a single indent step. Set to `'\t'` to emit tab-indented output.
 */
export const INDENT_CHAR = ' '

/**
 * Number of {@link INDENT_CHAR} repeats that make up one nesting level.
 */
const INDENT_SIZE = 2 as const

/**
 * Indentation unit prepended once per nesting level when pretty-printing.
 */
export const INDENT = INDENT_CHAR.repeat(INDENT_SIZE)

/**
 * Matches only the final `.<ext>` of a path, so a name like `foo.bar.ts` keeps
 * `foo.bar` and loses just `.ts`.
 */
export const FILE_EXTENSION_PATTERN = /\.[^/.]+$/

/**
 * Matches Windows-style backslash path separators.
 */
export const WINDOWS_PATH_SEPARATOR = /\\/g

/**
 * Matches `*\/` in free-form text so JSDoc bodies can neutralize premature
 * comment terminators (`*\/` → `* /`).
 */
export const JSDOC_TERMINATOR_PATTERN = /\*\//g

/**
 * Matches carriage returns for normalizing CRLF/CR line endings to LF.
 */
export const CARRIAGE_RETURN_PATTERN = /\r/g

/**
 * Matches CRLF sequences used when normalizing TypeScript printer output.
 */
export const CRLF_PATTERN = /\r\n/g

/**
 * Matches an identifier that starts with a digit. JavaScript disallows this,
 * so the printer replaces the leading digit with `_`.
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
