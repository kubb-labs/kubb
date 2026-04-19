/** A value that may already be resolved or still pending.
 *
 * @example
 * ```ts
 * function load(id: string): PossiblePromise<string> {
 *   return cache.get(id) ?? fetchRemote(id)
 * }
 * ```
 */
export type PossiblePromise<T> = Promise<T> | T;

/** Returns `true` when `result` is a thenable `Promise`.
 *
 * @example
 * ```ts
 * isPromise(Promise.resolve(1)) // true
 * isPromise(42)                 // false
 * ```
 */
export function isPromise<T>(result: PossiblePromise<T>): result is Promise<T> {
  return (
    result !== null &&
    result !== undefined &&
    typeof (result as Record<string, unknown>)["then"] === "function"
  );
}

/** Returns `true` when `result` is a fulfilled `Promise.allSettled` result.
 *
 * @example
 * ```ts
 * const results = await Promise.allSettled([p1, p2])
 * results.filter(isPromiseFulfilledResult).map((r) => r.value)
 * ```
 */
export function isPromiseFulfilledResult<T = unknown>(
  result: PromiseSettledResult<unknown>,
): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled";
}

/** Returns `true` when `result` is a rejected `Promise.allSettled` result with a typed `reason`.
 *
 * @example
 * ```ts
 * const results = await Promise.allSettled([p1, p2])
 * results.filter(isPromiseRejectedResult<Error>).map((r) => r.reason.message)
 * ```
 */
export function isPromiseRejectedResult<T>(
  result: PromiseSettledResult<unknown>,
): result is Omit<PromiseRejectedResult, "reason"> & { reason: T } {
  return result.status === "rejected";
}
