/**
 * The runtime expression forms this adapter recognizes, from the
 * [Arazzo runtime expression grammar](https://spec.openapis.org/arazzo/latest.html#runtime-expressions).
 *
 * Expressions are matched, never evaluated: Kubb resolves what a value's type is, and whatever
 * executes the workflow resolves what it holds.
 */

/**
 * `$sourceDescriptions.<name>.<field>`, how a step names the source description its target lives in.
 *
 * @example
 * ```ts
 * SOURCE_EXPRESSION.exec('$sourceDescriptions.petStore.loginUser') // ['…', 'petStore', 'loginUser']
 * ```
 */
export const SOURCE_EXPRESSION = /^\$sourceDescriptions\.([^.]+)\.(.+)$/

/**
 * An `operationPath`: an embedded `{$sourceDescriptions.<name>.url}` expression followed by a JSON
 * pointer into that document.
 *
 * @example
 * ```ts
 * OPERATION_PATH_EXPRESSION.exec('{$sourceDescriptions.petStore.url}#/paths/~1pet/get')
 * ```
 */
export const OPERATION_PATH_EXPRESSION = /^\{?\$sourceDescriptions\.([^.}]+)\.url\}?#(.+)$/

/**
 * `$components.<section>.<name>`, how a Reusable Object points into `components`.
 */
export const COMPONENT_EXPRESSION = /^\$components\.([^.]+)\.(.+)$/

/**
 * `$steps.<stepId>.outputs.<name>`, how one step (or a workflow) reads another step's output.
 */
export const STEP_OUTPUT_EXPRESSION = /^\$steps\.([^.]+)\.outputs\.(.+)$/
