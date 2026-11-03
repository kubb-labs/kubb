/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/**
 * Copy of `@total-typescript/ts-reset`
 * @link
 */
type NonFalsy<T> = T extends false | 0 | '' | null | undefined | 0n ? never : T

/**
 * Copy of `@total-typescript/ts-reset`
 * @link
 */
interface Array<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[]
}

/**
 * Copy of `@total-typescript/ts-reset`
 * @link
 */
interface ReadonlyArray<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[]
}

interface JSON {
  /**
   * Converts a JavaScript Object Notation (JSON) string into an object.
   * @param text A valid JSON string.
   * @param reviver A function that transforms the results. This function is called for each member of the object.
   * If a member contains nested objects, the nested objects are transformed before the parent object is.
   */
  parse(text: string, reviver?: (this: any, key: string, value: any) => any)
}
