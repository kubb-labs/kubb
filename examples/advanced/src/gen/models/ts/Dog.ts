import type { Image } from './Image.ts'

/**
 * Dog
 */
export type Dog = {
  /**
   * @minLength 1
   * @type string
   */
  readonly type: string
  /**
   * @type string
   */
  name: string
  readonly image?: Image
}
