/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/**
 * Copy of `@total-typescript/ts-reset`
 * @link 
 */
type NonFalsy<T> = T extends false | 0 | "" | null | undefined | 0n
? never
: T;

/**
 * Copy of `@total-typescript/ts-reset`
 * @link 
 */
interface Array<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[];
}

/**
 * Copy of `@total-typescript/ts-reset`
 * @link 
 */
interface ReadonlyArray<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[];
}

