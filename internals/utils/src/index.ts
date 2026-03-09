// ─── Async / Promise ─────────────────────────────────────────────────────────
export type { PossiblePromise } from './promise.ts'
export { isPromise, isPromiseFulfilledResult, isPromiseRejectedResult } from './promise.ts'
export { AsyncEventEmitter } from './asyncEventEmitter.ts'

// ─── Cache ────────────────────────────────────────────────────────────────────
export { Cache } from './cache.ts'

// ─── Colors / ANSI ───────────────────────────────────────────────────────────
export { formatMsWithColor, getIntro, randomCliColor, randomColors } from './colors.ts'

// ─── Env ─────────────────────────────────────────────────────────────────────
export { canUseTTY, isCIEnvironment, isGitHubActions } from './env.ts'

// ─── Errors ───────────────────────────────────────────────────────────────────
export { BuildError, getErrorMessage, toCause, toError, ValidationPluginError } from './errors.ts'

// ─── File system ──────────────────────────────────────────────────────────────
export { clean } from './clean.ts'
export { exists, existsSync } from './exists.ts'
export { getRelativePath } from './fs.ts'
export { read, readSync } from './read.ts'
export { write } from './write.ts'

// ─── JSDoc ────────────────────────────────────────────────────────────────────
export { buildJSDoc } from './jsdoc.ts'

// ─── Names ────────────────────────────────────────────────────────────────────
export { getUniqueName, setUniqueName } from './names.ts'

// ─── Network ─────────────────────────────────────────────────────────────────
export { executeIfOnline, isOnline } from './network.ts'

// ─── Object ───────────────────────────────────────────────────────────────────
export { getNestedAccessor, serializePluginOptions, stringify, stringifyObject } from './object.ts'

// ─── Package manager ─────────────────────────────────────────────────────────
export { detectPackageManager, packageManagers } from './packageManager.ts'
export type { PackageManagerInfo, PackageManagerName } from './packageManager.ts'

// ─── Process ──────────────────────────────────────────────────────────────────
export { spawnAsync } from './spawnAsync.ts'

// ─── RegExp ───────────────────────────────────────────────────────────────────
export { toRegExpString } from './regexp.ts'

// ─── Reserved words ───────────────────────────────────────────────────────────
export { isValidVarName, transformReservedWord } from './reserved.ts'

// ─── Shell ────────────────────────────────────────────────────────────────────
export { tokenize } from './shell.ts'

// ─── String ───────────────────────────────────────────────────────────────────
export { camelCase, pascalCase, screamingSnakeCase, snakeCase } from './casing.ts'
export { escape, jsStringEscape, maskString, trimQuotes } from './string.ts'

// ─── Time ─────────────────────────────────────────────────────────────────────
export { formatHrtime, formatMs, getElapsedMs } from './time.ts'

// ─── Token ────────────────────────────────────────────────────────────────────
export { generateToken, hashToken } from './token.ts'

// ─── URL ─────────────────────────────────────────────────────────────────────
export type { URLObject } from './urlPath.ts'
export { URLPath } from './urlPath.ts'
