/**
 * Ambient declarations for the `kubb:gen` virtual modules that `unplugin-kubb` serves when
 * `virtual: true` is set. Generation runs in memory, so there is no file on disk to type against
 * and the modules are typed loosely as `any`. Import the generated symbols by the names Kubb emits.
 *
 * Reference this file once in your project so the editor stops flagging the imports, either with a
 * triple-slash directive in any source or `.d.ts` file:
 *
 * ```ts
 * /// <reference types="unplugin-kubb/virtual" />
 * ```
 *
 * or by adding it to `compilerOptions.types` in your tsconfig:
 *
 * ```json
 * { "compilerOptions": { "types": ["unplugin-kubb/virtual"] } }
 * ```
 *
 * @example
 * ```ts
 * import { getPets } from 'kubb:gen'
 * import { getPetById } from 'kubb:gen/client/getPetById.ts'
 * ```
 */

declare module 'kubb:gen'

declare module 'kubb:gen/*'
